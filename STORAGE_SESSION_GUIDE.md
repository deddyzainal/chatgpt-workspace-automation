# How to Save Storage Session Using Playwright Codegen

This guide explains how to save authentication state (storage session) using Playwright's codegen tool.

## Method 1: Using the Setup Script (Recommended)

The easiest way is to use the provided setup script:

1. **Set your credentials:**
   ```bash
   export CHATGPT_EMAIL="your-email@example.com"
   export CHATGPT_PASSWORD="your-password"
   ```

2. **Run the setup script:**
   ```bash
   npx playwright test --project=setup
   ```
   
   This will log in and save the authentication state to `playwright/.auth/user.json`

3. **Run your tests (they'll use the saved auth):**
   ```bash
   npx playwright test
   ```

## Method 2: Using Codegen Manually

If you want to use `npx playwright codegen` to record and save the session:

### Step 1: Start Codegen
```bash
npx playwright codegen https://chatgpt.com
```

This opens a browser window and the Playwright Inspector.

### Step 2: Record Your Login
- Manually log in to ChatGPT in the codegen browser
- The codegen tool will record all your actions

### Step 3: Save Storage State

After logging in, you can save the storage state in two ways:

#### Option A: Save from Codegen Console
In the Playwright Inspector, open the browser console and run:
```javascript
await page.context().storageState({ path: 'playwright/.auth/user.json' });
```

#### Option B: Create a Script from Generated Code
1. Copy the generated code from codegen
2. Add this line at the end (after successful login):
   ```typescript
   await page.context().storageState({ path: 'playwright/.auth/user.json' });
   ```
3. Save it as a script and run it once

### Step 4: Use Saved State in Tests

Update your `playwright.config.ts` to use the saved state:
```typescript
use: {
  storageState: 'playwright/.auth/user.json',
}
```

Or use it in individual tests:
```typescript
test('my test', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: 'playwright/.auth/user.json',
  });
  const page = await context.newPage();
  // ... your test code
});
```

## Method 3: Save Storage State Programmatically

You can also save storage state in your test code:

```typescript
import { test } from '@playwright/test';

test('save auth state', async ({ page }) => {
  // ... perform login ...
  
  // Save the storage state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

## Important Notes

- The storage state file contains cookies and local storage, so keep it secure
- The `.auth/` directory is already in `.gitignore` to prevent committing credentials
- Storage states expire when sessions expire, so you may need to regenerate them periodically
- For ChatGPT specifically, sessions may expire after some time, requiring re-authentication

## Troubleshooting

If your saved state doesn't work:
1. The session may have expired - regenerate the auth state
2. Check that the file path is correct
3. Verify the storage state file exists: `ls playwright/.auth/user.json`
4. Try running the setup script again to refresh the auth state

