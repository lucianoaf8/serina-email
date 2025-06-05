import '@testing-library/jest-dom'

// Mock electron API
window.electronAPI = {
  minimize: vi.fn(),
  maximize: vi.fn(),
  close: vi.fn(),
  onWindowControls: vi.fn(),
  removeAllListeners: vi.fn()
}

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) this.onopen()
    }, 0)
  }
  
  send(data) {
    // Mock send implementation
  }
  
  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) this.onclose()
  }
}

WebSocket.CONNECTING = 0
WebSocket.OPEN = 1
WebSocket.CLOSING = 2
WebSocket.CLOSED = 3

// Mock fetch for API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
)