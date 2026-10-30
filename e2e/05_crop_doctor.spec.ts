import { test, expect } from '@playwright/test';

test.describe('CropDiary AI — Phase 12: Crop Doctor & Epistemic Diagnostics', () => {

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

  test('E. Crop Doctor handles invalid uploads and provides provisional diagnosis with honest epistemic attribution', async ({ page }) => {
    // 1. Navigate to Crop Doctor New Assessment
    await page.goto('/app/crop-doctor/new');
    await page.waitForSelector('text=Step 1: Select Affected Farm, Plot & Crop', { state: 'visible', timeout: 15000 });

    // 2. Step 1: Select Paddy / Rice and continue
    const continueBtn = page.getByRole('button', { name: /Continue to Photo & Symptoms/i });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // 3. Step 2: Test Invalid File Upload Validation (Rejection of Non-Image MIME)
    await page.waitForSelector('text=Step 2: Upload Photo & Describe Observable Symptoms', { state: 'visible', timeout: 10000 });

    // Set invalid non-image file
    const fileInput = page.locator('#crop-photo-file-input');
    await fileInput.setInputFiles({
      name: 'invoice_receipt.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Fake PDF Content for Validation'),
    });

    // Assert validation error message appears
    await expect(page.locator('text=Unsupported image format')).toBeVisible();

    // 4. Test Valid Image Upload
    const validPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    await fileInput.setInputFiles({
      name: 'paddy_leaf_blight.png',
      mimeType: 'image/png',
      buffer: validPngBuffer,
    });

    // Verify invalid error clears and valid upload confirmation appears
    await expect(page.locator('text=Unsupported image format')).not.toBeVisible();
    await expect(page.locator('text=GPS / EXIF Stripped').first()).toBeVisible();

    // 5. Run Diagnostic Analysis
    const runBtn = page.getByRole('button', { name: /Run Crop Health Diagnosis/i });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // 6. Verify Step 3: Diagnostic Results & Epistemic Honesty
    await page.waitForSelector('text=Crop Doctor Diagnosis', { state: 'visible', timeout: 15000 });

    // Verify Provisional Hypothesis Label
    const provisionalBadge = page.locator('text=Provisional AI Hypothesis (Field Unconfirmed)');
    await expect(provisionalBadge).toBeVisible();

    // Verify Epistemic Notice & Agronomic Research Attribution
    await expect(page.locator('text=Diagnostic Engine Notice:')).toBeVisible();
    const noticeContent = page.locator('text=ICAR & TNAU Plant Pathology Agronomic Knowledge Base').or(page.locator('text=Deterministic Agronomic Knowledge Base'));
    await expect(noticeContent.first()).toBeVisible();

    // Verify Escalation Advisory presence
    await expect(page.locator('text=Agronomic Escalation Advisory:').first()).toBeVisible();

    // 7. Save Assessment
    const saveAssessmentBtn = page.getByRole('button', { name: /Save to Farm Records/i });
    if (await saveAssessmentBtn.isVisible()) {
      await saveAssessmentBtn.click();
      await page.waitForURL('**/app/crop-doctor/**', { timeout: 10000 });
      await expect(page.locator('text=Diagnosis Saved').or(page.locator('text=Crop Doctor Diagnosis')).first()).toBeVisible();
    }
  });
});
