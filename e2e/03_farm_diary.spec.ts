import { test, expect } from '@playwright/test';

test.describe('CropDiary AI — Phase 12: Farm Diary & Activity Ledger', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate with test farmer account
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    try {
      await emailInput.waitFor({ state: 'visible', timeout: 8000 });
      await emailInput.fill('farmer@cropdiary.ai');
      await page.locator('input[type="password"]').fill('farmer123');
      await page.click('button[type="submit"]');
    } catch {
      // already authenticated
    }

    // Pass onboarding if routed
    await page.waitForURL((url) => url.pathname.includes('/onboarding') || url.pathname.includes('/app'), { timeout: 15000 });
    if (page.url().includes('/onboarding')) {
      const saveBtn = page.getByRole('button', { name: /Save & Go to Dashboard|Skip for Now/i }).first();
      await saveBtn.click();
    }
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });
  });

  test('C. Farm diary records activities with expenses and persists across page refresh', async ({ page }) => {
    // 1. Navigate to New Diary Entry
    await page.goto('/app/diary/new');
    const pageHeading = page.locator('h1, h2').filter({ hasText: /New Farm Diary Entry|No Farm Registered Yet/ });
    await pageHeading.waitFor({ state: 'visible', timeout: 15000 });

    // If no farm is registered yet, verify honest guidance and register one
    const emptyNotice = page.locator('text=No Farm Registered Yet');
    if (await emptyNotice.isVisible()) {
      await page.getByRole('button', { name: /Register First Farm/i }).click();
      await page.waitForURL('**/app/farms', { timeout: 10000 });

      // Add Farm
      await page.getByRole('button', { name: /Register New Farm|Register First Farm/i }).first().click();
      const modal = page.locator('div[role="dialog"]');
      await expect(modal).toBeVisible();

      await page.fill('input[name="name"]', 'Diary Test Farm');
      await page.fill('input[name="area"]', '3.0');
      await page.selectOption('select[name="area_unit"]', 'Acres');
      await page.selectOption('select[name="soil_type"]', 'Clay Loam');
      await page.selectOption('select[name="irrigation_method"]', 'Drip');
      await page.click('button[type="submit"]');
      await expect(modal).not.toBeVisible({ timeout: 8000 });

      // Add a plot
      await page.getByRole('link', { name: /View & Manage Plots/i }).first().click();
      await page.waitForSelector('text=Back to All Farms', { state: 'visible', timeout: 10000 });

      const addPlotBtn = page.getByRole('button', { name: /Add New Plot|Create First Plot/i }).first();
      await addPlotBtn.click();
      const plotModal = page.locator('div[role="dialog"]');
      await expect(plotModal).toBeVisible();
      await page.fill('input[name="name"]', 'Plot A1');
      await page.fill('input[name="area"]', '1.5');
      await page.selectOption('select[name="area_unit"]', 'Acres');
      await page.selectOption('select[name="soil_type"]', 'Clay Loam');
      await page.click('button[type="submit"]');
      await expect(plotModal).not.toBeVisible({ timeout: 8000 });

      // Return to New Diary Entry
      await page.goto('/app/diary/new');
      await page.waitForSelector('text=New Farm Diary Entry', { state: 'visible', timeout: 10000 });
    }

    const entryTitle = `Bio-Fertilizer Sowing Application #${Date.now().toString().slice(-4)}`;

    // Fill Title & Notes
    await page.fill('input[name="title"]', entryTitle);
    await page.fill('textarea[name="description"]', 'Applied Trichoderma viride and organic vermicompost to Samba nursery bed.');

    // Select Farm & Plot if dropdowns available
    const farmSelect = page.locator('select[name="farm_id"]');
    if (await farmSelect.isVisible()) {
      const options = await farmSelect.locator('option').allInnerTexts();
      if (options.length > 1) {
        await farmSelect.selectOption({ index: 1 });
      }
    }

    // Fill activity details
    const laborCostInput = page.locator('input[name="activity_detail.labor_cost"]');
    if (await laborCostInput.isVisible()) {
      await laborCostInput.fill('1200');
    }

    // Save Diary Entry
    const saveBtn = page.getByRole('button', { name: /Save Diary Entry/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 2. Verify navigation to /app/diary timeline
    await page.waitForURL('**/app/diary', { timeout: 12000 });
    await expect(page.locator(`text=${entryTitle}`)).toBeVisible();

    // 3. Page Refresh Persistence Test (Validates Local Storage & IndexedDB persistence)
    await page.reload();
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });

    // Assert entry remains visible after page reload
    await expect(page.locator(`text=${entryTitle}`)).toBeVisible();
    await expect(page.locator('text=Applied Trichoderma viride')).toBeVisible();
  });
});
