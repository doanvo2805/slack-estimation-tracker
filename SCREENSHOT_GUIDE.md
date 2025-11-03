# Screenshot Capture Guide

The README now includes a Screenshots section, but we need to capture the actual images. Follow these steps to take the required screenshots.

## Prerequisites
- Development server is running on http://localhost:3001
- Open your browser (Chrome recommended for best quality)
- Make sure you have some test data in the database

---

## Screenshots Needed

### 1. Home Page - Estimation List
**Filename:** `home-page.png`
**Location:** `public/screenshots/home-page.png`

**Steps:**
1. Navigate to http://localhost:3001
2. Make sure you have at least 5-10 estimations in the table
3. Capture the full page showing:
   - Header with "Slack Estimation Tracker" title
   - "Add New Estimation" button
   - Search bar
   - Filter dropdown
   - Table with multiple rows
   - Edit and Delete icons
4. Use full browser window (1920x1080 or similar)
5. Save as `home-page.png` in `public/screenshots/`

---

### 2. Extract Page - AI Extraction Interface
**Filename:** `extract-page.png`
**Location:** `public/screenshots/extract-page.png`

**Steps:**
1. Navigate to http://localhost:3001/extract
2. Show the empty form with:
   - "Slack Thread URL" input field
   - "OR" divider
   - "Paste Slack Thread Content" textarea
   - "Extract Estimations" button
3. Optionally: Show with some sample text entered
4. Save as `extract-page.png` in `public/screenshots/`

---

### 3. Confidence Indicators
**Filename:** `confidence-indicators.png`
**Location:** `public/screenshots/confidence-indicators.png`

**Steps:**
1. On the Extract page, paste a Slack thread and click "Extract Estimations"
2. Wait for AI processing to complete
3. Capture the results showing:
   - Fund Name field with confidence indicator (green/yellow/red)
   - Items field with confidence indicator
   - DS Estimation with confidence indicator
   - LE Estimation with confidence indicator
   - QA Estimation with confidence indicator
   - ClickUp Link with confidence indicator
4. Make sure to capture fields with different confidence levels (mix of high, medium, low)
5. Save as `confidence-indicators.png` in `public/screenshots/`

**Sample Slack Thread for Testing:**
```
John Doe [9:00 AM]
Hey team, I need estimates for ABC Fund project

Items:
- Update landing page
- Add new API endpoints
- Write unit tests

Jane Smith [9:15 AM]
DS: 2-3 days for backend work

Bob Johnson [9:20 AM]
LE: 4 hours for landing page updates

Alice Williams [9:25 AM]
QA: 2 hours for testing

John Doe [9:30 AM]
ClickUp: https://app.clickup.com/t/abc123
```

---

### 4. Edit Estimation Page
**Filename:** `edit-page.png`
**Location:** `public/screenshots/edit-page.png`

**Steps:**
1. From the home page, click the Edit icon on any estimation
2. Capture the edit form showing:
   - Page title "Edit Estimation"
   - All form fields pre-filled with data
   - "Save Changes" button
   - "Cancel" button
3. Save as `edit-page.png` in `public/screenshots/`

---

### 5. Search & Filter Demo
**Filename:** `search-filter.png`
**Location:** `public/screenshots/search-filter.png`

**Steps:**
1. On the home page, type something in the search bar (e.g., "ABC")
2. OR open the filter dropdown to show options
3. Capture showing:
   - Search bar with text entered
   - Filter dropdown (open or closed with selection visible)
   - Filtered results in the table below
4. Save as `search-filter.png` in `public/screenshots/`

---

## Screenshot Requirements

### Technical Specs:
- **Format:** PNG (preferred for clarity)
- **Resolution:** 1920x1080 or similar high-resolution
- **Browser:** Chrome (recommended) with no extensions visible
- **Zoom Level:** 100% (no zoom in/out)
- **Window Size:** Maximized or specific size for consistency

### Quality Guidelines:
- ✅ Clear, readable text
- ✅ No personal/sensitive information visible
- ✅ Good lighting/contrast
- ✅ No browser extensions or bookmarks visible
- ✅ Consistent browser window size across all screenshots
- ✅ Show realistic data (not "test test test")

---

## How to Take Screenshots

### macOS:
- **Full Screen:** `Cmd + Shift + 3`
- **Selected Area:** `Cmd + Shift + 4` (then drag to select)
- **Specific Window:** `Cmd + Shift + 4`, then press `Space`, then click window

### Windows:
- **Full Screen:** `PrtScn` or `Windows + Shift + S`
- **Specific Window:** `Alt + PrtScn`
- **Snipping Tool:** Search for "Snipping Tool" in Start menu

### Browser Extension (Recommended):
- Install "Full Page Screen Capture" or "Awesome Screenshot"
- These can capture entire page including scroll areas

---

## After Capturing Screenshots

1. Save all images to `public/screenshots/` folder
2. Name them exactly as specified above:
   - `home-page.png`
   - `extract-page.png`
   - `confidence-indicators.png`
   - `edit-page.png`
   - `search-filter.png`

3. Verify images are displaying in README:
   - Push changes to GitHub
   - View README on GitHub to confirm images render correctly

4. Optional: Optimize images for web:
   ```bash
   # Install imagemagick (if not already installed)
   brew install imagemagick  # macOS

   # Optimize all screenshots
   cd public/screenshots
   mogrify -resize 1920x1080 -quality 85 *.png
   ```

---

## Quick Checklist

- [ ] Development server running on port 3001
- [ ] Database has test data (5-10 estimations)
- [ ] Browser window maximized
- [ ] All 5 screenshots captured
- [ ] Screenshots saved to `public/screenshots/`
- [ ] Filenames match exactly (case-sensitive)
- [ ] Images are high quality and readable
- [ ] No sensitive information visible
- [ ] README updated (already done ✅)

---

## Need Help?

If you encounter any issues:
1. Make sure the dev server is running: `npm run dev`
2. Check that test data exists in your Supabase database
3. Try refreshing the browser if components don't load
4. Use browser DevTools (F12) to check for console errors

---

**Once all screenshots are captured and saved, the README will automatically display them!**
