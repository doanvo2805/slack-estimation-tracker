# Slack Estimation Tracker

An AI-powered tool that automatically extracts estimation data from Slack threads and stores it in a searchable, editable database. Built with Next.js 14, Supabase, and Google Gemini AI.

## Screenshots

### Home Page - Estimation List
![Home Page](./public/screenshots/home-page.png)
*Browse all estimations with real-time search and advanced filtering options*

### AI Extraction - Paste Slack Thread
![Extract Page](./public/screenshots/extract-page.png)
*Paste a Slack thread URL or content, and let AI extract the estimation data automatically*

### AI Confidence Indicators
![Confidence Indicators](./public/screenshots/confidence-indicators.png)
*Review AI-extracted data with confidence scores - High confidence (green), Medium (yellow), Low (red)*

---

## Features

- **Automatic Slack Fetching**: Paste a Slack thread URL and automatically fetch the entire conversation (no manual copy-paste needed!)
- **AI-Powered Extraction**: Automatically extracts fund names, items, team estimations (DS, LE, QA), and links from Slack threads using Google Gemini
- **Confidence Indicators**: Shows confidence levels for each extracted field to help you identify what needs review
- **Manual Review**: Edit and verify AI-extracted data before saving
- **Searchable Database**: Search across all estimations with real-time filtering
- **Advanced Filtering**: Filter by team (DS, LE, QA) or missing estimations
- **Full CRUD Operations**: Create, read, update, and delete estimations
- **Responsive UI**: Built with shadcn/ui components for a polished user experience

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Slack Integration**: Slack Web API
- **UI**: shadcn/ui + Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel-ready

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Supabase account (free tier works fine)
- A Google Gemini API key
- A Slack workspace where you can create a bot (for automatic thread fetching)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd slack-estimation-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings to find your:
   - Project URL
   - Anon/Public API Key
3. In the Supabase SQL Editor, run the schema from `supabase-schema.sql`:

```sql
-- Copy and paste the contents of supabase-schema.sql
-- This will create the estimations table with proper indexes and triggers
```

### 4. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Save it for the next step

### 5. Set Up Slack Bot (for automatic thread fetching)

1. Follow the detailed guide in `SLACK_BOT_SETUP.md`
2. Create a Slack App in your workspace
3. Add required permissions (channels:history, groups:history, etc.)
4. Install the app and copy the Bot User OAuth Token
5. Add the bot to channels where you have estimation threads

**Note:** You can skip this step and manually paste thread content, but automatic fetching is much faster!

### 6. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key

# Slack Bot Token (optional - for automatic thread fetching)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage Guide

### Adding a New Estimation

**Option 1: Automatic Fetching (Recommended)**
1. Click "Add New Estimation" on the home page
2. Paste a Slack thread URL in the "Slack Thread URL" field
3. Click "Extract Estimations"
4. The app will automatically fetch and analyze the thread
5. Review the AI-extracted data (check confidence indicators)
6. Edit any fields as needed
7. Click "Save to Database"

**Option 2: Manual Paste (Fallback)**
1. Click "Add New Estimation" on the home page
2. Manually paste the Slack thread content in the text area
3. Click "Extract Estimations"
4. Review and save as above

**Getting a Slack Thread URL:**
- In Slack, hover over any message
- Click "More actions" (three dots)
- Select "Copy link"
- The URL will look like: `https://your-workspace.slack.com/archives/C02SGCP7A1M/p1759458090303149`

### Searching and Filtering

- **Search**: Type in the search bar to filter across fund names, items, and estimations
- **Filter**: Use the dropdown to show:
  - All Estimations
  - DS Only (only rows with DS estimations)
  - LE Only (only rows with LE estimations)
  - QA Only (only rows with QA estimations)
  - Missing Estimations (rows with any missing team estimation)

### Editing an Estimation

1. Click the edit icon (pencil) on any row
2. Update the fields as needed
3. Click "Save Changes"

### Deleting an Estimation

1. Click the delete icon (trash) on any row
2. Confirm the deletion in the dialog
3. The estimation will be permanently removed

## Project Structure

```
slack-estimation-tracker/
├── app/
│   ├── api/
│   │   ├── extract/route.ts         # Gemini AI extraction endpoint
│   │   └── estimations/
│   │       ├── route.ts              # GET all, POST new estimation
│   │       └── [id]/route.ts         # PATCH, DELETE by ID
│   ├── edit/[id]/page.tsx            # Edit estimation page
│   ├── extract/page.tsx              # Extraction and preview page
│   ├── page.tsx                      # Home page (table view)
│   └── layout.tsx                    # Root layout
├── components/ui/                    # shadcn/ui components
├── lib/
│   ├── supabase.ts                   # Supabase client and types
│   └── utils.ts                      # Utility functions
├── supabase-schema.sql               # Database schema
├── .env.local.example                # Environment variables template
└── README.md                         # This file
```

## Database Schema

The `estimations` table includes:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| fund_name | TEXT | Required - Fund name extracted from first message |
| items | TEXT | Task items mentioned in thread |
| ds_estimation | TEXT | DS team estimation (e.g., "2h", "2-3 days") |
| le_estimation | TEXT | LE team estimation |
| qa_estimation | TEXT | QA team estimation |
| slack_link | TEXT | Slack thread URL |
| clickup_link | TEXT | ClickUp task URL |
| raw_thread | TEXT | Original Slack thread for reference |
| created_at | TIMESTAMPTZ | Auto-generated creation time |
| updated_at | TIMESTAMPTZ | Auto-updated on changes |

## API Routes

### POST /api/extract
Extracts estimation data from Slack thread using Gemini AI.

**Request:**
```json
{
  "slackThread": "string (min 10 chars)",
  "slackLink": "string (optional)"
}
```

**Response:**
```json
{
  "fund_name": { "value": "string", "confidence": 0.95 },
  "items": { "value": "string", "confidence": 0.85 },
  "ds_estimation": { "value": "string", "confidence": 0.90 },
  "le_estimation": { "value": "string", "confidence": 0.80 },
  "qa_estimation": { "value": "string", "confidence": 0.75 },
  "clickup_link": { "value": "string", "confidence": 1.0 }
}
```

### GET /api/estimations
Get all estimations with optional search and filter.

**Query params:**
- `search`: Search term (optional)
- `filter`: all | ds | le | qa | missing (optional)

### POST /api/estimations
Create a new estimation.

### PATCH /api/estimations/[id]
Update an existing estimation.

### DELETE /api/estimations/[id]
Delete an estimation.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Deploy!

The app will be live at your Vercel URL.

## Troubleshooting

### Gemini API Errors
- Verify your API key is correct in `.env.local`
- Check you haven't exceeded rate limits
- Ensure your API key has the correct permissions

### Supabase Connection Issues
- Verify your project URL and anon key are correct
- Check that the `estimations` table exists
- Ensure you ran the SQL schema script

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Clear `.next` folder: `rm -rf .next`
- Restart the dev server

## License

MIT License - feel free to use this project for your own purposes.

## QA Testing & Bug Reports

### Test Coverage Status

The application has undergone comprehensive QA testing. Full details are available in `QA_BUG_REPORT.md`.

**Overall Grade: B+ (Very Good)**

### Testing Summary

#### ✅ Tested Features:
- Complete flow: Home → Extract → AI Processing → Save → Verify in Table
- Edit flow with validation
- Delete flow with cancellation and confirmation
- Search functionality with real-time filtering
- Advanced filtering (DS, LE, QA, Missing Estimations)
- Slack URL auto-fetching
- Manual thread paste fallback
- Confidence indicators for AI-extracted data
- Error handling for invalid inputs
- Responsive UI across different screen sizes

#### Known Issues:

**🔴 Critical (2 bugs):**
- Missing success message handler after editing estimations
- Inefficient data fetching on edit page (loads all estimations instead of just one)

**🟠 High (3 bugs):**
- Weak validation on manual Slack thread input
- No error handling for invalid/deleted estimation IDs
- Race condition in delete dialog state management

**🟡 Medium (4 bugs):**
- Missing loading spinner on home page
- External link validation could be more robust
- No debouncing on search input (performance concern with large datasets)
- Inconsistent error handling in Extract API

**🟢 Low (3 bugs):**
- Missing ARIA labels for accessibility
- Missing keyboard navigation improvements
- Potential memory leak in success message timeouts

### Feature Verification

| Feature | Status | Notes |
|---------|--------|-------|
| Slack URL Auto-Fetching | ✅ Working | Requires SLACK_BOT_TOKEN configured |
| Manual Thread Paste | ✅ Working | Fallback when bot token not available |
| AI Extraction (Gemini) | ✅ Working | Returns confidence scores for each field |
| CRUD Operations | ✅ Working | Create, Read, Update, Delete all functional |
| Search | ✅ Working | Real-time filtering across all fields |
| Advanced Filters | ✅ Working | Filter by team or missing estimations |
| Responsive Design | ✅ Working | Works on mobile, tablet, desktop |
| Error Handling | ⚠️ Partial | Most cases covered, some edge cases need improvement |
| Accessibility | ⚠️ Needs Work | Basic functionality present, ARIA labels missing |

### Test Environment

- **Framework:** Next.js 16.0.0
- **Node Version:** 18+
- **Database:** Supabase (PostgreSQL)
- **Testing Tools:** Playwright (E2E tests available in `playwright.config.ts`)
- **Test Date:** 2025-01-29

### Running Tests

```bash
# Install Playwright (if not already installed)
npm install --save-dev @playwright/test
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui
```

### Bug Fix Priority

**Immediate (Recommended for next deployment):**
1. Fix missing success message on edit page (BUG-001)
2. Add GET endpoint for single estimation by ID (BUG-002)
3. Fix delete dialog state management (BUG-005)

**Next Sprint:**
- Improve input validation (BUG-003)
- Add search debouncing (BUG-008)
- Better error handling for invalid IDs (BUG-004)

For detailed bug descriptions, reproduction steps, and recommended fixes, see `QA_BUG_REPORT.md`.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
