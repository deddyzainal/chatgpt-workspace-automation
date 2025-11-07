# Multi-User Authentication Setup Guide

This guide explains how to set up and use multiple user accounts for authentication in Playwright tests.

## Overview

The multi-user authentication system allows you to:
- Manage multiple ChatGPT accounts
- Generate separate authentication files for each user
- Switch between users easily in your tests
- Keep credentials secure using environment variables

## File Structure

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

## Setup Methods

### Method 1: Individual Environment Variables (Recommended for Simple Cases)

Set environment variables for each user:

```bash
# User 1
export CHATGPT_USER1_EMAIL="user1@example.com"
export CHATGPT_USER1_PASSWORD="password1"

# User 2
export CHATGPT_USER2_EMAIL="user2@example.com"
export CHATGPT_USER2_PASSWORD="password2"

# User 3
export CHATGPT_USER3_EMAIL="user3@example.com"
export CHATGPT_USER3_PASSWORD="password3"
```

This will generate:
- `playwright/.auth/user1.json`
- `playwright/.auth/user2.json`
- `playwright/.auth/user3.json`

### Method 2: JSON Environment Variable (Recommended for Multiple Users)

Set a single JSON environment variable with all users:

```bash
export CHATGPT_USERS='[
  {"id":"admin","email":"admin@example.com","password":"admin123","authFile":"playwright/.auth/admin.json"},
  {"id":"user1","email":"user1@example.com","password":"pass1","authFile":"playwright/.auth/user1.json"},
  {"id":"user2","email":"user2@example.com","password":"pass2","authFile":"playwright/.auth/user2.json"}
]'
```

### Method 3: Backward Compatibility (Single User)

For backward compatibility, you can still use the old method:

```bash
export CHATGPT_EMAIL="user@example.com"
export CHATGPT_PASSWORD="password"
```

This will generate `playwright/.auth/user.json`

## Usage

### Authenticate All Users

```bash
# Authenticate all configured users
npx playwright test --project=setup
```

### Authenticate a Specific User

```bash
# Authenticate only user1
CHATGPT_USER_ID=user1 npx playwright test --project=setup

# Authenticate only admin
CHATGPT_USER_ID=admin npx playwright test --project=setup
```

### Using .env File (Recommended)

Create a `.env` file in your project root:

```env
# .env file
CHATGPT_USER1_EMAIL=user1@example.com
CHATGPT_USER1_PASSWORD=password1

CHATGPT_USER2_EMAIL=user2@example.com
CHATGPT_USER2_PASSWORD=password2

CHATGPT_USER3_EMAIL=user3@example.com
CHATGPT_USER3_PASSWORD=password3
```

Then load it using `dotenv` (uncomment in `playwright.config.ts`):

```typescript
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });
```

## Using Different Users in Tests

### Option 1: Update playwright.config.ts

Create separate projects for each user:

```typescript
projects: [
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: 'chromium-user1',
    use: { 
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/user1.json',
    },
    dependencies: ['setup'],
  },
  {
    name: 'chromium-user2',
    use: { 
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/user2.json',
    },
    dependencies: ['setup'],
  },
]
```

Then run tests with specific user:

```bash
npx playwright test --project=chromium-user1
npx playwright test --project=chromium-user2
```

### Option 2: Use Environment Variable in Tests

In your test file, you can dynamically select the auth file:

```typescript
import { test } from '@playwright/test';
import { getUserAccount } from './users.config';

test('my test', async ({ browser }) => {
  const userId = process.env.CHATGPT_USER_ID || 'user1';
  const user = getUserAccount(userId);
  
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  
  const context = await browser.newContext({
    storageState: user.authFile,
  });
  const page = await context.newPage();
  
  // Your test code here
});
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

