import { NextRequest, NextResponse } from 'next/server';
import { verifySlackSignature, isAuthorizedUser, getTriggerEmoji } from '@/lib/slack';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get signature headers
    const slackSignature = request.headers.get('x-slack-signature') || '';
    const slackTimestamp = request.headers.get('x-slack-request-timestamp') || '';

    // Verify signature
    if (!verifySlackSignature(rawBody, slackTimestamp, slackSignature)) {
      console.error('Invalid Slack signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the body
    const body = JSON.parse(rawBody);

    // Handle URL verification challenge
    if (body.type === 'url_verification') {
      console.log('Slack URL verification challenge received');
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle event callbacks
    if (body.type === 'event_callback') {
      const event = body.event;

      // Only process reaction_added events
      if (event.type === 'reaction_added') {
        const userId = event.user;
        const emoji = event.reaction;
        const triggerEmoji = getTriggerEmoji();

        console.log('Reaction event received:', {
          user: userId,
          emoji: emoji,
          item_channel: event.item.channel,
          item_ts: event.item.ts,
        });

        // Check if user is authorized
        if (!isAuthorizedUser(userId)) {
          console.log(`User ${userId} is not authorized`);
          return NextResponse.json({ ok: true });
        }

        // Check if emoji matches trigger emoji
        if (emoji !== triggerEmoji) {
          console.log(`Emoji ${emoji} does not match trigger emoji ${triggerEmoji}`);
          return NextResponse.json({ ok: true });
        }

        // Log successful trigger (for now, we'll just log it)
        console.log('✅ Auto-extraction triggered!', {
          user: userId,
          emoji: emoji,
          channel: event.item.channel,
          threadTs: event.item.ts,
        });

        // TODO Phase 2: Queue extraction job asynchronously
        // For now, just return success
        // In Phase 2, we'll call the extraction endpoint here

        return NextResponse.json({ ok: true });
      }

      // Ignore other event types
      console.log('Ignoring event type:', event.type);
      return NextResponse.json({ ok: true });
    }

    // Ignore other callback types
    console.log('Ignoring callback type:', body.type);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing Slack event:', error);

    // Return 200 even on errors to acknowledge receipt
    // Slack will retry if we return an error
    return NextResponse.json({ ok: true });
  }
}
