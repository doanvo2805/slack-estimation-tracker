import { WebClient } from '@slack/web-api';
import crypto from 'crypto';

/**
 * Parse a Slack thread URL to extract channel ID, thread timestamp, and specific message timestamp
 * Supports formats:
 * - https://your-workspace.slack.com/archives/C02SGCP7A1M/p1759458090303149
 * - https://your-workspace.slack.com/archives/C02SGCP7A1M/p1761619158033579?thread_ts=1759458090.303149
 * Returns both the parent thread timestamp (for fetching) and specific message timestamp (for filtering)
 */
export function parseSlackUrl(url: string): { channelId: string; threadTs: string; messageTs?: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Find the channel ID (starts with C, D, or G)
    const channelId = pathParts.find(part => /^[CDG][A-Z0-9]+$/.test(part));

    if (!channelId) {
      return null;
    }

    // Extract the p-prefixed timestamp (specific message clicked)
    const pTimestamp = pathParts.find(part => part.startsWith('p'));
    let messageTs: string | undefined;

    if (pTimestamp) {
      // Convert p1234567890123456 to 1234567890.123456
      const timestamp = pTimestamp.substring(1);
      messageTs = `${timestamp.slice(0, 10)}.${timestamp.slice(10)}`;
    }

    // Check for thread_ts in query params (parent thread)
    const threadTsParam = urlObj.searchParams.get('thread_ts');

    if (threadTsParam && messageTs) {
      // URL has both: use thread_ts to fetch, messageTs for filtering
      return { channelId, threadTs: threadTsParam, messageTs };
    } else if (messageTs) {
      // Only has p-timestamp: use it for both fetching and filtering (same message)
      return { channelId, threadTs: messageTs };
    } else if (threadTsParam) {
      // Only has thread_ts: use it for fetching
      return { channelId, threadTs: threadTsParam };
    }

    return null;
  } catch (error) {
    console.error('Error parsing Slack URL:', error);
    return null;
  }
}

export interface SlackMessage {
  user: string;
  text: string;
  ts: string;
}

/**
 * Fetch messages from a Slack thread with structured data
 */
export async function fetchSlackThreadStructured(channelId: string, threadTs: string): Promise<SlackMessage[]> {
  try {
    // Read token at runtime instead of module initialization
    const slackToken = process.env.SLACK_BOT_TOKEN || '';

    console.log('[DEBUG] Environment check:', {
      hasToken: !!slackToken,
      tokenLength: slackToken.length,
      tokenPrefix: slackToken.substring(0, 10)
    });

    if (!slackToken || slackToken === 'your-slack-bot-token-here') {
      throw new Error('Slack Bot Token is not configured. Please add SLACK_BOT_TOKEN to your .env.local file.');
    }

    // Create client at runtime with the token
    const slackClient = new WebClient(slackToken);

    // Fetch thread replies (includes parent message)
    const threadResult = await slackClient.conversations.replies({
      channel: channelId,
      ts: threadTs,
    });

    if (!threadResult.messages || threadResult.messages.length === 0) {
      throw new Error('No messages found in the thread');
    }

    // Return structured messages with timestamps
    return threadResult.messages.map((msg: any) => ({
      user: msg.user || 'Unknown',
      text: msg.text || '',
      ts: msg.ts || '',
    }));
  } catch (error: any) {
    console.error('Error fetching Slack thread:', error);

    if (error.data?.error === 'missing_scope') {
      throw new Error('Slack bot is missing required permissions. Please add the following scopes: channels:history, groups:history, im:history, mpim:history, channels:read, groups:read');
    }

    if (error.data?.error === 'channel_not_found') {
      throw new Error('Channel not found. Make sure the bot has been added to the channel.');
    }

    if (error.data?.error === 'invalid_auth') {
      throw new Error('Invalid Slack Bot Token. Please check your SLACK_BOT_TOKEN in .env.local');
    }

    throw new Error(error.message || 'Failed to fetch Slack thread');
  }
}

/**
 * Fetch messages from a Slack thread (formatted string for backward compatibility)
 */
export async function fetchSlackThread(channelId: string, threadTs: string): Promise<string> {
  const messages = await fetchSlackThreadStructured(channelId, threadTs);

  // Format messages into a readable thread
  const formattedMessages = messages.map((msg) => {
    return `[${msg.ts}] ${msg.user}: ${msg.text}`;
  });

  return formattedMessages.join('\n\n');
}

/**
 * Fetch Slack thread from URL
 */
export async function fetchSlackThreadFromUrl(url: string): Promise<string> {
  const parsed = parseSlackUrl(url);

  if (!parsed) {
    throw new Error('Invalid Slack URL. Please provide a valid Slack thread link.');
  }

  return fetchSlackThread(parsed.channelId, parsed.threadTs);
}

/**
 * Verify Slack request signature
 * Reference: https://api.slack.com/authentication/verifying-requests-from-slack
 */
export function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  try {
    const signingSecret = process.env.SLACK_SIGNING_SECRET || '';

    console.log('[Signature Verification] Starting verification', {
      hasSigningSecret: !!signingSecret,
      isPlaceholder: signingSecret === 'your-signing-secret-here',
      timestamp,
      hasSignature: !!signature
    });

    if (!signingSecret || signingSecret === 'your-signing-secret-here') {
      console.error('[Signature Verification] SLACK_SIGNING_SECRET is not configured');
      return false;
    }

    // Check timestamp is within 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);

    console.log('[Signature Verification] Timestamp check', {
      currentTime,
      requestTime,
      diff: Math.abs(currentTime - requestTime)
    });

    if (Math.abs(currentTime - requestTime) > 60 * 5) {
      console.error('[Signature Verification] Slack request timestamp is too old');
      return false;
    }

    // Create the signature base string
    const sigBaseString = `v0:${timestamp}:${body}`;

    // Create the HMAC hash
    const hmac = crypto.createHmac('sha256', signingSecret);
    hmac.update(sigBaseString);
    const mySignature = `v0=${hmac.digest('hex')}`;

    console.log('[Signature Verification] Signature comparison', {
      expected: signature.substring(0, 20) + '...',
      computed: mySignature.substring(0, 20) + '...',
      match: mySignature === signature
    });

    // Compare signatures using constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (error) {
    console.error('[Signature Verification] Error verifying Slack signature:', error);
    return false;
  }
}

/**
 * Check if user is authorized to trigger auto-extraction
 */
export function isAuthorizedUser(userId: string): boolean {
  const authorizedUsers = process.env.SLACK_AUTHORIZED_USER_IDS || '';
  const userList = authorizedUsers.split(',').map(id => id.trim());
  return userList.includes(userId);
}

/**
 * Get the configured trigger emoji
 */
export function getTriggerEmoji(): string {
  return process.env.SLACK_TRIGGER_EMOJI || 'chart_increasing';
}
