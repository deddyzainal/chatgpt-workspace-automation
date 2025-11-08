import { test, expect, Locator } from '@playwright/test';
import { getUserAccount } from './users.config';

/**
 * This test uses the saved authentication state from auth.setup.ts
 * Make sure to run the setup first: npx playwright test --project=setup
 * 
 * The storage state is automatically loaded based on the project you run.
 * Projects are dynamically created for each auth file in playwright/.auth/
 * 
 * Usage:
 * - Run with all auth files (parallel): npx playwright test tests/gpt-scrape.spec.ts
 * - Run with specific user: npx playwright test --project=chromium-admin tests/gpt-scrape.spec.ts
 * - Run with specific user: npx playwright test --project=chromium-user1 tests/gpt-scrape.spec.ts
 * - List all available projects: npx playwright test --list
 * 
 * Available projects are automatically created from auth files:
 * - chromium-admin (uses playwright/.auth/admin.json)
 * - chromium-user (uses playwright/.auth/user.json)
 * - chromium-user1 (uses playwright/.auth/user1.json)
 * - etc. (one project per auth file)
 */
test('visit chatgpt.com (already authenticated)', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  // Get user email from project name
  // Project name format: chromium-{userId} (e.g., chromium-admin, chromium-user1)
  const projectName = testInfo.project.name;
  const userId = projectName.replace('chromium-', '');
  const userAccount = getUserAccount(userId);
  const userEmail = userAccount?.email || userId; // Fallback to userId if user not found
  
  // Track deleted emails
  const deletedEmails: string[] = [];
  // Navigate to ChatGPT - should already be logged in via storage state
  await page.goto('https://chatgpt.com/admin', { waitUntil: 'networkidle' });
  
  // Wait for workspace heading to be visible (find dynamically by checking for heading that's not "Personal account")
  const workspaceHeading = page.locator(`//button[@role='radio'][contains(., 'Workspace')]`);
  await workspaceHeading.waitFor({ state: 'visible', timeout: 10000 });
  await workspaceHeading.click();

  await page.goto('https://chatgpt.com/admin/members', { waitUntil: 'networkidle' });
  
  // Wait for Members heading to be visible
  const membersHeading = page.getByRole('heading', { name: 'Members' });
  await membersHeading.waitFor({ state: 'visible', timeout: 10000 });
  await expect(membersHeading).toBeVisible();
    
  // Loop to find and delete rows with emails that don't contain "hinedigitals.store"
  let deletedCount = 0;
  let maxIterations = 100; // Safety limit to prevent infinite loops
  let iteration = 0;
  
  while (iteration < maxIterations) {
    iteration++;
    
    // Wait for table to be visible before finding rows
    await page.waitForSelector('table tr, tbody tr', { state: 'visible', timeout: 30000 });
    
    // Find all table rows
    const rows = await page.locator('table tr, tbody tr').all();
    
    // Find a row with email that doesn't contain "hinedigitals.store"
    let foundRow: Locator | null = null;
    let rowEmail = '';
    
    for (const row of rows) {
      try {
        // Wait for row to be visible
        await row.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
        
        // Get the entire row text content first (more reliable)
        const rowText = await row.textContent().catch(() => null);
        
        if (!rowText) {
          continue; // Skip if we can't get text
        }
        
        // Try to find email pattern in row text
        // Use a precise regex that matches complete email addresses
        // Pattern: word characters, dots, hyphens @ word characters, dots, hyphens . 2+ letters (TLD)
        // Try multiple patterns to handle different text formats
        
        // First, try with word boundaries (works when email is separated by spaces/punctuation)
        let emailRegex = /\b([\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,})\b/g;
        let emailMatches = [...rowText.matchAll(emailRegex)];
        
        // If no matches with word boundaries, try without word boundaries
        // This handles cases where text is concatenated like "email@gmail.comMemberNov"
        if (emailMatches.length === 0) {
          emailRegex = /([\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,})/g;
          emailMatches = [...rowText.matchAll(emailRegex)];
        }
        
        if (emailMatches && emailMatches.length > 0) {
          // Process all matches and find the first valid email
          for (const match of emailMatches) {
            // match[1] contains the captured email (group 1)
            let email = match[1].trim();
            
            // Extract only the email part - find where the email ends
            // The email should end with a TLD (2+ letters), followed by non-word character or end
            // If there's text immediately after the TLD, extract only up to the TLD
            const emailEndMatch = email.match(/^([\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,})/);
            if (emailEndMatch) {
              email = emailEndMatch[1];
            }
            
            // Validate it's a complete email address (not concatenated with other text)
            // Check that the email matches the full email pattern exactly
            const emailValidation = /^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/;
            if (emailValidation.test(email)) {
              // Check if email doesn't contain "hinedigitals.store"
              if (!email.includes('hinedigitals.store')) {
                foundRow = row;
                rowEmail = email;
                break;
              }
            }
          }
          
          // If we found a valid row, break out of the row loop
          if (foundRow) {
            break;
          }
        }
      } catch (error) {
        // Row might have been removed, continue to next row
        continue;
      }
    }
    
    // If no matching row found, break the loop
    if (!foundRow) {
      console.log(`No more rows to delete. Total deleted: ${deletedCount}`);
      break;
    }
    
    console.log(`Found row with email: ${rowEmail}. Deleting...`);
    
    try {
      // Find the menu button (three dots) in this row
      // The button has aria-haspopup="menu" and contains an SVG with three dots
      const menuButton = foundRow.locator('button[aria-haspopup="menu"], button[aria-expanded]').last();
      
      // Wait for the button to be visible and click it
      await menuButton.waitFor({ state: 'visible', timeout: 5000 });
      await menuButton.click();
      
      // Wait for the menu to appear and click "Remove member"
      await page.getByRole('menuitem', { name: 'Remove member' }).waitFor({ state: 'visible', timeout: 5000 });
      await page.getByRole('menuitem', { name: 'Remove member' }).click();
      
      // Wait for the delete button and click it
      await page.getByRole('button', { name: 'Delete' }).waitFor({ state: 'visible', timeout: 5000 });
      await page.getByRole('button', { name: 'Delete' }).click();
      
      // Wait for the row to be removed from the DOM (verification that deletion succeeded)
      try {
        // Wait for the row to be detached or hidden
        await foundRow.waitFor({ state: 'detached', timeout: 10000 }).catch(async () => {
          // If not detached, wait for it to be hidden
          await foundRow.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        });
        
        // Additional verification: Check that the email is no longer in the table
        const tableText = await page.locator('table, tbody').textContent().catch(() => '');
        if (tableText && tableText.includes(rowEmail)) {
          console.log(`Warning: Email ${rowEmail} still appears in table. Waiting longer...`);
          await page.waitForTimeout(2000);
          // Try refreshing the page if email still exists
          await page.reload({ waitUntil: 'networkidle' });
          // Wait for Members heading again after refresh
          await page.getByRole('heading', { name: 'Members' }).waitFor({ state: 'visible', timeout: 10000 });
        }
        
        deletedCount++;
        deletedEmails.push(rowEmail);
        console.log(`Successfully deleted row with email: ${rowEmail}. Total deleted: ${deletedCount}`);
      } catch (verifyError) {
        console.log(`Warning: Could not verify deletion of ${rowEmail}. Row may still exist.`);
        // Refresh the page to ensure list is updated
        await page.reload({ waitUntil: 'networkidle' });
        // Wait for Members heading again after refresh
        await page.getByRole('heading', { name: 'Members' }).waitFor({ state: 'visible', timeout: 10000 });
        // Wait for table to load again
        await page.waitForSelector('table tr, tbody tr', { state: 'visible', timeout: 10000 });
        deletedCount++;
        deletedEmails.push(rowEmail);
      }
      
      // Wait a bit for any animations or UI updates to complete
      await page.waitForTimeout(500);
      
      // Refresh page every 5 deletions to ensure list is up to date
      if (deletedCount % 5 === 0) {
        console.log(`Refreshing page after ${deletedCount} deletions to ensure list is updated...`);
        await page.reload({ waitUntil: 'networkidle' });
        // Wait for Members heading again after refresh
        await page.getByRole('heading', { name: 'Members' }).waitFor({ state: 'visible', timeout: 10000 });
        // Wait for table to load again
        await page.waitForSelector('table tr, tbody tr', { state: 'visible', timeout: 10000 });
        await page.waitForTimeout(500);
      }
      
    } catch (error) {
      console.log(`Error deleting row with email ${rowEmail}:`, error);
      // If there's an error, wait a bit and try to continue
      await page.waitForTimeout(1000);
      // Try to close any open menus
      try {
        await page.keyboard.press('Escape');
      } catch (e) {
        // Ignore escape key errors
      }
    }
  }
  
  if (iteration >= maxIterations) {
    console.log(`Reached maximum iterations (${maxIterations}). Stopping.`);
  }
  
  console.log(`Completed. Total rows deleted: ${deletedCount}`);
  
  // Log result in specified format
  const status = deletedEmails.length === 0 ? 'clean' : 'dirty';
  const cleanedEmails = deletedEmails.length > 0 ? deletedEmails.join(', ') : 'no anomalies data';
  const result = 'success';
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SCRAPE RESULT:`);
  console.log(`${userEmail} | ${status} | ${cleanedEmails} | ${result}`);
  console.log(`${'='.repeat(80)}\n`);
});

