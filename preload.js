// Electron preload script
const { contextBridge, ipcRenderer } = require('electron');

// List of valid channels to send messages on
const validSendChannels = [
  'minimize-window',
  'maximize-window',
  'close-window',
  // Add other channels as needed, e.g., 'get-config', 'save-config', 'llm-request'
];

// List of valid channels to receive messages on
const validReceiveChannels = [
  // Add channels from main to renderer, e.g., 'config-updated', 'llm-response'
];

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`Attempted to send on invalid channel: ${channel}`);
    }
  },
  on: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      const listener = (event, ...args) => func(...args);
      ipcRenderer.on(channel, listener);
      // Return a cleanup function
      return () => ipcRenderer.removeListener(channel, listener);
    } else {
      console.warn(`Attempted to listen on invalid channel: ${channel}`);
      return () => {}; // Return a no-op cleanup
    }
  },
  // Example of invoke/handle for request-response patterns
  // invoke: (channel, ...args) => {
  //   if (validSendChannels.includes(channel)) { // Assuming invoke uses send channels for requests
  //     return ipcRenderer.invoke(channel, ...args);
  //   }
  //  console.warn(`Attempted to invoke on invalid channel: ${channel}`);
  //  return Promise.reject(new Error(`Invalid invoke channel: ${channel}`));
  // }
});

console.log('Preload script for SERINA loaded.');
