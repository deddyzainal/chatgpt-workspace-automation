/**
 * User accounts configuration
 * 
 * Define your user accounts here or use environment variables
 * For security, prefer using environment variables in production
 */

// Load environment variables from .env file if dotenv is available
try {
  const dotenv = require('dotenv');
  const path = require('path');
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
} catch (e) {
  // dotenv not available, skip
}

export interface UserAccount {
  id: string;           // Unique identifier (e.g., 'user1', 'admin', 'test')
  email: string;       // User email
  password: string;    // User password
  authFile: string;    // Path to save auth state (e.g., 'playwright/.auth/user1.json')
}

/**
 * Get user accounts from environment variables or return default config
 * 
 * Environment variable format:
 * - CHATGPT_USERS: JSON string with array of users
 *   Example: CHATGPT_USERS='[{"id":"user1","email":"user1@example.com","password":"pass1"},{"id":"user2","email":"user2@example.com","password":"pass2"}]'
 * 
 * OR use individual environment variables:
 * - CHATGPT_USER1_EMAIL, CHATGPT_USER1_PASSWORD
 * - CHATGPT_USER2_EMAIL, CHATGPT_USER2_PASSWORD
 * - etc.
 */
export function getUserAccounts(): UserAccount[] {
  // Method 1: Get from CHATGPT_USERS JSON environment variable
  if (process.env.CHATGPT_USERS) {
    try {
      // Remove surrounding quotes if present (common when exporting from shell)
      let usersJson = process.env.CHATGPT_USERS.trim();
      if ((usersJson.startsWith('"') && usersJson.endsWith('"')) || 
          (usersJson.startsWith("'") && usersJson.endsWith("'"))) {
        usersJson = usersJson.slice(1, -1);
      }
      
      const users = JSON.parse(usersJson);
      if (!Array.isArray(users)) {
        console.error('CHATGPT_USERS must be a JSON array');
        return [];
      }
      
      return users.map((user: any, index: number) => ({
        id: user.id || `user${index + 1}`,
        email: user.email,
        password: user.password,
        authFile: user.authFile || `playwright/.auth/${user.id || `user${index + 1}`}.json`,
      }));
    } catch (error) {
      console.error('Error parsing CHATGPT_USERS:', error);
      console.error('CHATGPT_USERS value:', process.env.CHATGPT_USERS);
    }
  }

  // Method 2: Get from individual environment variables (CHATGPT_USER1_EMAIL, CHATGPT_USER1_PASSWORD, etc.)
  const users: UserAccount[] = [];
  let userIndex = 1;
  
  while (true) {
    const emailKey = `CHATGPT_USER${userIndex}_EMAIL`;
    const passwordKey = `CHATGPT_USER${userIndex}_PASSWORD`;
    const email = process.env[emailKey];
    const password = process.env[passwordKey];
    
    if (!email || !password) {
      break; // No more users found
    }
    
    users.push({
      id: `user${userIndex}`,
      email,
      password,
      authFile: `playwright/.auth/user${userIndex}.json`,
    });
    
    userIndex++;
  }

  // Method 3: Fallback to single user (backward compatibility)
  if (users.length === 0) {
    const email = process.env.CHATGPT_EMAIL;
    const password = process.env.CHATGPT_PASSWORD;
    
    if (email && password) {
      users.push({
        id: 'user',
        email,
        password,
        authFile: 'playwright/.auth/user.json',
      });
    }
  }

  return users;
}

/**
 * Get a specific user account by ID
 */
export function getUserAccount(userId: string): UserAccount | undefined {
  const users = getUserAccounts();
  return users.find(user => user.id === userId);
}

/**
 * Get the default user account (first one)
 */
export function getDefaultUserAccount(): UserAccount | undefined {
  const users = getUserAccounts();
  return users[0];
}

