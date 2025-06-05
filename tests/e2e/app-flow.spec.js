import { test, expect } from '@playwright/test'

test.describe('SERINA App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads the application correctly', async ({ page }) => {
    // Check if main elements are present
    await expect(page.locator('text=SERINA')).toBeVisible()
    await expect(page.locator('text=Emails')).toBeVisible()
    await expect(page.locator('text=Reminders')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('navigates between pages', async ({ page }) => {
    // Start on emails page
    await expect(page.locator('text=Emails')).toBeVisible()
    
    // Navigate to reminders
    await page.click('text=Reminders')
    await expect(page.locator('text=Your Reminders')).toBeVisible()
    
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page.locator('text=LLM Configuration')).toBeVisible()
    
    // Navigate back to emails
    await page.click('text=Emails')
    await expect(page.locator('text=Emails')).toBeVisible()
  })

  test('settings page functionality', async ({ page }) => {
    await page.click('text=Settings')
    
    // Check LLM configuration section
    await expect(page.locator('text=LLM Provider')).toBeVisible()
    await expect(page.locator('select[name="provider"]')).toBeVisible()
    
    // Check email configuration section
    await expect(page.locator('text=Email Configuration')).toBeVisible()
    
    // Try to save settings
    const saveButton = page.locator('text=Save Configuration')
    await expect(saveButton).toBeVisible()
    
    // Test form validation
    await saveButton.click()
    // Should show validation messages for required fields
  })

  test('reminders page functionality', async ({ page }) => {
    await page.click('text=Reminders')
    
    // Check if reminders list is visible
    await expect(page.locator('[data-testid="reminders-list"]')).toBeVisible()
    
    // Check for create reminder button
    await expect(page.locator('text=Create Reminder')).toBeVisible()
  })

  test('email list functionality', async ({ page }) => {
    // Should start on emails page
    await expect(page.locator('[data-testid="email-list"]')).toBeVisible()
    
    // Check for refresh button
    await expect(page.locator('[data-testid="refresh-emails"]')).toBeVisible()
    
    // Click refresh
    await page.click('[data-testid="refresh-emails"]')
    
    // Should show loading or updated state
    await page.waitForTimeout(1000)
  })

  test('responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('text=SERINA')).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('text=SERINA')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('text=SERINA')).toBeVisible()
  })

  test('handles errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => {
      route.abort('failed')
    })
    
    await page.click('text=Reminders')
    
    // Should show error message
    await expect(page.locator('text=Failed to load reminders')).toBeVisible({ timeout: 10000 })
  })

  test('accessibility checks', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for proper button labels
    const buttons = page.locator('button')
    const count = await buttons.count()
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const isVisible = await button.isVisible()
      
      if (isVisible) {
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        
        // Button should have either text content or aria-label
        expect(text || ariaLabel).toBeTruthy()
      }
    }
  })
})