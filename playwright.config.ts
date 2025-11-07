import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Get all auth JSON files from playwright/.auth/ directory
 */
function getAuthFiles(): string[] {
  const authDir = path.resolve(__dirname, 'playwright/.auth');
  const authFiles: string[] = [];
  
  try {
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const authFile = path.join('playwright/.auth', file);
          // Verify file exists and is readable
          if (fs.existsSync(path.resolve(__dirname, authFile))) {
            authFiles.push(authFile);
          }
        }
      });
    }
  } catch (error) {
    console.warn('Could not read auth directory:', error);
  }
  
  return authFiles.sort(); // Sort for consistent ordering
}

/**
 * Create a project configuration for each auth file
 */
function createAuthProjects() {
  const authFiles = getAuthFiles();
  const projects: any[] = [];
  
  authFiles.forEach(authFile => {
    // Extract project name from filename (e.g., 'admin.json' -> 'admin')
    const fileName = path.basename(authFile, '.json');
    const projectName = `chromium-${fileName}`;
    
    projects.push({
      name: projectName,
      use: {
        ...devices['Desktop Chrome'],
        // Use saved authentication state
        storageState: authFile,
        
        // Launch options for fingerprinting evasion
        launchOptions: {
          // Hide automation indicators
          args: [
            // Hide automation indicators
            '--disable-blink-features=AutomationControlled',
            '--disable-automation',
            '--disable-infobars',
            // Security and performance
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            // Site isolation (fingerprinting evasion)
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
            // Background throttling (fingerprinting evasion)
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            // Additional stealth options
            '--disable-extensions-except',
            '--disable-plugins-discovery',
            '--start-maximized',
          ],
          // Ignore default args that reveal automation
          ignoreDefaultArgs: [
            '--enable-automation',
            '--enable-blink-features=IdleDetection',
          ],
          // Additional launch options
          headless: false, // Set to true for headless mode
        },
        
        // Additional context options for fingerprinting evasion
        viewport: {
          width: 1920,
          height: 1080,
        },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
      },
      // No dependencies - runs directly using existing auth file
    });
  });
  
  return projects;
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Fingerprinting evasion settings */
    // Realistic user agent (Chrome on Windows)
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Viewport settings
    viewport: {
      width: 1920,
      height: 1080,
    },
    
    // Locale and language settings
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // Permissions
    permissions: ['geolocation'],
    
    // Geolocation (optional - set to a realistic location)
    geolocation: {
      longitude: -74.006,
      latitude: 40.7128,
    },
    
    // Color scheme
    colorScheme: 'light',
    
    // Additional context options for fingerprinting evasion
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    
    // Ignore HTTPS errors (optional)
    // ignoreHTTPSErrors: false,
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project to authenticate and save storage state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      // Allow parallel execution for setup tests (so you can enter OTP codes for multiple accounts simultaneously)
      fullyParallel: true,
      // Set number of workers (defaults to number of CPU cores, but you can limit it)
      // workers: 3, // Uncomment to limit parallel workers
    },
    // Dynamically create projects for each auth file
    ...createAuthProjects(),

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
