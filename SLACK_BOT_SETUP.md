# Slack Bot Setup Guide

To enable automatic fetching of Slack threads, you need to create a Slack Bot and configure it with the proper permissions.

## Step 1: Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Select **"From scratch"**
4. Enter App Name: `Estimation Tracker Bot` (or any name you prefer)
5. Select your Slack workspace
6. Click **"Create App"**

## Step 2: Add Bot Scopes (Permissions)

1. In your app settings, go to **"OAuth & Permissions"** in the left sidebar
2. Scroll down to **"Scopes"** section
3. Under **"Bot Token Scopes"**, click **"Add an OAuth Scope"**
4. Add the following scopes:
   - `channels:history` - View messages in public channels
   - `channels:read` - View basic channel info
   - `groups:history` - View messages in private channels
   - `groups:read` - View basic private channel info
   - `im:history` - View messages in direct messages
   - `mpim:history` - View messages in group DMs

## Step 3: Install the App to Your Workspace

1. Still on the **"OAuth & Permissions"** page, scroll to the top
2. Click **"Install to Workspace"**
3. Review the permissions and click **"Allow"**
4. You'll see a **"Bot User OAuth Token"** - it starts with `xoxb-`
5. **Copy this token** - you'll need it for the next step

## Step 4: Add the Bot Token to Your .env.local

1. Open `.env.local` in your project
2. Find the line: `SLACK_BOT_TOKEN=your-slack-bot-token-here`
3. Replace with your actual token:
   ```
   SLACK_BOT_TOKEN=xoxb-your-actual-token-here
   ```
4. Save the file

## Step 5: Add the Bot to Channels

The bot needs to be added to any channel you want to fetch messages from:

1. Open the Slack channel in your workspace
2. Click the channel name at the top
3. Go to **"Integrations"** tab
4. Click **"Add apps"**
5. Find your bot (e.g., "Estimation Tracker Bot") and click **"Add"**

**Important:** Do this for every channel where you have estimation threads!

## Step 6: Test the Integration

1. Restart your dev server if it's running:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. Go to your app at http://localhost:3001
3. Click "Add New Estimation"
4. Paste a Slack thread URL (copy link from any message in a channel where the bot is added)
5. Click "Extract Estimations"

The app should automatically fetch the thread messages!

## Getting a Slack Thread URL

To get a Slack thread URL:

1. In Slack, hover over any message
2. Click the **"More actions"** button (three dots)
3. Select **"Copy link"**
4. The URL will look like: `https://your-workspace.slack.com/archives/C02SGCP7A1M/p1759458090303149`

Example URL format:
- `https://anduin.slack.com/archives/C02SGCP7A1M/p1759458090303149`
- Channel ID: `C02SGCP7A1M`
- Message timestamp: `p1759458090303149` (converted internally to `1759458090.303149`)

## Troubleshooting

### Error: "Slack bot is missing required permissions"
- Make sure you added all the required scopes in Step 2
- If you added scopes after installing, you need to **reinstall the app** (OAuth & Permissions → Reinstall)

### Error: "Channel not found"
- The bot hasn't been added to that channel yet
- Follow Step 5 to add the bot to the channel

### Error: "Invalid Slack Bot Token"
- Check that you copied the full token from Slack (starts with `xoxb-`)
- Make sure there are no extra spaces in your `.env.local` file
- Restart your dev server after updating `.env.local`

### Error: "Invalid Slack URL"
- Make sure you're copying the link from a Slack message (not channel link)
- URL should contain `/archives/` and a message timestamp

## Security Note

- Never commit your Slack Bot Token to git
- The `.env.local` file is in `.gitignore` to prevent accidental commits
- Each team member needs their own Slack Bot in their own workspace

## Optional: Customize Bot Appearance

1. Go to your app at [https://api.slack.com/apps](https://api.slack.com/apps)
2. Select your app
3. Go to **"Basic Information"**
4. Scroll to **"Display Information"**
5. Add an icon and description for your bot

This makes it easier to identify in your Slack workspace!
