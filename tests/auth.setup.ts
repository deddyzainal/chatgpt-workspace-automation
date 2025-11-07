import { test, test as setup } from '@playwright/test';
import { getUserAccounts, getUserAccount } from './users.config';

/**
 * This setup script logs into ChatGPT and saves the authentication state for multiple users
 * Run this once to save your session, then use it in your tests
 * 
 * Usage:
 * - Single user: npx playwright test --project=setup
 * - Specific user: CHATGPT_USER_ID=user1 npx playwright test --project=setup
 * - All users: npx playwright test tests/auth.setup.ts
 * 
 * Environment Variables:
 * - CHATGPT_USER_ID: Specific user ID to authenticate (optional, defaults to first user)
 * - CHATGPT_EMAIL / CHATGPT_PASSWORD: Single user (backward compatibility)
 * - CHATGPT_USER1_EMAIL / CHATGPT_USER1_PASSWORD: First user
 * - CHATGPT_USER2_EMAIL / CHATGPT_USER2_PASSWORD: Second user
 * - CHATGPT_USERS: JSON array of users (see users.config.ts)
 */

/**
 * Authenticate a single user
 */
async function authenticateUser(page: any, email: string, password: string, authFile: string, userId: string) {
  // Set browser window title to identify which user this is
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Extract username from email for display
  const username = email.split('@')[0];
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔐 Authenticating user: ${userId} (${email})`);
  console.log(`📧 Email: ${email}`);
  console.log(`💾 Auth file: ${authFile}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Navigate to ChatGPT
  await page.goto('https://chatgpt.com', { waitUntil: 'networkidle' });
  
  // Try to set window title (if supported by browser)
  try {
    await page.evaluate((title) => {
      document.title = title;
    }, `ChatGPT Auth - ${userId} (${username})`);
  } catch (e) {
    // Ignore if not supported
  }

  await page.getByTestId('login-button').click();
  
  // Fill email - fill() automatically focuses the element, no need to click
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  
  // Wait for password page to load
  await page.waitForURL(/.*password.*/, { timeout: 10000 }).catch(async () => {
    // If URL doesn't match, wait for password field to appear
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
  });
  
  // Fill password - use more specific selector to avoid label interception
  // fill() automatically focuses the element, so we don't need to click first
  const passwordInput = page.locator('input[type="password"], input[name="current-password"]').first();
  await passwordInput.waitFor({ state: 'visible' });
  await passwordInput.fill(password);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  
  // Wait for OTP code input field and click it
  const codeInput = page.getByRole('textbox', { name: 'Code' });
  await codeInput.waitFor({ state: 'visible' });
  await codeInput.click();
  
  // Prompt user to manually enter OTP code with clear identification
  console.log(`\n${'='.repeat(60)}`);
  console.log(`⚠️  OTP CODE REQUIRED FOR: ${userId.toUpperCase()}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🪟 Look for browser window with title containing: "${userId}" or "${username}"`);
  console.log(`⏳ Waiting for you to enter the OTP code and click Continue...`);
  console.log(`💡 The script will continue automatically once you complete the login.`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Wait for user to enter code and complete login
  // Wait for either navigation to chat page or chat interface to appear
  await Promise.race([
    // Wait for navigation to chat page (successful login)
    page.waitForURL(/.*chat.*/, { timeout: 120000 }),
    // Wait for chat interface to appear
    page.waitForSelector('textarea', { timeout: 120000 })
  ]).catch(() => {
    console.log('⏳ Still waiting for login to complete...');
  });
  
  // Additional verification to ensure login is complete
  try {
    await page.waitForSelector('textarea', { timeout: 10000 });
    console.log(`✅ Login successful for ${email}! Saving storage state...`);
  } catch {
    console.log(`⚠️  Warning: Chat interface not detected for ${email}, but proceeding to save state...`);
  }

  // Save the authentication state
  await page.context().storageState({ path: authFile });
  console.log(`✅ Authentication state saved to ${authFile}\n`);
}

// Get the specific user ID from environment variable, or use all users
const userId = process.env.CHATGPT_USER_ID;
const users = getUserAccounts();

if (users.length === 0) {
  throw new Error('No user accounts found. Please set user credentials in environment variables. See users.config.ts for details.');
}

// If specific user ID is provided, authenticate only that user
if (userId) {
  const user = getUserAccount(userId);
  if (!user) {
    throw new Error(`User with ID "${userId}" not found. Available users: ${users.map(u => u.id).join(', ')}`);
  }
  
  setup(`authenticate-${user.id}`, async ({ page }) => {
    test.setTimeout(120000);
    await authenticateUser(page, user.email, user.password, user.authFile, user.id);
  });
} else {
  // Authenticate all users (will run in parallel)
  console.log(`\n🚀 Starting authentication for ${users.length} user(s) in parallel...`);
  console.log(`📋 Users to authenticate: ${users.map(u => u.id).join(', ')}\n`);
  
  for (const user of users) {
    setup(`authenticate-${user.id}`, async ({ page }) => {
      test.setTimeout(120000);
      await authenticateUser(page, user.email, user.password, user.authFile, user.id);
    });
  }
}

