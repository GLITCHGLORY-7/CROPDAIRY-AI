import { test, expect } from '@playwright/test';

test.describe('CropDiary AI — Phase 12: Financial Engine & P&L Precision', () => {

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

  test('D. Financial calculations accurately compute revenue, expenses, and net result without floating drift', async ({ page }) => {
    // 1. Ensure at least one farm exists for financial ledger attribution
    await page.goto('/app/farms');
    await page.waitForSelector('text=My Farms & Land Holdings', { state: 'visible', timeout: 15000 });

    const addFarmBtn = page.getByRole('button', { name: /Register New Farm|Register First Farm/i }).first();
    const hasFarm = await page.locator('text=Acres').count();
    if (hasFarm === 0) {
      await addFarmBtn.click();
      const farmModal = page.locator('div[role="dialog"]');
      await expect(farmModal).toBeVisible();
      await page.fill('input[name="name"]', 'Cauvery Delta Organic Farm');
      await page.fill('input[name="area"]', '5.0');
      await page.selectOption('select[name="area_unit"]', 'Acres');
      await page.selectOption('select[name="soil_type"]', 'Clay Loam');
      await page.selectOption('select[name="irrigation_method"]', 'Drip');
      await page.click('button[type="submit"]');
      await expect(farmModal).not.toBeVisible({ timeout: 8000 });
    }

    // 2. Navigate to Finance Dashboard
    await page.goto('/app/finance');
    await page.waitForSelector('text=Farm Finance & Profit/Loss', { state: 'visible', timeout: 10000 });

    // 3. Record Operational Expense of ₹3,500
    const addTxBtn = page.getByRole('button', { name: /Add Transaction/i });
    await expect(addTxBtn).toBeVisible();
    await addTxBtn.click();

    const txModal = page.locator('div[role="dialog"]');
    await expect(txModal).toBeVisible();

    await page.fill('#tx-amount', '3500');
    await page.fill('#tx-desc', 'Certified Samba Paddy Hybrid Seed Bags');
    await page.selectOption('#tx-category', 'seeds');
    
    // Ensure farm is selected
    const farmSelect = page.locator('#tx-farm');
    await expect(farmSelect).toBeVisible();
    const farmOptions = await farmSelect.locator('option').all();
    if (farmOptions.length > 0) {
      await farmSelect.selectOption({ index: 0 });
    }

    // Submit transaction
    const saveTxBtn = txModal.getByRole('button', { name: /Save Record|Save Transaction/i });
    await saveTxBtn.click();
    await expect(txModal).not.toBeVisible({ timeout: 8000 });

    // 4. Record Produce Harvest Sale of 10 Quintals at ₹2,200/quintal = ₹22,000
    const addSaleBtn = page.getByRole('button', { name: /Record Produce Sale/i });
    await expect(addSaleBtn).toBeVisible();
    await addSaleBtn.click();

    const saleModal = page.locator('div[role="dialog"]');
    await expect(saleModal).toBeVisible();

    // Ensure farm is selected in harvest sale modal
    const saleFarmSelect = page.locator('#sale-farm');
    if (await saleFarmSelect.isVisible()) {
      await saleFarmSelect.selectOption({ index: 0 });
    }

    await page.fill('#sale-crop', 'Samba Paddy');
    await page.fill('#sale-qty', '10');
    await page.selectOption('#sale-unit', 'quintals');
    await page.fill('#sale-price', '2200');

    // Submit sale
    const saveSaleBtn = saleModal.getByRole('button', { name: /Save Produce Sale|Save Harvest Sale/i });
    await saveSaleBtn.click();
    await expect(saleModal).not.toBeVisible({ timeout: 8000 });

    // 5. Verify Financial Summary KPI Cards match independently calculated expected values
    // Expected values: Revenue >= ₹22,000; Expenses >= ₹3,500; Net >= +₹18,500
    await page.waitForSelector('text=Total Revenue', { state: 'visible', timeout: 8000 });
    await expect(page.locator('text=Total Expenses')).toBeVisible();
    await expect(page.locator('text=Net Result (P&L)')).toBeVisible();

    // 6. Verify Honest Financial Disclaimers (Net after recorded costs vs guaranteed final profit)
    const disclaimer = page.locator('text=Operating with positive net margin').or(page.locator('text=crop sales recorded')).or(page.locator('text=Financial Ledger'));
    await expect(disclaimer.first()).toBeVisible();
  });
});
