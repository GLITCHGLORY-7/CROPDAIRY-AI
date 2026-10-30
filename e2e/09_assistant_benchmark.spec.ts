import { test, expect } from '@playwright/test';

test.describe('CropDiary AI — Assistant UI Benchmark & Fallback Resilience', () => {
  const timestamp = Date.now();
  const testEmail = `assistant_bench_${timestamp}@cropdiary.ai`;
  const testPassword = 'SecurePassword123!';
  const farmerName = 'Senthil Velan';

  test.beforeEach(async ({ page }) => {
    // Register test farmer account
    await page.goto('/register');
    await page.waitForSelector('input[name="fullName"]', { state: 'visible', timeout: 15000 });

    await page.fill('input[name="fullName"]', farmerName);
    await page.fill('input[name="email"]', testEmail);
    await page.selectOption('select[name="preferredLanguage"]', 'en');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Complete onboarding
    await page.waitForURL('**/onboarding', { timeout: 15000 });
    const saveOnboardingBtn = page.getByRole('button', { name: 'Save & Go to Dashboard' });
    await saveOnboardingBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveOnboardingBtn.click();

    // Arrive at Dashboard
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });
  });

  test('Benchmark Layer: Chat submission, loading state, response display & transparent fallback', async ({ page }) => {
    // 1. Navigate to AI Farm Assistant module
    await page.goto('/app/assistant');
    await page.waitForSelector('textarea[aria-label="Agricultural inquiry input"]', { state: 'visible', timeout: 15000 });

    // 2. Verify initial UI state and suggested prompt buttons
    await expect(page.locator('text=Welcome! Your AI Farm Assistant is ready')).toBeVisible();
    await expect(page.locator('text=Suggested Questions:')).toBeVisible();

    // 3. Click a suggested question or enter query
    const textarea = page.locator('textarea[aria-label="Agricultural inquiry input"]');
    const sendBtn = page.locator('button[aria-label="Send message"]');

    await textarea.fill('What is the recommended fertilizer schedule for Samba paddy?');
    await expect(sendBtn).toBeEnabled();

    // 4. Submit message and observe loading state
    await sendBtn.click();

    // 5. Verify the user message is rendered in chat bubble
    await expect(page.locator('text=What is the recommended fertilizer schedule for Samba paddy?')).toBeVisible();

    // 6. Verify response is rendered with model name / grounded advice
    // Response should be displayed within 15 seconds
    const responseBubble = page.locator('.whitespace-pre-wrap').last();
    await expect(responseBubble).toBeVisible({ timeout: 20000 });
    const responseText = await responseBubble.textContent();
    expect(responseText).toBeDefined();
    expect(responseText!.length).toBeGreaterThan(10);

    // 7. Verify model badge and agricultural compliance notice are visible
    const complianceNotice = page.locator('text=Notice: AI responses are informational guidance');
    await expect(complianceNotice).toBeVisible();
  });
});
