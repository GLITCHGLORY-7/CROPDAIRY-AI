import { test, expect } from '@playwright/test';

test.describe('CropDiary AI — Phase 12: Crop Planning & Agronomic Suitability', () => {

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

  test('B. Crop Planning Wizard verifies missing inputs and generates explainable agronomic recommendations', async ({ page }) => {
    // 1. Navigate to Crop Planner
    await page.goto('/app/crop-planner/new');
    await page.waitForSelector('text=Step 1: Select Target Farm and Plot', { state: 'visible', timeout: 10000 });

    // 2. Missing-input validation: Next button must be disabled without farm & plot
    const continueBtn = page.getByRole('button', { name: /Continue to Planting Conditions/i });
    await expect(continueBtn).toBeDisabled();

    // If no farms exist, verify graceful guidance and register one
    const registerFirstLink = page.getByRole('button', { name: /Register a Farm First/i });
    if (await registerFirstLink.isVisible()) {
      await registerFirstLink.click();
      await page.waitForURL('**/app/farms', { timeout: 10000 });

      // Open Add Farm
      await page.getByRole('button', { name: /Register New Farm|Register First Farm/i }).first().click();
      const modal = page.locator('div[role="dialog"]');
      await expect(modal).toBeVisible();

      await page.fill('input[name="name"]', 'Crop Planner Test Farm');
      await page.fill('input[name="area"]', '4.0');
      await page.selectOption('select[name="area_unit"]', 'Acres');
      await page.selectOption('select[name="soil_type"]', 'Clay Loam');
      await page.selectOption('select[name="irrigation_method"]', 'Drip');
      await page.click('button[type="submit"]');
      await expect(modal).not.toBeVisible({ timeout: 8000 });

      // Add a plot to this farm
      await page.getByRole('link', { name: /View & Manage Plots/i }).first().click();
      await page.waitForSelector('text=Back to All Farms', { state: 'visible', timeout: 10000 });

      const addPlotBtn = page.getByRole('button', { name: /Add New Plot|Create First Plot/i }).first();
      await addPlotBtn.click();
      const plotModal = page.locator('div[role="dialog"]');
      await expect(plotModal).toBeVisible();
      await page.fill('input[name="name"]', 'Main Paddy Plot');
      await page.fill('input[name="area"]', '2.5');
      await page.selectOption('select[name="area_unit"]', 'Acres');
      await page.selectOption('select[name="soil_type"]', 'Clay Loam');
      await page.click('button[type="submit"]');
      await expect(plotModal).not.toBeVisible({ timeout: 8000 });

      // Return to Crop Planner Wizard
      await page.goto('/app/crop-planner/new');
      await page.waitForSelector('text=Step 1: Select Target Farm and Plot', { state: 'visible', timeout: 10000 });
    }

    // Select Farm
    const farmSelect = page.locator('select').first();
    await farmSelect.selectOption({ index: 1 });

    // Select Plot
    const plotSelect = page.locator('select').nth(1);
    await plotSelect.waitFor({ state: 'visible' });
    await plotSelect.selectOption({ index: 1 });

    // Continue to Step 2
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // 3. Step 2: Season & Conditions
    await expect(page.locator('text=Step 2: Enter Planting Season & Conditions')).toBeVisible();

    // Select Season Kharif
    await page.selectOption('select[name="planting_season"]', 'Kharif');
    await page.fill('input[name="intended_planting_date"]', '2026-11-01');
    await page.selectOption('select[name="preferred_category"]', 'Any');
    await page.fill('input[name="available_budget"]', '45000');

    // Submit Step 2 to generate recommendations
    const generateBtn = page.getByRole('button', { name: /Generate Explainable Recommendations/i });
    await generateBtn.click();

    // 4. Step 3: Recommendations Display
    await page.waitForSelector('text=Agronomic Shortlist', { state: 'visible', timeout: 10000 });
    await expect(page.locator('text=High Confidence').or(page.locator('text=Medium Confidence'))).toBeVisible();

    // Verify presence of at least one candidate crop card with score & rationale
    const selectCropBtn = page.getByRole('button', { name: 'Select Crop' }).first();
    await expect(selectCropBtn).toBeVisible();
    await selectCropBtn.click();

    // Review Economics button becomes enabled
    const reviewEconBtn = page.getByRole('button', { name: /Review Economics/i });
    await expect(reviewEconBtn).toBeEnabled();
    await reviewEconBtn.click();

    // 5. Step 4: Economics & Timeline Review
    await page.waitForSelector('text=Final Plan Review:', { state: 'visible', timeout: 10000 });
    await expect(page.locator('text=Total Estimated Plot Investment:')).toBeVisible();

    // Open Save Plan Modal
    const openSaveModalBtn = page.getByRole('button', { name: 'Save Crop Plan' }).first();
    await openSaveModalBtn.click();

    const saveDialog = page.locator('div[role="dialog"]');
    await expect(saveDialog).toBeVisible();

    // Submit Save
    const confirmSaveBtn = saveDialog.getByRole('button', { name: 'Save Crop Plan' });
    await confirmSaveBtn.click();

    // Verify redirected to Plan Detail page
    await page.waitForURL('**/app/crop-planner/*', { timeout: 12000 });
    await expect(page.locator('text=Agronomic Growth Stages').first()).toBeVisible();
  });
});
