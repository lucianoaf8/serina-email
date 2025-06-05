// LLM WebSocket service for real-time communication with backend
class LLMService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.listeners = new Map(); // Store event listeners
    this.pendingRequests = new Map(); // Track pending requests by ID
    this.requestCounter = 0;
  }

  // Connect to WebSocket
  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket('ws://localhost:8000/ws/llm');
        
        this.socket.onopen = () => {
          console.log('LLM WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.emit('connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('LLM WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.emit('disconnected');
          
          // Attempt to reconnect if not a manual close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('LLM WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Schedule reconnection with exponential backoff
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  // Handle incoming messages
  handleMessage(data) {
    const { type, requestId, success, data: responseData, error } = data;

    if (type === 'response' && requestId) {
      // Handle response to a specific request
      const pendingRequest = this.pendingRequests.get(requestId);
      if (pendingRequest) {
        const { resolve, reject } = pendingRequest;
        this.pendingRequests.delete(requestId);

        if (success) {
          resolve(responseData);
        } else {
          reject(new Error(error || 'LLM request failed'));
        }
      }
    } else if (type === 'status') {
      // Handle status messages
      this.emit('status', responseData || data.message);
    } else if (type === 'error') {
      // Handle general errors
      this.emit('error', new Error(error || data.message));
    }
  }

  // Send a request and return a promise
  sendRequest(action, payload, model = null) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const requestId = `req_${++this.requestCounter}_${Date.now()}`;
      
      const message = {
        action,
        payload: {
          ...payload,
          ...(model && { model })
        },
        requestId
      };

      // Store the promise resolvers
      this.pendingRequests.set(requestId, { resolve, reject });

      // Set a timeout for the request
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000); // 30 second timeout

      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  // Generate email summary
  async summarizeEmail(emailContent, model = null) {
    if (!emailContent || !emailContent.trim()) {
      throw new Error('Email content is required for summarization');
    }

    return this.sendRequest('summarize', {
      text: emailContent
    }, model);
  }

  // Generate reply draft
  async generateReplyDraft(emailContext, instructions, model = null) {
    if (!emailContext || !instructions) {
      throw new Error('Email context and instructions are required for reply generation');
    }

    return this.sendRequest('draft_reply', {
      context: emailContext,
      instructions: instructions
    }, model);
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      readyState: this.socket?.readyState,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create a singleton instance
const llmService = new LLMService();

export default llmService;