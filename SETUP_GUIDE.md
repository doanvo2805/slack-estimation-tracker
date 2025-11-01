# Quick Setup Guide

Follow these steps to get your Slack Estimation Tracker up and running:

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Once your project is ready, go to **Settings** → **API**
4. Copy your **Project URL** and **anon/public key**
5. Go to the **SQL Editor** in Supabase
6. Copy the contents of `supabase-schema.sql` from this project
7. Paste and run the SQL to create the `estimations` table

## Step 3: Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Step 4: Configure Environment Variables

1. Open `.env.local` in your code editor
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Test the Application

1. Click "Add New Estimation"
2. Paste this sample Slack thread:

```
Me: Hi team, can you please help review item 1 & 2 here for ABC Fund
Link: https://app.clickup.com/t/abc123

DS: It will take 2 hours for annotation, and 30m for UI fix
LE: 1h for logic
QA: 4-6 hours for testing
```

3. Click "Extract Estimations"
4. Review the extracted data
5. Click "Save to Database"
6. You should see your first estimation in the table!

## Troubleshooting

### "Invalid Supabase URL" error
- Make sure you copied the full URL from Supabase (should start with `https://`)
- Make sure there are no extra spaces

### "Gemini API error"
- Verify your API key is correct
- Check if you have API credits (free tier should work)
- Ensure you didn't hit rate limits

### Database errors
- Make sure you ran the SQL schema in Supabase
- Check that the `estimations` table exists in your database

## What's Next?

Once everything is working:
- Start tracking your estimations!
- Customize the extraction prompts in `app/api/extract/route.ts` if needed
- Deploy to Vercel when ready (see README.md)

## Need Help?

- Check the full README.md for detailed documentation
- Review the Supabase logs if database queries fail
- Check browser console for client-side errors
