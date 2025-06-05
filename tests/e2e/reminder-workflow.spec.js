import { test, expect } from '@playwright/test'

test.describe('Reminder Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('text=Reminders')
  })

  test('create a new reminder', async ({ page }) => {
    // Click create reminder button
    await page.click('text=Create Reminder')
    
    // Fill out the reminder form
    await page.fill('[data-testid="reminder-text"]', 'Test reminder for E2E')
    
    // Set reminder date to tomorrow at 10 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const dateString = tomorrow.toISOString().slice(0, 16)
    
    await page.fill('[data-testid="reminder-datetime"]', dateString)
    
    // Submit the form
    await page.click('text=Create Reminder')
    
    // Should see success message
    await expect(page.locator('text=Reminder created successfully')).toBeVisible()
    
    // Should see the reminder in the list
    await expect(page.locator('text=Test reminder for E2E')).toBeVisible()
  })

  test('edit an existing reminder', async ({ page }) => {
    // First create a reminder to edit
    await page.click('text=Create Reminder')
    await page.fill('[data-testid="reminder-text"]', 'Original reminder text')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const dateString = tomorrow.toISOString().slice(0, 16)
    await page.fill('[data-testid="reminder-datetime"]', dateString)
    await page.click('text=Create Reminder')
    
    // Wait for reminder to appear
    await expect(page.locator('text=Original reminder text')).toBeVisible()
    
    // Click edit button for the reminder
    await page.click('[data-testid="edit-reminder"]')
    
    // Update the reminder text
    await page.fill('[data-testid="reminder-text"]', 'Updated reminder text')
    
    // Save changes
    await page.click('text=Save Changes')
    
    // Should see updated text
    await expect(page.locator('text=Updated reminder text')).toBeVisible()
    await expect(page.locator('text=Original reminder text')).not.toBeVisible()
  })

  test('delete a reminder', async ({ page }) => {
    // First create a reminder to delete
    await page.click('text=Create Reminder')
    await page.fill('[data-testid="reminder-text"]', 'Reminder to delete')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const dateString = tomorrow.toISOString().slice(0, 16)
    await page.fill('[data-testid="reminder-datetime"]', dateString)
    await page.click('text=Create Reminder')
    
    // Wait for reminder to appear
    await expect(page.locator('text=Reminder to delete')).toBeVisible()
    
    // Click delete button
    await page.click('[data-testid="delete-reminder"]')
    
    // Confirm deletion in modal
    await page.click('text=Confirm Delete')
    
    // Reminder should be removed from list
    await expect(page.locator('text=Reminder to delete')).not.toBeVisible()
  })

  test('mark reminder as completed', async ({ page }) => {
    // Create a reminder
    await page.click('text=Create Reminder')
    await page.fill('[data-testid="reminder-text"]', 'Reminder to complete')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const dateString = tomorrow.toISOString().slice(0, 16)
    await page.fill('[data-testid="reminder-datetime"]', dateString)
    await page.click('text=Create Reminder')
    
    // Wait for reminder to appear
    await expect(page.locator('text=Reminder to complete')).toBeVisible()
    
    // Mark as completed
    await page.click('[data-testid="complete-reminder"]')
    
    // Should show as completed (crossed out or different styling)
    await expect(page.locator('[data-testid="completed-reminder"]')).toBeVisible()
  })

  test('filter reminders by status', async ({ page }) => {
    // Create both completed and pending reminders
    await page.click('text=Create Reminder')
    await page.fill('[data-testid="reminder-text"]', 'Pending reminder')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const dateString = tomorrow.toISOString().slice(0, 16)
    await page.fill('[data-testid="reminder-datetime"]', dateString)
    await page.click('text=Create Reminder')
    
    // Wait and complete the reminder
    await expect(page.locator('text=Pending reminder')).toBeVisible()
    await page.click('[data-testid="complete-reminder"]')
    
    // Create another pending reminder
    await page.click('text=Create Reminder')
    await page.fill('[data-testid="reminder-text"]', 'Another pending reminder')
    await page.fill('[data-testid="reminder-datetime"]', dateString)
    await page.click('text=Create Reminder')
    
    // Test filter by completed
    await page.click('[data-testid="filter-completed"]')
    await expect(page.locator('text=Pending reminder')).toBeVisible()
    await expect(page.locator('text=Another pending reminder')).not.toBeVisible()
    
    // Test filter by pending
    await page.click('[data-testid="filter-pending"]')
    await expect(page.locator('text=Another pending reminder')).toBeVisible()
    await expect(page.locator('text=Pending reminder')).not.toBeVisible()
    
    // Test show all
    await page.click('[data-testid="filter-all"]')
    await expect(page.locator('text=Pending reminder')).toBeVisible()
    await expect(page.locator('text=Another pending reminder')).toBeVisible()
  })

  test('validate reminder form', async ({ page }) => {
    await page.click('text=Create Reminder')
    
    // Try to submit empty form
    await page.click('text=Create Reminder')
    
    // Should show validation errors
    await expect(page.locator('text=Reminder text is required')).toBeVisible()
    await expect(page.locator('text=Reminder date and time is required')).toBeVisible()
    
    // Fill text but leave date empty
    await page.fill('[data-testid="reminder-text"]', 'Test reminder')
    await page.click('text=Create Reminder')
    
    // Should still show date validation error
    await expect(page.locator('text=Reminder date and time is required')).toBeVisible()
    
    // Set date in the past
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const pastDateString = yesterday.toISOString().slice(0, 16)
    await page.fill('[data-testid="reminder-datetime"]', pastDateString)
    await page.click('text=Create Reminder')
    
    // Should show past date error
    await expect(page.locator('text=Reminder time must be in the future')).toBeVisible()
  })

  test('reminder notifications', async ({ page }) => {
    // Note: This test would require actual time passage or mocking
    // For demo purposes, we'll test the notification system setup
    
    // Create a reminder for very soon (1 minute from now)
    await page.click('text=Create Reminder')
    await page.fill('[data-testid="reminder-text"]', 'Notification test reminder')
    
    const soon = new Date()
    soon.setMinutes(soon.getMinutes() + 1)
    const soonDateString = soon.toISOString().slice(0, 16)
    await page.fill('[data-testid="reminder-datetime"]', soonDateString)
    await page.click('text=Create Reminder')
    
    // Check that notification permission is requested
    // In a real app, this would check browser notification APIs
    await expect(page.locator('text=Notification test reminder')).toBeVisible()
  })

  test('search and sort reminders', async ({ page }) => {
    // Create multiple reminders
    const reminders = [
      'Alpha reminder',
      'Beta reminder',
      'Gamma reminder'
    ]
    
    for (const reminderText of reminders) {
      await page.click('text=Create Reminder')
      await page.fill('[data-testid="reminder-text"]', reminderText)
      
      const future = new Date()
      future.setDate(future.getDate() + 1)
      future.setHours(10, 0, 0, 0)
      const dateString = future.toISOString().slice(0, 16)
      await page.fill('[data-testid="reminder-datetime"]', dateString)
      await page.click('text=Create Reminder')
      
      await expect(page.locator(`text=${reminderText}`)).toBeVisible()
    }
    
    // Test search functionality
    await page.fill('[data-testid="search-reminders"]', 'Alpha')
    await expect(page.locator('text=Alpha reminder')).toBeVisible()
    await expect(page.locator('text=Beta reminder')).not.toBeVisible()
    
    // Clear search
    await page.fill('[data-testid="search-reminders"]', '')
    
    // Test sorting by text (alphabetical)
    await page.click('[data-testid="sort-by-text"]')
    const reminderItems = page.locator('[data-testid="reminder-item"]')
    await expect(reminderItems.first()).toContainText('Alpha reminder')
  })
})