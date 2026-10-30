import { test, expect } from '@playwright/test';

test.describe('CropDiary AI — End-to-End Browser & Design Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to base login
    await page.goto('/login');

    // Wait for the login email input to render (handling React.lazy suspense)
    const emailInput = page.locator('input[type="email"]');
    try {
      await emailInput.waitFor({ state: 'visible', timeout: 8000 });
      await emailInput.fill('farmer@cropdiary.ai');
      await page.locator('input[type="password"]').fill('farmer123');
      await page.click('button[type="submit"]');
    } catch {
      // Already authenticated
    }

    // Handle initial onboarding if routed there
    await page.waitForURL((url) => url.pathname.includes('/onboarding') || url.pathname.includes('/app/dashboard'), { timeout: 15000 });
    if (page.url().includes('/onboarding')) {
      const saveBtn = page.getByRole('button', { name: 'Save & Go to Dashboard' });
      await saveBtn.waitFor({ state: 'visible', timeout: 8000 });
      await saveBtn.click();
    }

    // Wait for navigation into /app/dashboard
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });
  });

  test('1. Dashboard renders Screen 2 design board elements faithfully', async ({ page }) => {
    // Header Greeting & Subtitle
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/(Good morning|Good afternoon|Good evening|Vanakkam)/i);
    await expect(page.locator('text=what\'s happening with your farms today')).toBeVisible();

    // Top Highlights: Weather Card
    await expect(page.locator('text=View Forecast')).toBeVisible();
    await expect(page.locator('text=°C').first()).toBeVisible();
    await expect(page.locator('text=Humidity:')).toBeVisible();
    await expect(page.locator('text=Rainfall:')).toBeVisible();
    await expect(page.locator('text=Wind:')).toBeVisible();

    // Top Highlights: Farming Journey Card
    await expect(page.locator('text=Your Farming Journey')).toBeVisible();

    // 3 Core KPI Stat Cards
    await expect(page.locator('text=Total Farms')).toBeVisible();
    await expect(page.locator('text=Total Plots')).toBeVisible();
    await expect(page.locator('text=Total Land Area')).toBeVisible();

    // Active Farm Section
    await expect(page.locator('h2:has-text("Active Farm")')).toBeVisible();

    // 4 Quick Actions (2x2 Grid)
    await expect(page.locator('h2:has-text("Quick Actions")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Farm")')).toBeVisible();
    await expect(page.getByRole('link', { name: /Create Crop Plan/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Log Activity/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Record Expense/ })).toBeVisible();

    // Recent Activities & Upcoming Reminders Feeds
    await expect(page.locator('h2:has-text("Recent Activities")')).toBeVisible();
    await expect(page.locator('h2:has-text("Upcoming Reminders")')).toBeVisible();
  });

  test('2. Zero development metadata exposed in UI', async ({ page }) => {
    const pageContent = await page.content();

    // Assert absolute absence of prototype phase labels
    expect(pageContent).not.toContain('Phase 1-8 Live');
    expect(pageContent).not.toContain('Phases 1-8 Live');
    expect(pageContent).not.toContain('Phase 2 Live');
    expect(pageContent).not.toContain('Phase 3 Live');
    expect(pageContent).not.toContain('Phase 4 Live');
    expect(pageContent).not.toContain('Phase 5 Live');
    expect(pageContent).not.toContain('Phase 6 Live');
    expect(pageContent).not.toContain('Phase 7 Live');
    expect(pageContent).not.toContain('Phase 8 Live');
    expect(pageContent).not.toContain('Module Roadmap');
  });

  test('3. Real-Time Service Diagnostics modal opens and displays integration matrix', async ({ page }) => {
    // Click connection status pill in header
    const statusPill = page.locator('button[aria-label="View system and integration diagnostics"]');
    await expect(statusPill).toBeVisible();
    await statusPill.click();

    // Verify modal appears with role="dialog"
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('System Integrations & Service Diagnostics');

    // Check presence of key external integrations
    await expect(modal).toContainText('Supabase Cloud');
    await expect(modal).toContainText('Google Gemini');
    await expect(modal).toContainText('Open-Meteo');
    await expect(modal).toContainText('Agmarknet');
    await expect(modal).toContainText('IndexedDB');

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('4. Quick Actions navigate smoothly to target modules', async ({ page }) => {
    // Click "Create Crop Plan"
    await page.getByRole('link', { name: /Create Crop Plan/ }).click();
    await page.waitForURL('**/app/crop-planner', { timeout: 8000 });
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Navigate back to Dashboard
    await page.click('text=Dashboard');
    await page.waitForURL('**/app/dashboard', { timeout: 8000 });

    // Click "Log Activity"
    await page.getByRole('link', { name: /Log Activity/ }).first().click();
    await page.waitForURL('**/app/diary/new', { timeout: 8000 });
    await expect(page.locator('h1, h2').filter({ hasText: /(New Farm Diary Entry|No Farm Registered Yet)/i })).toBeVisible();
  });

  test('5. Mobile responsive layout and navigation clearance', async ({ page }) => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile bottom navigation is rendered
    const bottomNav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
    await expect(bottomNav).toBeVisible();

    // Verify dashboard content is still cleanly readable
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Quick Actions')).toBeVisible();
  });

});
