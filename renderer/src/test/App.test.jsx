import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
  })

  it('renders main navigation', () => {
    render(<App />)
    
    expect(screen.getByText('SERINA')).toBeInTheDocument()
    expect(screen.getByText('Emails')).toBeInTheDocument()
    expect(screen.getByText('Reminders')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows emails page by default', () => {
    render(<App />)
    
    // Should show emails content
    expect(screen.getByText('Emails')).toBeInTheDocument()
  })

  it('navigates to reminders page', () => {
    render(<App />)
    
    const remindersTab = screen.getByText('Reminders')
    fireEvent.click(remindersTab)
    
    // Should show reminders content
    expect(screen.getByText('Your Reminders')).toBeInTheDocument()
  })

  it('navigates to settings page', () => {
    render(<App />)
    
    const settingsTab = screen.getByText('Settings')
    fireEvent.click(settingsTab)
    
    // Should show settings content
    expect(screen.getByText('LLM Configuration')).toBeInTheDocument()
  })

  it('handles window controls', () => {
    render(<App />)
    
    const minimizeBtn = screen.getByLabelText('Minimize')
    const maximizeBtn = screen.getByLabelText('Maximize')
    const closeBtn = screen.getByLabelText('Close')
    
    fireEvent.click(minimizeBtn)
    expect(window.electronAPI.minimize).toHaveBeenCalled()
    
    fireEvent.click(maximizeBtn)
    expect(window.electronAPI.maximize).toHaveBeenCalled()
    
    fireEvent.click(closeBtn)
    expect(window.electronAPI.close).toHaveBeenCalled()
  })

  it('applies correct CSS classes', () => {
    render(<App />)
    
    const container = screen.getByRole('main')
    expect(container).toHaveClass('min-h-screen', 'bg-gray-50')
  })
})