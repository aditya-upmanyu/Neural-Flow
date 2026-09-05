import '@testing-library/jest-dom';

// Mock WebSocket if not available in test environment
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class WebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    
    constructor(url) {
      this.url = url;
      this.readyState = WebSocket.CONNECTING;
    }
    
    send() {}
    close() {}
  };
}
