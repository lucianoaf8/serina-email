import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EmailList from '../../components/EmailList'

const mockEmails = [
  {
    id: '1',
    subject: 'Test Email 1',
    sender: { name: 'John Doe', address: 'john@example.com' },
    bodyPreview: 'This is a test email preview',
    receivedDate: '2024-01-01T12:00:00Z',
    isRead: false,
    importance: 'normal',
    hasAttachments: false
  },
  {
    id: '2',
    subject: 'Test Email 2',
    sender: { name: 'Jane Smith', address: 'jane@example.com' },
    bodyPreview: 'Another test email preview',
    receivedDate: '2024-01-02T14:00:00Z',
    isRead: true,
    importance: 'high',
    hasAttachments: true
  }
]

describe('EmailList Component', () => {
  const mockOnEmailSelect = vi.fn()
  const mockOnRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email list correctly', () => {
    render(
      <EmailList 
        emails={mockEmails} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
      />
    )
    
    expect(screen.getByText('Test Email 1')).toBeInTheDocument()
    expect(screen.getByText('Test Email 2')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('shows empty state when no emails', () => {
    render(
      <EmailList 
        emails={[]} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
      />
    )
    
    expect(screen.getByText('No emails found')).toBeInTheDocument()
  })

  it('handles email selection', () => {
    render(
      <EmailList 
        emails={mockEmails} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
      />
    )
    
    const firstEmail = screen.getByText('Test Email 1')
    fireEvent.click(firstEmail)
    
    expect(mockOnEmailSelect).toHaveBeenCalledWith(mockEmails[0])
  })

  it('shows unread indicator for unread emails', () => {
    render(
      <EmailList 
        emails={mockEmails} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
      />
    )
    
    // First email is unread, should have indicator
    const unreadEmail = screen.getByText('Test Email 1').closest('.email-item')
    expect(unreadEmail).toHaveClass('font-bold')
    
    // Second email is read, should not have bold font
    const readEmail = screen.getByText('Test Email 2').closest('.email-item')
    expect(readEmail).not.toHaveClass('font-bold')
  })

  it('shows attachment indicator', () => {
    render(
      <EmailList 
        emails={mockEmails} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
      />
    )
    
    // Second email has attachments
    expect(screen.getByTestId('attachment-icon')).toBeInTheDocument()
  })

  it('shows importance indicator for high priority emails', () => {
    render(
      <EmailList 
        emails={mockEmails} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
      />
    )
    
    // Second email is high importance
    expect(screen.getByTestId('high-priority-icon')).toBeInTheDocument()
  })

  it('handles refresh action', () => {
    render(
      <EmailList 
        emails={mockEmails} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
      />
    )
    
    const refreshButton = screen.getByLabelText('Refresh emails')
    fireEvent.click(refreshButton)
    
    expect(mockOnRefresh).toHaveBeenCalled()
  })

  it('shows loading state', () => {
    render(
      <EmailList 
        emails={mockEmails} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
        loading={true}
      />
    )
    
    expect(screen.getByText('Loading emails...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    const errorMessage = 'Failed to load emails'
    render(
      <EmailList 
        emails={[]} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
        error={errorMessage}
      />
    )
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('formats dates correctly', () => {
    render(
      <EmailList 
        emails={mockEmails} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
      />
    )
    
    // Should show formatted dates
    expect(screen.getByText(/Jan 1/)).toBeInTheDocument()
    expect(screen.getByText(/Jan 2/)).toBeInTheDocument()
  })

  it('truncates long subject lines', () => {
    const emailWithLongSubject = {
      ...mockEmails[0],
      subject: 'This is a very long email subject that should be truncated when displayed in the email list to prevent layout issues'
    }
    
    render(
      <EmailList 
        emails={[emailWithLongSubject]} 
        onEmailSelect={mockOnEmailSelect}
        onRefresh={mockOnRefresh}
      />
    )
    
    const subjectElement = screen.getByText(/This is a very long email subject/)
    expect(subjectElement).toHaveClass('truncate')
  })
})