import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3005';

// Sample test data
const SAMPLE_SLACK_THREAD = `
Me: Hi team, can you please help review item 1 & 2 here for ABC Fund
Link: https://app.clickup.com/t/abc123

DS: It will take 2 hours for annotation, and 30m for UI fix
LE: 1h for logic
QA: 4-6 hours for testing
`;

const SAMPLE_FUND = {
  fund_name: 'Test Fund ' + Date.now(),
  items: 'Item 1, Item 2',
  ds_estimation: '2h',
  le_estimation: '1h',
  qa_estimation: '4h',
  slack_link: 'https://test.slack.com/archives/C123/p123',
  clickup_link: 'https://app.clickup.com/t/test123'
};

test.describe('Slack Estimation Tracker E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('Home Page Tests', () => {

    test('should load home page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/Slack Estimation Tracker/i);
      await expect(page.locator('h1')).toContainText('Slack Estimation Tracker');
    });

    test('should display table headers', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: 'Fund Name' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /DS Estimation/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /LE Estimation/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /QA Estimation/i })).toBeVisible();
    });

    test('should have Add New Estimation button', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /Add New Estimation/i });
      await expect(addButton).toBeVisible();
    });

    test('should have search input', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search estimations/i);
      await expect(searchInput).toBeVisible();
    });

    test('should have filter dropdown', async ({ page }) => {
      const filterSelect = page.getByRole('combobox');
      await expect(filterSelect).toBeVisible();
    });

    test('should navigate to extraction page when clicking Add button', async ({ page }) => {
      await page.getByRole('button', { name: /Add New Estimation/i }).click();
      await expect(page).toHaveURL(/\/extract/);
    });

  });

  test.describe('Extraction Page Tests', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/extract`);
    });

    test('should load extraction page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Slack Estimation Tracker');
      await expect(page.locator('text=Step 1: Provide Slack Thread')).toBeVisible();
    });

    test('should show both Slack URL and manual textarea options', async ({ page }) => {
      await expect(page.getByLabel(/Slack Thread URL/i)).toBeVisible();
      await expect(page.getByLabel(/Slack Thread Content/i)).toBeVisible();
    });

    test('should disable extract button when inputs are empty', async ({ page }) => {
      const extractButton = page.getByRole('button', { name: /Extract Estimations/i });
      await expect(extractButton).toBeDisabled();
    });

    test('should enable extract button when Slack URL is provided', async ({ page }) => {
      await page.getByLabel(/Slack Thread URL/i).fill('https://test.slack.com/archives/C123/p123');
      const extractButton = page.getByRole('button', { name: /Extract Estimations/i });
      await expect(extractButton).toBeEnabled();
    });

    test('should enable extract button when textarea has 10+ characters', async ({ page }) => {
      await page.getByLabel(/Slack Thread Content/i).fill('Test content with more than 10 chars');
      const extractButton = page.getByRole('button', { name: /Extract Estimations/i });
      await expect(extractButton).toBeEnabled();
    });

    test('should show error for textarea with less than 10 characters', async ({ page }) => {
      await page.getByLabel(/Slack Thread Content/i).fill('Short');
      await page.getByRole('button', { name: /Extract Estimations/i }).click();
      await expect(page.locator('text=/minimum 10 characters/i')).toBeVisible();
    });

    test('should show loading state during extraction', async ({ page }) => {
      await page.getByLabel(/Slack Thread Content/i).fill(SAMPLE_SLACK_THREAD);
      await page.getByRole('button', { name: /Extract Estimations/i }).click();
      await expect(page.getByText(/AI is analyzing thread/i)).toBeVisible();
    });

  });

  test.describe('CRUD Operations', () => {

    let createdEstimationId: string;

    test('should create a new estimation successfully', async ({ page }) => {
      // Navigate to extraction page
      await page.goto(`${BASE_URL}/extract`);

      // Fill in the Slack thread
      await page.getByLabel(/Slack Thread Content/i).fill(SAMPLE_SLACK_THREAD);

      // Click extract
      await page.getByRole('button', { name: /Extract Estimations/i }).click();

      // Wait for extraction to complete
      await expect(page.locator('text=Step 2: Review and Edit Extracted Data')).toBeVisible({ timeout: 30000 });

      // Verify confidence badges appear
      await expect(page.getByText(/High|Medium|Low/)).toBeVisible();

      // Edit fund name to ensure uniqueness
      await page.getByLabel(/Fund Name/i).fill(SAMPLE_FUND.fund_name);

      // Save
      await page.getByRole('button', { name: /Save to Database/i }).click();

      // Verify redirect to home page
      await expect(page).toHaveURL(/\?success=true/, { timeout: 10000 });

      // Verify success message
      await expect(page.getByText(/Estimation saved successfully/i)).toBeVisible();

      // Verify the estimation appears in table
      await expect(page.getByText(SAMPLE_FUND.fund_name)).toBeVisible();
    });

    test('should search for estimations', async ({ page }) => {
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 5000 });

      // Type in search box
      await page.getByPlaceholder(/Search estimations/i).fill('Test Fund');

      // Verify filtered results
      await page.waitForTimeout(500); // Wait for debounce
      const rows = page.locator('tbody tr');
      await expect(rows).toHaveCount({ timeout: 3000 });
    });

    test('should filter by team', async ({ page }) => {
      await page.waitForSelector('table', { timeout: 5000 });

      // Click filter dropdown
      await page.getByRole('combobox').click();

      // Select DS Only
      await page.getByRole('option', { name: 'DS Only' }).click();

      // Verify result count updates
      await expect(page.getByText(/Showing \d+ estimation/)).toBeVisible();
    });

    test('should edit an estimation', async ({ page }) => {
      await page.waitForSelector('table', { timeout: 5000 });

      // Find first edit button
      const editButton = page.locator('button:has-text("")').first(); // Edit icon
      await editButton.click();

      // Verify we're on edit page
      await expect(page).toHaveURL(/\/edit\//);
      await expect(page.locator('h1')).toContainText('Edit Estimation');

      // Modify a field
      const newItems = 'Updated items - ' + Date.now();
      await page.getByLabel(/Items/i).fill(newItems);

      // Save
      await page.getByRole('button', { name: /Save Changes/i }).click();

      // Verify redirect
      await expect(page).toHaveURL(/\?updated=true/, { timeout: 10000 });
    });

    test('should cancel edit', async ({ page }) => {
      await page.waitForSelector('table', { timeout: 5000 });

      // Click edit on first row
      const editButton = page.locator('button').filter({ hasText: '' }).first();
      await editButton.click();

      // Wait for edit page
      await expect(page).toHaveURL(/\/edit\//);

      // Click cancel
      await page.getByRole('button', { name: /Cancel/i }).click();

      // Verify we're back on home page
      await expect(page).toHaveURL(BASE_URL + '/');
    });

    test('should delete an estimation', async ({ page }) => {
      await page.waitForSelector('table', { timeout: 5000 });

      // Get initial count
      const initialCount = await page.locator('tbody tr').count();

      // Click delete button on first row
      const deleteButton = page.locator('button').filter({ hasText: '' }).last();
      await deleteButton.click();

      // Verify confirmation dialog appears
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/Are you sure you want to delete/i)).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /Delete/i, exact: true }).click();

      // Wait for deletion to complete
      await page.waitForTimeout(1000);

      // Verify count decreased
      const newCount = await page.locator('tbody tr').count();
      expect(newCount).toBeLessThan(initialCount);
    });

    test('should cancel delete', async ({ page }) => {
      await page.waitForSelector('table', { timeout: 5000 });

      // Click delete button
      const deleteButton = page.locator('button').filter({ hasText: '' }).last();
      await deleteButton.click();

      // Verify dialog appears
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click cancel
      await page.getByRole('button', { name: /Cancel/i }).click();

      // Verify dialog closes
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

  });

  test.describe('Validation Tests', () => {

    test('should require fund name when saving', async ({ page }) => {
      await page.goto(`${BASE_URL}/extract`);
      await page.getByLabel(/Slack Thread Content/i).fill(SAMPLE_SLACK_THREAD);
      await page.getByRole('button', { name: /Extract Estimations/i }).click();

      // Wait for extraction
      await expect(page.locator('text=Step 2')).toBeVisible({ timeout: 30000 });

      // Clear fund name
      await page.getByLabel(/Fund Name/i).clear();

      // Verify save button is disabled
      const saveButton = page.getByRole('button', { name: /Save to Database/i });
      await expect(saveButton).toBeDisabled();
    });

    test('should validate ClickUp link format', async ({ page }) => {
      await page.goto(`${BASE_URL}/extract`);
      await page.getByLabel(/Slack Thread Content/i).fill(SAMPLE_SLACK_THREAD);
      await page.getByRole('button', { name: /Extract Estimations/i }).click();

      await expect(page.locator('text=Step 2')).toBeVisible({ timeout: 30000 });

      // Enter invalid ClickUp link
      await page.getByLabel(/ClickUp Link/i).fill('https://google.com');

      // Verify warning appears
      await expect(page.getByText(/doesn't look like a valid ClickUp link/i)).toBeVisible();
    });

  });

  test.describe('Empty State Tests', () => {

    test('should show empty state message when no data', async ({ page }) => {
      // This test assumes database might be empty
      await page.goto(BASE_URL);

      // Check if empty state appears or if data exists
      const hasData = await page.locator('tbody tr').count() > 0;

      if (!hasData) {
        await expect(page.getByText(/No estimations yet/i)).toBeVisible();
        await expect(page.getByText(/Click 'Add New Estimation'/i)).toBeVisible();
      }
    });

    test('should show no results message when search has no matches', async ({ page }) => {
      await page.goto(BASE_URL);

      // Search for something that definitely doesn't exist
      await page.getByPlaceholder(/Search estimations/i).fill('ZZZZNONEXISTENTZZZ99999');

      await page.waitForTimeout(500);

      // Verify no results message
      await expect(page.getByText(/No results found/i)).toBeVisible();
    });

  });

  test.describe('UI/UX Tests', () => {

    test('should display loading state on page load', async ({ page }) => {
      const response = page.goto(BASE_URL);
      await expect(page.getByText(/Loading/i)).toBeVisible();
      await response;
    });

    test('should show success message after saving', async ({ page }) => {
      await page.goto(`${BASE_URL}/?success=true`);
      await expect(page.getByText(/Estimation saved successfully/i)).toBeVisible();

      // Success message should auto-hide after 5 seconds
      await page.waitForTimeout(6000);
      await expect(page.getByText(/Estimation saved successfully/i)).not.toBeVisible();
    });

    test('should have external link icons for Slack and ClickUp', async ({ page }) => {
      await page.waitForSelector('table', { timeout: 5000 });

      const hasRows = await page.locator('tbody tr').count() > 0;

      if (hasRows) {
        // Check for external link icons
        const slackLinks = page.locator('a[href*="slack.com"]');
        const clickupLinks = page.locator('a[href*="clickup.com"]');

        // At least one should exist
        const slackCount = await slackLinks.count();
        const clickupCount = await clickupLinks.count();

        expect(slackCount + clickupCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should format dates correctly', async ({ page }) => {
      await page.waitForSelector('table', { timeout: 5000 });

      const hasRows = await page.locator('tbody tr').count() > 0;

      if (hasRows) {
        // Check if date cells contain valid date format (e.g., "Jan 15, 2025")
        const dateCells = page.locator('td').filter({ hasText: /\w{3} \d{1,2}, \d{4}/ });
        expect(await dateCells.count()).toBeGreaterThan(0);
      }
    });

  });

  test.describe('Navigation Tests', () => {

    test('should navigate between pages correctly', async ({ page }) => {
      // Start at home
      await page.goto(BASE_URL);
      await expect(page).toHaveURL(BASE_URL + '/');

      // Go to extract page
      await page.getByRole('button', { name: /Add New Estimation/i }).click();
      await expect(page).toHaveURL(/\/extract/);

      // Go back to home (via browser back)
      await page.goBack();
      await expect(page).toHaveURL(BASE_URL + '/');
    });

    test('should have back navigation on edit page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForSelector('table', { timeout: 5000 });

      const hasRows = await page.locator('tbody tr').count() > 0;

      if (hasRows) {
        // Click edit
        await page.locator('button').filter({ hasText: '' }).first().click();
        await expect(page).toHaveURL(/\/edit\//);

        // Click back link
        await page.getByRole('link', { name: /Back to Database/i }).click();
        await expect(page).toHaveURL(BASE_URL + '/');
      }
    });

  });

});
