import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import ReminderForm from '../../components/ReminderForm'

describe('ReminderForm Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  
  const mockEmail = {
    id: 'email-1',
    subject: 'Test Email',
    sender: { name: 'John Doe', address: 'john@example.com' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form correctly', () => {
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByText('Create Reminder')).toBeInTheDocument()
    expect(screen.getByText('For: Test Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Reminder Text')).toBeInTheDocument()
    expect(screen.getByLabelText('Reminder Date & Time')).toBeInTheDocument()
  })

  it('handles text input', async () => {
    const user = userEvent.setup()
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const textInput = screen.getByLabelText('Reminder Text')
    await user.type(textInput, 'Follow up on this email')
    
    expect(textInput).toHaveValue('Follow up on this email')
  })

  it('handles datetime input', async () => {
    const user = userEvent.setup()
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const datetimeInput = screen.getByLabelText('Reminder Date & Time')
    await user.type(datetimeInput, '2024-12-31T10:00')
    
    expect(datetimeInput).toHaveValue('2024-12-31T10:00')
  })

  it('submits form with correct data', async () => {
    const user = userEvent.setup()
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const textInput = screen.getByLabelText('Reminder Text')
    const datetimeInput = screen.getByLabelText('Reminder Date & Time')
    const submitButton = screen.getByText('Create Reminder')
    
    await user.type(textInput, 'Test reminder')
    await user.type(datetimeInput, '2024-12-31T10:00')
    await user.click(submitButton)
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      emailId: 'email-1',
      reminderText: 'Test reminder',
      reminderTime: '2024-12-31T10:00'
    })
  })

  it('shows validation error for empty text', async () => {
    const user = userEvent.setup()
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const submitButton = screen.getByText('Create Reminder')
    await user.click(submitButton)
    
    expect(screen.getByText('Reminder text is required')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error for empty datetime', async () => {
    const user = userEvent.setup()
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const textInput = screen.getByLabelText('Reminder Text')
    const submitButton = screen.getByText('Create Reminder')
    
    await user.type(textInput, 'Test reminder')
    await user.click(submitButton)
    
    expect(screen.getByText('Reminder date and time is required')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error for past datetime', async () => {
    const user = userEvent.setup()
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const textInput = screen.getByLabelText('Reminder Text')
    const datetimeInput = screen.getByLabelText('Reminder Date & Time')
    const submitButton = screen.getByText('Create Reminder')
    
    await user.type(textInput, 'Test reminder')
    await user.type(datetimeInput, '2020-01-01T10:00')
    await user.click(submitButton)
    
    expect(screen.getByText('Reminder time must be in the future')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('handles cancel action', async () => {
    const user = userEvent.setup()
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const textInput = screen.getByLabelText('Reminder Text')
    const datetimeInput = screen.getByLabelText('Reminder Date & Time')
    const submitButton = screen.getByText('Create Reminder')
    
    await user.type(textInput, 'Test reminder')
    await user.type(datetimeInput, '2024-12-31T10:00')
    await user.click(submitButton)
    
    // Wait for form to reset
    await waitFor(() => {
      expect(textInput).toHaveValue('')
      expect(datetimeInput).toHaveValue('')
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Mock onSubmit to return a promise that doesn't resolve immediately
    const slowSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={slowSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const textInput = screen.getByLabelText('Reminder Text')
    const datetimeInput = screen.getByLabelText('Reminder Date & Time')
    const submitButton = screen.getByText('Create Reminder')
    
    await user.type(textInput, 'Test reminder')
    await user.type(datetimeInput, '2024-12-31T10:00')
    await user.click(submitButton)
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('prefills with existing reminder data when editing', () => {
    const existingReminder = {
      id: 'reminder-1',
      reminderText: 'Existing reminder',
      reminderTime: '2024-12-31T10:00:00'
    }
    
    render(
      <ReminderForm 
        email={mockEmail}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        existingReminder={existingReminder}
      />
    )
    
    expect(screen.getByText('Edit Reminder')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing reminder')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-12-31T10:00')).toBeInTheDocument()
  })
})