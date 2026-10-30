import { test, expect } from '@playwright/test';

test.describe('CropDiary AI — Phase 12: Service Diagnostics & Offline Resiliency', () => {

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

  test('F. Service diagnostics honestly displays actual configured vs local fallback states without fabricated claims', async ({ page }) => {
    // 1. Locate and click diagnostics trigger in TopNav
    const diagnosticsBtn = page.getByRole('button', { name: /View system and integration diagnostics/i });
    await expect(diagnosticsBtn).toBeVisible();
    await diagnosticsBtn.click();

    // 2. Diagnostics modal must open
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Service & Integration Diagnostics Matrix')).toBeVisible();

    // 3. Verify honest service statuses inside the diagnostics modal
    await expect(modal.getByText('Supabase Cloud (PostgreSQL & Auth)')).toBeVisible();
    await expect(modal.getByText('Local Storage Mode').or(modal.getByText('Cloud Synced')).first()).toBeVisible();

    // AI Engine status reflects reality
    await expect(modal.getByText('Agronomic AI Engine (Crop Doctor & Assistant)')).toBeVisible();
    await expect(modal.getByText('ICAR Rulebase Mode').or(modal.getByText('Gemini AI Active')).first()).toBeVisible();

    // Meteorological weather provider
    await expect(modal.getByText('Meteorological Weather Provider (Open-Meteo)')).toBeVisible();
    await expect(modal.getByText('Public REST Active')).toBeVisible();

    // Offline storage engine
    await expect(modal.getByText('Offline Storage & Synchronization Engine')).toBeVisible();
    await expect(modal.getByText('IndexedDB Operational')).toBeVisible();

    // 4. Close diagnostics modal
    const closeBtn = modal.getByRole('button', { name: /Close|Close dialog/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test('G. Offline behavior gracefully handles network loss, reflects offline state, and restores online connectivity', async ({ page }) => {
    // 1. Verify initially online state
    await expect(page.locator('text=Online • Synced').first()).toBeVisible();

    // 2. Emulate network loss
    await page.context().setOffline(true);

    // 3. Verify Offline status badge immediately appears in TopNav
    await expect(page.locator('text=Offline').first()).toBeVisible({ timeout: 8000 });

    // 4. Restore network connectivity
    await page.context().setOffline(false);

    // 5. Verify Online status is restored
    await expect(page.locator('text=Online • Synced').first()).toBeVisible({ timeout: 8000 });

    // 6. Verify dashboard persistence after page refresh
    await page.reload();
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });
    await expect(page.locator('text=Online • Synced').first()).toBeVisible();
  });
});
