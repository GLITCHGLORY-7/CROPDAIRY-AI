import { test, expect } from '@playwright/test';

test.describe('CropDiary AI — Phase 12: Responsive Design & Visual Integrity Audit', () => {

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

  test('Visual Audit 1: Desktop Viewport (1280x800) displays semantic landmarks and zero internal dev metadata', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/app/dashboard');
    await page.waitForSelector("text=Here's what's happening with your farms today", { state: 'visible', timeout: 15000 });

    // 1. Semantic Accessibility Landmarks
    await expect(page.locator('header[role="banner"]')).toBeVisible();
    await expect(page.locator('main[role="main"]')).toBeVisible();
    await expect(page.locator('aside[aria-label="Sidebar navigation"]')).toBeVisible();

    // 2. Zero Horizontal Overflow
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);

    // 3. Zero Development Metadata / Badges in Farmer UI
    const devBadgeRegexes = [
      /Phase 1–8 Live/i,
      /Phase 3 Live/i,
      /Phase 7 Live/i,
      /Phases 1–8 Live/i,
      /Module Roadmap/i,
    ];

    for (const regex of devBadgeRegexes) {
      const count = await page.locator(`text=${regex.source}`).count();
      expect(count).toBe(0);
    }
  });

  test('Visual Audit 2: Tablet Viewport (768x1024) preserves responsive layout and fluid grid', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/app/dashboard');
    await page.waitForSelector("text=Here's what's happening with your farms today", { state: 'visible', timeout: 15000 });

    // 1. Zero Horizontal Overflow on Tablet
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);

    // 2. Main content area is visible and properly rendered
    await expect(page.locator('main[role="main"]')).toBeVisible();
    await expect(page.locator('header[role="banner"]')).toBeVisible();
  });

  test('Visual Audit 3: Mobile Viewport (375x667) renders accessible bottom navigation and zero overlap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/dashboard');
    await page.waitForSelector("text=Here's what's happening with your farms today", { state: 'visible', timeout: 15000 });

    // 1. Mobile Bottom Navigation is visible
    const bottomNav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
    await expect(bottomNav).toBeVisible();

    // Desktop sidebar must be hidden
    await expect(page.locator('aside[aria-label="Sidebar navigation"]')).not.toBeVisible();

    // 2. Main content container has bottom clearance padding (pb-24) to avoid navigation occlusion
    const mainHasBottomPadding = await page.evaluate(() => {
      const main = document.querySelector('main[role="main"]');
      if (!main) return false;
      const computedPaddingBottom = parseFloat(window.getComputedStyle(main).paddingBottom);
      return computedPaddingBottom >= 60; // pb-24 corresponds to 96px
    });
    expect(mainHasBottomPadding).toBe(true);

    // 3. Zero Horizontal Overflow on Mobile Screen
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);
  });
});
