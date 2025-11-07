# ChatGPT Workspace Automation

A Playwright-based automation tool for managing ChatGPT workspace members with multi-user authentication support, fingerprinting evasion, and parallel execution capabilities.

## Features

- 🔐 **Multi-User Authentication** - Manage multiple ChatGPT accounts with separate authentication states
- 🚀 **Parallel Execution** - Run authentication setup for multiple users simultaneously
- 🎭 **Fingerprinting Evasion** - Advanced browser fingerprinting evasion techniques
- 🔄 **Dynamic Project Creation** - Automatically creates projects for each auth file
- 📦 **Storage State Management** - Save and reuse authentication sessions
- 🛡️ **Secure Credential Management** - Environment variable-based configuration

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Multi-User Authentication](#multi-user-authentication)
- [Parallel Setup](#parallel-setup)
- [Storage Session Management](#storage-session-management)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up credentials:**
   ```bash
   cp env.example .env
   # Edit .env with your credentials
   ```

3. **Authenticate users:**
   ```bash
   npx playwright test --project=setup
   ```

4. **Run tests:**
   ```bash
   # Run with all auth files
   npx playwright test tests/gpt-scrape.spec.ts
   
   # Run with specific user
   npx playwright test --project=chromium-admin tests/gpt-scrape.spec.ts
   ```

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Configuration

### Environment Variables

Create a `.env` file in the project root (see `env.example` for reference):

**Method 1: JSON Array (Recommended for Multiple Users)**
```env
CHATGPT_USERS='[{"id":"admin","email":"admin@example.com","password":"admin123","authFile":"playwright/.auth/admin.json"},{"id":"user1","email":"user1@example.com","password":"pass1","authFile":"playwright/.auth/user1.json"}]'
```

**Method 2: Individual Variables**
```env
CHATGPT_USER1_EMAIL=user1@example.com
CHATGPT_USER1_PASSWORD=password1
CHATGPT_USER2_EMAIL=user2@example.com
CHATGPT_USER2_PASSWORD=password2
```

**Method 3: Single User (Backward Compatibility)**
```env
CHATGPT_EMAIL=your-email@example.com
CHATGPT_PASSWORD=your-password
```

## Multi-User Authentication

### Overview

The multi-user authentication system allows you to:
- Manage multiple ChatGPT accounts
- Generate separate authentication files for each user
- Switch between users easily in your tests
- Keep credentials secure using environment variables

### File Structure

```
tests/
  ├── auth.setup.ts      # Authentication setup script (supports multiple users)
  ├── users.config.ts   # User configuration helper
  └── gpt-scrape.spec.ts # Your test files

playwright/.auth/
  ├── user.json         # Default user (backward compatibility)
  ├── user1.json        # First user
  ├── user2.json        # Second user
  └── admin.json        # Admin user (example)
```

### Setup Methods

#### Method 1: Individual Environment Variables (Recommended for Simple Cases)

Set environment variables for each user:

```bash
# User 1
export CHATGPT_USER1_EMAIL="user1@example.com"
export CHATGPT_USER1_PASSWORD="password1"

# User 2
export CHATGPT_USER2_EMAIL="user2@example.com"
export CHATGPT_USER2_PASSWORD="password2"
```

This will generate:
- `playwright/.auth/user1.json`
- `playwright/.auth/user2.json`

#### Method 2: JSON Environment Variable (Recommended for Multiple Users)

Set a single JSON environment variable with all users:

```bash
export CHATGPT_USERS='[
  {"id":"admin","email":"admin@example.com","password":"admin123","authFile":"playwright/.auth/admin.json"},
  {"id":"user1","email":"user1@example.com","password":"pass1","authFile":"playwright/.auth/user1.json"},
  {"id":"user2","email":"user2@example.com","password":"pass2","authFile":"playwright/.auth/user2.json"}
]'
```

#### Method 3: Backward Compatibility (Single User)

For backward compatibility, you can still use the old method:

```bash
export CHATGPT_EMAIL="user@example.com"
export CHATGPT_PASSWORD="password"
```

This will generate `playwright/.auth/user.json`

### Usage

#### Authenticate All Users

```bash
# Authenticate all configured users
npx playwright test --project=setup
```

#### Authenticate a Specific User

```bash
# Authenticate only user1
CHATGPT_USER_ID=user1 npx playwright test --project=setup

# Authenticate only admin
CHATGPT_USER_ID=admin npx playwright test --project=setup
```

### Using Different Users in Tests

Projects are automatically created for each auth file. You can run tests with:

```bash
# Run with all auth files (parallel)
npx playwright test tests/gpt-scrape.spec.ts

# Run with specific user
npx playwright test --project=chromium-admin tests/gpt-scrape.spec.ts
npx playwright test --project=chromium-user1 tests/gpt-scrape.spec.ts

# List all available projects
npx playwright test --list
```

## Parallel Setup

### Overview

When you have multiple user accounts, you can run the setup in parallel so that all browser windows open simultaneously. This allows you to enter OTP codes for multiple accounts at the same time, making the setup process much faster.

### How It Works

1. **Parallel Execution**: All setup tests run simultaneously (one browser window per user)
2. **Window Identification**: Each browser window has a unique title showing which user it's for
3. **Console Logging**: Clear console messages identify which user needs OTP entry
4. **Independent Progress**: Each user's authentication progresses independently

### Usage

#### Run All Users in Parallel

```bash
# Authenticate all users in parallel
npx playwright test --project=setup
```

This will:
- Open multiple browser windows (one per user)
- Each window will show the login process for that user
- You can enter OTP codes for all users simultaneously
- Each authentication completes independently

#### Run Specific User

```bash
# Authenticate only one user
CHATGPT_USER_ID=admin npx playwright test --project=setup
```

#### Limit Parallel Workers

If you have many users and want to limit how many run simultaneously:

```bash
# Run with maximum 3 parallel workers
npx playwright test --project=setup --workers=3
```

### Identifying Browser Windows

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
⚠️  OTP CODE REQUIRED FOR: ADMIN
📧 Email: yogaksanao@hinedigitals.store
🪟 Look for browser window with title containing: "admin" or "yogaksanao"
⏳ Waiting for you to enter the OTP code and click Continue...
💡 The script will continue automatically once you complete the login.
============================================================
```

### Tips for Parallel Setup

1. **Organize Browser Windows**: Arrange browser windows side-by-side on your screen
2. **Have OTP Codes Ready**: Prepare all OTP codes before starting
3. **Monitor Console**: Keep an eye on console output for status updates
4. **Use Window Titles**: Browser window titles help identify users
5. **Limit Workers if Needed**: Don't overwhelm yourself with too many windows

## Storage Session Management

### Method 1: Using the Setup Script (Recommended)

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

### Method 2: Using Codegen Manually

If you want to use `npx playwright codegen` to record and save the session:

#### Step 1: Start Codegen
```bash
npx playwright codegen https://chatgpt.com
```

This opens a browser window and the Playwright Inspector.

#### Step 2: Record Your Login
- Manually log in to ChatGPT in the codegen browser
- The codegen tool will record all your actions

#### Step 3: Save Storage State

After logging in, you can save the storage state in two ways:

**Option A: Save from Codegen Console**
In the Playwright Inspector, open the browser console and run:
```javascript
await page.context().storageState({ path: 'playwright/.auth/user.json' });
```

**Option B: Create a Script from Generated Code**
1. Copy the generated code from codegen
2. Add this line at the end (after successful login):
   ```typescript
   await page.context().storageState({ path: 'playwright/.auth/user.json' });
   ```
3. Save it as a script and run it once

### Method 3: Save Storage State Programmatically

You can also save storage state in your test code:

```typescript
import { test } from '@playwright/test';

test('save auth state', async ({ page }) => {
  // ... perform login ...
  
  // Save the storage state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

### Important Notes

- The storage state file contains cookies and local storage, so keep it secure
- The `.auth/` directory is already in `.gitignore` to prevent committing credentials
- Storage states expire when sessions expire, so you may need to regenerate them periodically
- For ChatGPT specifically, sessions may expire after some time, requiring re-authentication

## Running Tests

### Run with All Auth Files

```bash
# Run the test with all auth files simultaneously (parallel)
npx playwright test tests/gpt-scrape.spec.ts
```

### Run with Specific User

```bash
# Run with admin auth file
npx playwright test --project=chromium-admin tests/gpt-scrape.spec.ts

# Run with user1 auth file
npx playwright test --project=chromium-user1 tests/gpt-scrape.spec.ts
```

### List Available Projects

```bash
# See all available projects
npx playwright test --list
```

### Run Multiple Specific Projects

```bash
# Run with multiple specific projects
npx playwright test --project=chromium-admin --project=chromium-user1 tests/gpt-scrape.spec.ts
```

## Project Structure

```
.
├── tests/
│   ├── auth.setup.ts          # Authentication setup script
│   ├── users.config.ts        # User configuration helper
│   └── gpt-scrape.spec.ts     # Main test file
├── playwright/
│   ├── .auth/                 # Authentication state files (gitignored)
│   │   ├── admin.json
│   │   ├── user.json
│   │   └── user1.json
│   └── .cache/                # Playwright cache
├── playwright.config.ts       # Playwright configuration
├── package.json               # Dependencies
├── .env                       # Environment variables (gitignored)
├── env.example                # Example environment file
└── README.md                  # This file
```

## Best Practices

### 1. Security

- ✅ **DO**: Store credentials in environment variables
- ✅ **DO**: Add `.env` to `.gitignore`
- ✅ **DO**: Use separate auth files for each user
- ❌ **DON'T**: Hardcode credentials in code
- ❌ **DON'T**: Commit `.env` files to git

### 2. Organization

- Use descriptive user IDs (e.g., `admin`, `test-user`, `prod-user`)
- Keep auth files organized in `playwright/.auth/`
- Document which user is for which purpose

### 3. Maintenance

- Regenerate auth files periodically (sessions expire)
- Use consistent naming conventions
- Keep user configuration in one place (`users.config.ts`)

### 4. Parallel Setup

- Start with few users (2-3) first to get comfortable
- Have OTP codes ready before starting
- Monitor console output for status updates
- Use window titles to identify users
- Limit workers if needed

## Troubleshooting

### Issue: "No user accounts found"

**Solution**: Make sure you've set at least one of:
- `CHATGPT_EMAIL` and `CHATGPT_PASSWORD` (single user)
- `CHATGPT_USER1_EMAIL` and `CHATGPT_USER1_PASSWORD` (first user)
- `CHATGPT_USERS` (JSON array)

### Issue: "User with ID 'xyz' not found"

**Solution**: Check that the user ID exists in your configuration. List available users:
```typescript
import { getUserAccounts } from './users.config';
console.log(getUserAccounts().map(u => u.id));
```

### Issue: Auth file not found

**Solution**: Run the setup first:
```bash
npx playwright test --project=setup
```

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

### Issue: OTP Code Expired

**Solution**: The script waits for you to enter the code. If it expires:
1. The test will timeout after 2 minutes
2. Re-run just that user: `CHATGPT_USER_ID=user-id npx playwright test --project=setup`

### Issue: Saved state doesn't work

**Solution**:
1. The session may have expired - regenerate the auth state
2. Check that the file path is correct
3. Verify the storage state file exists: `ls playwright/.auth/user.json`
4. Try running the setup script again to refresh the auth state

## Advanced Usage

### Custom Auth File Paths

You can specify custom paths in the JSON configuration:

```json
[
  {
    "id": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "authFile": "playwright/.auth/admin.json"
  },
  {
    "id": "user1",
    "email": "user1@example.com",
    "password": "pass1",
    "authFile": "playwright/.auth/custom/path/user1.json"
  }
]
```

### Programmatic User Selection

```typescript
import { getUserAccounts, getUserAccount } from './users.config';

// Get all users
const allUsers = getUserAccounts();

// Get specific user
const admin = getUserAccount('admin');

// Get default (first) user
const defaultUser = getDefaultUserAccount();
```

## Examples

### Example 1: Two Users Setup

```bash
# Set environment variables
export CHATGPT_USER1_EMAIL="admin@company.com"
export CHATGPT_USER1_PASSWORD="admin123"
export CHATGPT_USER2_EMAIL="tester@company.com"
export CHATGPT_USER2_PASSWORD="test123"

# Authenticate both users
npx playwright test --project=setup

# Run tests with user1
npx playwright test --project=chromium-user1

# Run tests with user2
npx playwright test --project=chromium-user2
```

### Example 2: Using JSON Configuration

```bash
export CHATGPT_USERS='[
  {"id":"admin","email":"admin@example.com","password":"admin123"},
  {"id":"tester","email":"tester@example.com","password":"test123"},
  {"id":"demo","email":"demo@example.com","password":"demo123"}
]'

# Authenticate all users
npx playwright test --project=setup

# Authenticate only admin
CHATGPT_USER_ID=admin npx playwright test --project=setup
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

