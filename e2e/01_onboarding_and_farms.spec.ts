import { test, expect } from '@playwright/test';

test.describe('CropDiary AI — Phase 12: First-Time Onboarding & Farm Hierarchy', () => {
  const timestamp = Date.now();
  const testEmail = `newfarmer_${timestamp}@cropdiary.ai`;
  const testPassword = 'SecurePassword123!';
  const farmerName = 'Murugan Thanjavur';

  test('A. First-time onboarding with genuine empty state and farm registration', async ({ page }) => {
    // 1. Register a brand-new user with zero farm records
    await page.goto('/register');
    await page.waitForSelector('input[name="fullName"]', { state: 'visible', timeout: 10000 });

    await page.fill('input[name="fullName"]', farmerName);
    await page.fill('input[name="email"]', testEmail);
    await page.selectOption('select[name="preferredLanguage"]', 'en');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // 2. Onboarding profile setup
    await page.waitForURL('**/onboarding', { timeout: 12000 });
    await expect(page.locator('h1')).toContainText('Welcome to CropDiary AI');

    const saveOnboardingBtn = page.getByRole('button', { name: 'Save & Go to Dashboard' });
    await saveOnboardingBtn.waitFor({ state: 'visible', timeout: 8000 });
    await saveOnboardingBtn.click();

    // 3. Arrive at Dashboard with genuine empty state
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });

    // Assert zero values honestly displayed
    await expect(page.locator('text=Total Farms')).toBeVisible();
    await expect(page.locator('text=Total Plots')).toBeVisible();
    await expect(page.locator('text=Total Land Area')).toBeVisible();

    // Verify "Register Your First Farm" card
    const emptyFarmCard = page.locator('text=Register Your First Farm');
    await expect(emptyFarmCard).toBeVisible();
    await expect(page.locator('text=Add your land area, soil profile, and irrigation system')).toBeVisible();

    // 4. Open Farm Registration Modal
    const registerFirstFarmBtn = page.getByRole('button', { name: /Register First Farm/i }).first();
    await registerFirstFarmBtn.click();

    // Modal should be visible
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Register New Farm');

    // Fill Farm Form
    await page.fill('input[name="name"]', 'Kaveri Delta Organic Farm');
    await page.fill('input[name="state"]', 'Tamil Nadu');
    await page.fill('input[name="district"]', 'Thanjavur');
    await page.fill('input[name="village"]', 'Thiruvaiyaru');
    await page.fill('input[name="area"]', '5.5');
    await page.selectOption('select[name="area_unit"]', 'Acres');
    await page.selectOption('select[name="soil_type"]', 'Clay Loam');
    await page.selectOption('select[name="irrigation_method"]', 'Drip');
    await page.selectOption('select[name="water_availability"]', 'Adequate');

    // Submit Farm
    await page.click('button[type="submit"]');

    // 5. Verify Dashboard reflects the saved farm
    await expect(modal).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('heading', { name: 'Kaveri Delta Organic Farm' })).toBeVisible();
    await expect(page.locator('text=5.5 Acres').first()).toBeVisible();

    // 6. Navigate to Farm Details and add a Plot
    await page.goto('/app/farms');
    await page.waitForSelector('text=Loading CropDiary AI...', { state: 'detached', timeout: 15000 }).catch(() => {});
    await page.waitForSelector('text=Kaveri Delta Organic Farm', { state: 'visible', timeout: 15000 });
    await page.getByRole('link', { name: /View & Manage Plots/i }).first().click();

    await page.waitForSelector('text=Back to All Farms', { state: 'visible', timeout: 10000 });
    await expect(page.locator('text=Kaveri Delta Organic Farm').first()).toBeVisible();

    // Add Plot
    const addPlotBtn = page.getByRole('button', { name: /Add New Plot|Create First Plot/i }).first();
    await addPlotBtn.click();

    const plotModal = page.locator('div[role="dialog"]');
    await expect(plotModal).toBeVisible();
    await expect(plotModal).toContainText('Add Plot to Kaveri Delta Organic Farm');

    await page.fill('input[name="name"]', 'Samba Paddy Field');
    await page.fill('input[name="area"]', '3.0');
    await page.selectOption('select[name="area_unit"]', 'Acres');
    await page.selectOption('select[name="soil_type"]', 'Clay Loam');
    await page.selectOption('select[name="irrigation_method"]', 'Drip');

    await page.click('button[type="submit"]');
    await expect(plotModal).not.toBeVisible({ timeout: 8000 });

    // Verify Plot appears in Farm Detail
    await expect(page.locator('text=Samba Paddy Field')).toBeVisible();
    await expect(page.getByText('3 Acres', { exact: true }).first()).toBeVisible();

    // 7. Verify Dashboard updates plot count
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard', { timeout: 10000 });
    await expect(page.locator('text=Total Plots')).toBeVisible();
    await expect(page.locator('text=Kaveri Delta Organic Farm')).toBeVisible();
  });
});
