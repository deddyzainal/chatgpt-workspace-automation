# Parallel Setup Guide

This guide explains how to run authentication setup in parallel for multiple user accounts.

## Overview

When you have multiple user accounts, you can run the setup in parallel so that all browser windows open simultaneously. This allows you to enter OTP codes for multiple accounts at the same time, making the setup process much faster.

## How It Works

1. **Parallel Execution**: All setup tests run simultaneously (one browser window per user)
2. **Window Identification**: Each browser window has a unique title showing which user it's for
3. **Console Logging**: Clear console messages identify which user needs OTP entry
4. **Independent Progress**: Each user's authentication progresses independently

## Usage

### Run All Users in Parallel

```bash
# Authenticate all users in parallel
npx playwright test --project=setup
```

This will:
- Open multiple browser windows (one per user)
- Each window will show the login process for that user
- You can enter OTP codes for all users simultaneously
- Each authentication completes independently

### Run Specific User

```bash
# Authenticate only one user
CHATGPT_USER_ID=admin npx playwright test --project=setup
```

### Limit Parallel Workers

If you have many users and want to limit how many run simultaneously:

```bash
# Run with maximum 3 parallel workers
npx playwright test --project=setup --workers=3
```

Or update `playwright.config.ts`:

```typescript
{
  name: 'setup',
  testMatch: /.*\.setup\.ts/,
  fullyParallel: true,
  workers: 3, // Limit to 3 parallel workers
}
```

## Identifying Browser Windows

Each browser window will have:
- **Window Title**: `ChatGPT Auth - {userId} ({username})`
  - Example: `ChatGPT Auth - admin (yogaksanao)`
- **Console Messages**: Clear identification in the terminal
  - Shows which user needs OTP entry
  - Shows email address for each user

### Example Console Output

```
🚀 Starting authentication for 3 user(s) in parallel...
📋 Users to authenticate: admin, user1, user2

============================================================
🔐 Authenticating user: admin (yogaksanao@hinedigitals.store)
📧 Email: yogaksanao@hinedigitals.store
💾 Auth file: playwright/.auth/admin.json
============================================================

============================================================
🔐 Authenticating user: user1 (sukonakozg@hinedigitals.store)
📧 Email: sukonakozg@hinedigitals.store
💾 Auth file: playwright/.auth/user1.json
============================================================

============================================================
⚠️  OTP CODE REQUIRED FOR: ADMIN
📧 Email: yogaksanao@hinedigitals.store
🪟 Look for browser window with title containing: "admin" or "yogaksanao"
⏳ Waiting for you to enter the OTP code and click Continue...
💡 The script will continue automatically once you complete the login.
============================================================
```

## Tips for Parallel Setup

### 1. Organize Browser Windows

- Arrange browser windows side-by-side on your screen
- Use window titles to identify which user each window is for
- Check the console output to see which user needs OTP entry

### 2. Enter OTP Codes Efficiently

- Have all OTP codes ready before starting
- Enter codes in the order they appear in the console
- Each window waits independently, so you can take your time

### 3. Monitor Progress

- Watch the console for completion messages
- Each user completes independently
- Failed authentications won't block others

### 4. Handle Errors

If one user fails:
- Other users continue normally
- You can re-run just the failed user:
  ```bash
  CHATGPT_USER_ID=failed-user-id npx playwright test --project=setup
  ```

## Configuration Options

### Limit Workers

In `playwright.config.ts`:

```typescript
{
  name: 'setup',
  testMatch: /.*\.setup\.ts/,
  fullyParallel: true,
  workers: 2, // Run max 2 at a time
}
```

### Sequential Execution (Not Recommended)

If you prefer sequential execution (one at a time):

```typescript
{
  name: 'setup',
  testMatch: /.*\.setup\.ts/,
  fullyParallel: false, // Run one at a time
  workers: 1,
}
```

Or use command line:

```bash
npx playwright test --project=setup --workers=1
```

## Troubleshooting

### Issue: Too Many Browser Windows

**Solution**: Limit the number of workers:
```bash
npx playwright test --project=setup --workers=2
```

### Issue: Can't Identify Which Window is Which

**Solution**: 
- Check the browser window title (tab title)
- Look at the console output for user identification
- The email address is shown in both the window and console

### Issue: One User Blocks Others

**Solution**: This shouldn't happen with parallel execution. Each user runs independently. If one fails, others continue.

### Issue: OTP Code Expired

**Solution**: The script waits for you to enter the code. If it expires:
1. The test will timeout after 2 minutes
2. Re-run just that user: `CHATGPT_USER_ID=user-id npx playwright test --project=setup`

## Best Practices

1. **Start with Few Users**: Test with 2-3 users first to get comfortable
2. **Have OTP Codes Ready**: Prepare all OTP codes before starting
3. **Monitor Console**: Keep an eye on console output for status updates
4. **Use Window Titles**: Browser window titles help identify users
5. **Limit Workers if Needed**: Don't overwhelm yourself with too many windows

## Example Workflow

1. **Prepare**: Have all user credentials and OTP codes ready
2. **Run Setup**: `npx playwright test --project=setup`
3. **Identify Windows**: Check window titles to identify each user
4. **Enter OTP Codes**: Enter codes for each user as they appear
5. **Monitor Progress**: Watch console for completion messages
6. **Verify**: Check that auth files were created in `playwright/.auth/`

## Summary

Parallel setup execution allows you to:
- ✅ Authenticate multiple users simultaneously
- ✅ Save time by entering OTP codes in parallel
- ✅ Identify each browser window easily
- ✅ Monitor progress independently for each user
- ✅ Handle errors gracefully (one failure doesn't block others)

