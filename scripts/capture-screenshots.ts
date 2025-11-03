import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to automatically capture screenshots for README documentation
 * Run with: npx ts-node scripts/capture-screenshots.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '../public/screenshots');

// Sample Slack thread data for testing
const SAMPLE_SLACK_THREAD = `John Doe [9:00 AM]
Hey team, I need estimates for ABC Fund project

Items:
- Update landing page design
- Add new API endpoints for user management
- Write comprehensive unit tests
- Update documentation

Jane Smith [9:15 AM]
DS: 2-3 days for backend work and API implementation

Bob Johnson [9:20 AM]
LE: 4 hours for landing page updates

Alice Williams [9:25 AM]
QA: 2 hours for testing all new features

John Doe [9:30 AM]
ClickUp: https://app.clickup.com/t/abc123`;

async function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...\n');

  // Ensure screenshots directory exists
  ensureDirectoryExists(SCREENSHOTS_DIR);

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    // Check if server is running
    console.log('🔍 Checking if dev server is running...');
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      console.log('✅ Dev server is running\n');
    } catch (error) {
      console.error('❌ Dev server is not running!');
      console.error('   Please start it with: npm run dev');
      console.error('   Trying URL:', BASE_URL);
      await browser.close();
      process.exit(1);
    }

    // Screenshot 1: Home Page
    console.log('📸 Capturing Screenshot 1/5: Home Page...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for any animations and data loading
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'home-page.png'),
      fullPage: false,
    });
    console.log('   ✅ Saved: home-page.png\n');

    // Screenshot 2: Extract Page (Empty Form)
    console.log('📸 Capturing Screenshot 2/5: Extract Page...');
    await page.goto(`${BASE_URL}/extract`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'extract-page.png'),
      fullPage: false,
    });
    console.log('   ✅ Saved: extract-page.png\n');

    // Screenshot 3: Confidence Indicators (After AI Extraction)
    console.log('📸 Capturing Screenshot 3/5: Confidence Indicators...');
    console.log('   📝 Filling in sample Slack thread...');

    // Fill in the textarea
    const textarea = page.locator('textarea');
    await textarea.fill(SAMPLE_SLACK_THREAD);
    await page.waitForTimeout(500);

    // Click Extract button
    console.log('   🤖 Triggering AI extraction...');
    const extractButton = page.locator('button', { hasText: 'Extract Estimations' });
    await extractButton.click();

    // Wait for extraction to complete (look for confidence indicators)
    try {
      await page.waitForSelector('input[name="fund_name"]', { timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for all confidence indicators to render

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'confidence-indicators.png'),
        fullPage: true, // Capture full form with all fields
      });
      console.log('   ✅ Saved: confidence-indicators.png\n');
    } catch (error) {
      console.warn('   ⚠️  AI extraction took too long or failed. Skipping confidence-indicators.png');
      console.warn('   💡 Make sure GEMINI_API_KEY is configured in .env.local\n');
    }

    // Screenshot 4: Edit Page
    console.log('📸 Capturing Screenshot 4/5: Edit Page...');

    // First, check if we have any estimations to edit
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const editButtons = page.locator('button[aria-label*="Edit"], button:has-text("Edit"), svg.lucide-edit').first();
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      console.log('   📝 Found estimation to edit...');
      await editButtons.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'edit-page.png'),
        fullPage: false,
      });
      console.log('   ✅ Saved: edit-page.png\n');
    } else {
      console.warn('   ⚠️  No estimations found in database. Creating placeholder edit page screenshot...');
      console.warn('   💡 Add some test data to get a better screenshot\n');

      // Take screenshot of home page as fallback
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'edit-page.png'),
        fullPage: false,
      });
    }

    // Screenshot 5: Search & Filter
    console.log('📸 Capturing Screenshot 5/5: Search & Filter...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"]');
    const searchExists = await searchInput.count();

    if (searchExists > 0) {
      console.log('   🔍 Entering search term...');
      await searchInput.fill('ABC');
      await page.waitForTimeout(500);

      // Open filter dropdown
      console.log('   🎯 Opening filter dropdown...');
      const filterButton = page.locator('button', { hasText: 'All Estimations' }).or(
        page.locator('[role="combobox"]')
      ).first();

      if (await filterButton.count() > 0) {
        await filterButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'search-filter.png'),
      fullPage: false,
    });
    console.log('   ✅ Saved: search-filter.png\n');

    console.log('✨ Screenshot capture completed successfully!\n');
    console.log('📁 Screenshots saved to: public/screenshots/');
    console.log('\n🎉 You can now view the images in your README!\n');

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
captureScreenshots()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
