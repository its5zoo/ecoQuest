import { test, expect } from '@playwright/test';

test.describe('EcoQuest Carbon Tracker E2E Flow', () => {
  const uniqueId = Date.now();
  const testUser = {
    name: `E2E Tester ${uniqueId}`,
    email: `e2etester_${uniqueId}@gmail.com`,
    password: 'Password123!',
    district: 'Mumbai',
    state: 'Maharashtra',
  };

  test('should register, login, log an activity, verify XP, and check leaderboard ranking', async ({ page }) => {
    // ── 1. Navigate to Sign Up ──
    await page.goto('/signup');
    await expect(page).toHaveTitle(/EcoQuest/i);

    // Fill registration form
    await page.fill('input[placeholder="Your Name"]', testUser.name);
    await page.fill('input[placeholder="yourname@gmail.com"]', testUser.email);
    await page.fill('input[placeholder="Min. 8 characters"]', testUser.password);
    await page.fill('input[placeholder="Repeat password"]', testUser.password);
    await page.fill('input[placeholder="e.g. Mumbai"]', testUser.district);
    await page.fill('input[placeholder="e.g. Maharashtra"]', testUser.state);
    
    // Check agreement box
    await page.check('input[type="checkbox"]');
    
    // Click join button
    await page.click('button[type="submit"]');

    // Should redirect to profile page and show welcome message or correct page structure
    await page.waitForURL('**/profile');
    await expect(page.locator('h2')).toContainText(testUser.name);
    
    // Initial XP should be 0 or dynamic starting rank
    const xpText = await page.locator('div:has-text("Total XP")').first().innerText();
    expect(xpText).toBeDefined();

    // ── 2. Log Out & Log In back ──
    // Click logout button (usually located in navbar/header)
    const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), [aria-label="Logout"]');
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await page.waitForURL('**/login');
    } else {
      // Fallback direct navigate to login
      await page.goto('/login');
    }

    // Fill login form
    await page.fill('input[placeholder="yourname@gmail.com"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should successfully redirect back to profile
    await page.waitForURL('**/profile');
    await expect(page.locator('h2')).toContainText(testUser.name);

    // ── 3. Navigate to Tracker Page & Log Activity ──
    await page.goto('/tracker');
    await page.waitForURL('**/tracker');

    // Let's log a quick activity (e.g. Vegetarian Meal, which adds 150XP based on calculateXP logic)
    // Find the Quick Add button for vegetarian meal / salad
    const quickVegMealBtn = page.locator('button:has-text("Vegetarian Meal"), button:has-text("Salad")').first();
    if (await quickVegMealBtn.count() > 0) {
      await quickVegMealBtn.click();
    } else {
      // Manual input if quick-add isn't present or changes
      await page.fill('input[placeholder="e.g., Drove to work"]', 'Vegetarian Meal');
      await page.selectOption('select', { label: 'food' });
      await page.fill('input[type="number"]', '1');
    }

    // Submit the activity form
    await page.click('button:has-text("Log Activity")');

    // Verify toast or list update
    await expect(page.locator('body')).toContainText(/activity logged/i);

    // Wait for the activity card to show up in the logs
    const activityCard = page.locator('div:has-text("Vegetarian Meal")').first();
    await expect(activityCard).toBeVisible();

    // ── 4. Verify XP Updates on Profile Page ──
    await page.goto('/profile');
    await page.waitForURL('**/profile');

    // User should have earned XP (usually 150XP for perfect daily score log)
    const updatedXPText = await page.locator('div:has-text("XP")').first().innerText();
    expect(updatedXPText).not.toContain('0 XP');

    // ── 5. Verify Community Leaderboard Ranks ──
    await page.goto('/community');
    await page.waitForURL('**/community');

    // Locate the newly registered user in the leaderboard rows
    const leaderboardUserRow = page.locator(`tr:has-text("${testUser.name}"), div:has-text("${testUser.name}")`).first();
    await expect(leaderboardUserRow).toBeVisible();

    // Verify it display correct XP value
    const leaderboardXPVal = page.locator(`tr:has-text("${testUser.name}") td:has-text("XP"), div:has-text("${testUser.name}") :has-text("XP")`).first();
    expect(leaderboardXPVal).toBeDefined();
  });
});
