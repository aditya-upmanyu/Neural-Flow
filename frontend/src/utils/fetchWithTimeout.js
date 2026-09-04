/**
 * Fetch with automatic timeout protection using AbortController
 * Prevents indefinite UI hangs when backend is unresponsive
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @param {number} timeout - Timeout in milliseconds (default: 10000ms = 10s)
 * @returns {Promise<Response>} - Fetch response or timeout error
 */
export async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  // Create AbortController for timeout cancellation
  const controller = new AbortController();
  const { signal } = controller;
  
  // Set timeout to abort the request
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    // Make fetch request with abort signal
    const response = await fetch(url, {
      ...options,
      signal
    });
    
    // Clear timeout on success
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    
    // Check if error was due to timeout abort
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout: ${url} took longer than ${timeout}ms`);
    }
    
    // Re-throw other errors
    throw error;
  }
}

export default fetchWithTimeout;
