import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { connectToLLM, sendMessage, disconnectFromLLM } from '../../services/llmService'

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN
}

// Mock WebSocket constructor
global.WebSocket = vi.fn(() => mockWebSocket)

describe('LLM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    WebSocket.CONNECTING = 0
    WebSocket.OPEN = 1
    WebSocket.CLOSING = 2
    WebSocket.CLOSED = 3
  })

  afterEach(() => {
    // Clean up any connections
    disconnectFromLLM()
  })

  describe('connectToLLM', () => {
    it('creates WebSocket connection', () => {
      connectToLLM()
      
      expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws/llm')
    })

    it('sets up event listeners', () => {
      connectToLLM()
      
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it('handles connection open event', () => {
      const onOpen = vi.fn()
      connectToLLM({ onOpen })
      
      // Simulate open event
      const openHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1]
      
      openHandler()
      expect(onOpen).toHaveBeenCalled()
    })

    it('handles message event', () => {
      const onMessage = vi.fn()
      connectToLLM({ onMessage })
      
      // Simulate message event
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      const mockEvent = {
        data: JSON.stringify({
          type: 'email_summary',
          data: { summary: 'Test summary' }
        })
      }
      
      messageHandler(mockEvent)
      expect(onMessage).toHaveBeenCalledWith({
        type: 'email_summary',
        data: { summary: 'Test summary' }
      })
    })

    it('handles error event', () => {
      const onError = vi.fn()
      connectToLLM({ onError })
      
      // Simulate error event
      const errorHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1]
      
      const mockError = new Error('Connection failed')
      errorHandler(mockError)
      expect(onError).toHaveBeenCalledWith(mockError)
    })

    it('handles close event', () => {
      const onClose = vi.fn()
      connectToLLM({ onClose })
      
      // Simulate close event
      const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )[1]
      
      closeHandler()
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('sendMessage', () => {
    beforeEach(() => {
      connectToLLM()
    })

    it('sends message when connected', () => {
      mockWebSocket.readyState = WebSocket.OPEN
      
      const message = {
        type: 'email_summary',
        data: { email: { subject: 'Test' } }
      }
      
      sendMessage(message)
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('throws error when not connected', () => {
      mockWebSocket.readyState = WebSocket.CLOSED
      
      const message = { type: 'test', data: {} }
      
      expect(() => sendMessage(message)).toThrow('Not connected to LLM service')
    })

    it('throws error when no connection exists', () => {
      disconnectFromLLM()
      
      const message = { type: 'test', data: {} }
      
      expect(() => sendMessage(message)).toThrow('Not connected to LLM service')
    })
  })

  describe('disconnectFromLLM', () => {
    it('closes WebSocket connection', () => {
      connectToLLM()
      disconnectFromLLM()
      
      expect(mockWebSocket.close).toHaveBeenCalled()
    })

    it('removes event listeners', () => {
      connectToLLM()
      disconnectFromLLM()
      
      expect(mockWebSocket.removeEventListener).toHaveBeenCalledWith('open', expect.any(Function))
      expect(mockWebSocket.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockWebSocket.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockWebSocket.removeEventListener).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it('handles disconnection when not connected', () => {
      expect(() => disconnectFromLLM()).not.toThrow()
    })
  })

  describe('message formatting', () => {
    it('handles malformed JSON in messages', () => {
      const onMessage = vi.fn()
      const onError = vi.fn()
      connectToLLM({ onMessage, onError })
      
      // Simulate message with invalid JSON
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      const mockEvent = { data: 'invalid json' }
      
      messageHandler(mockEvent)
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onMessage).not.toHaveBeenCalled()
    })

    it('handles empty message data', () => {
      const onMessage = vi.fn()
      connectToLLM({ onMessage })
      
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      const mockEvent = { data: '{}' }
      
      messageHandler(mockEvent)
      expect(onMessage).toHaveBeenCalledWith({})
    })
  })

  describe('connection states', () => {
    it('handles connecting state', () => {
      mockWebSocket.readyState = WebSocket.CONNECTING
      connectToLLM()
      
      const message = { type: 'test', data: {} }
      
      expect(() => sendMessage(message)).toThrow('Not connected to LLM service')
    })

    it('handles closing state', () => {
      mockWebSocket.readyState = WebSocket.CLOSING
      connectToLLM()
      
      const message = { type: 'test', data: {} }
      
      expect(() => sendMessage(message)).toThrow('Not connected to LLM service')
    })
  })
})