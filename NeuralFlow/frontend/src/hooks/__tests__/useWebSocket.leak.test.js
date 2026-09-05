/**
 * Bug Condition Exploration Test: WebSocket Cleanup Leak
 * 
 * This test is designed to FAIL on unfixed code to prove the bug exists.
 * 
 * Expected Failure Behavior (on unfixed code):
 * - WebSocket connections accumulate (50 connections remain open instead of 1)
 * - Reconnection timeouts continue firing after component unmount
 * - Memory leaks occur during normal SPA navigation
 * 
 * Bug Requirements Being Tested:
 * - 1.4: WebSocket connection remains open after component unmount
 * - 1.5: Reconnection timeouts continue firing after unmount
 * 
 * Expected Success Behavior (on fixed code):
 * - Only 1 WebSocket connection exists after 50 mount/unmount cycles
 * - No reconnection timeouts fire after component unmount
 */

import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import useWebSocket from '../useWebSocket';

// Mock WebSocket globally
class MockWebSocket {
  static instances = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    
    MockWebSocket.instances.push(this);
    
    // Simulate connection opening after a short delay
    setTimeout(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        this.readyState = MockWebSocket.OPEN;
        if (this.onopen) {
          this.onopen({ type: 'open' });
        }
      }
    }, 10);
  }

  send(data) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(code, reason) {
    if (this.readyState === MockWebSocket.OPEN || this.readyState === MockWebSocket.CONNECTING) {
      this.readyState = MockWebSocket.CLOSING;
      setTimeout(() => {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
          this.onclose({ type: 'close', code: code || 1000, reason: reason || '' });
        }
      }, 10);
    }
  }

  static reset() {
    MockWebSocket.instances = [];
  }

  static getOpenConnections() {
    return MockWebSocket.instances.filter(
      ws => ws.readyState === MockWebSocket.OPEN || ws.readyState === MockWebSocket.CONNECTING
    );
  }

  static getClosedConnections() {
    return MockWebSocket.instances.filter(
      ws => ws.readyState === MockWebSocket.CLOSED
    );
  }
}

// Store original WebSocket
const OriginalWebSocket = global.WebSocket;

describe('WebSocket Cleanup Bug Condition Exploration', () => {
  let mockTimeouts = [];
  let originalSetTimeout;

  beforeAll(() => {
    // Replace global WebSocket with mock
    global.WebSocket = MockWebSocket;
    
    // Track setTimeout calls to detect reconnection timeouts
    originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => {
      const timeoutId = originalSetTimeout(fn, delay);
      mockTimeouts.push({ id: timeoutId, fn, delay, cleared: false });
      return timeoutId;
    };
    
    const originalClearTimeout = global.clearTimeout;
    global.clearTimeout = (id) => {
      const timeout = mockTimeouts.find(t => t.id === id);
      if (timeout) {
        timeout.cleared = true;
      }
      return originalClearTimeout(id);
    };
  });

  afterAll(() => {
    // Restore original WebSocket
    global.WebSocket = OriginalWebSocket;
    global.setTimeout = originalSetTimeout;
  });

  beforeEach(() => {
    MockWebSocket.reset();
    mockTimeouts = [];
  });

  /**
   * CRITICAL BUG CONDITION TEST
   * 
   * This test simulates typical SPA navigation patterns:
   * - User visits Dashboard (mounts component with useWebSocket)
   * - User navigates to Settings (unmounts Dashboard, mounts Settings)
   * - Repeat 50 times
   * 
   * EXPECTED FAILURE ON UNFIXED CODE:
   * - Assertion 1 will FAIL: 50 WebSocket connections remain open instead of 1
   * - Assertion 2 will FAIL: Many reconnection timeouts continue firing after unmount
   * 
   * This proves the bug exists as described in requirements 1.4 and 1.5.
   */
  test('Bug Condition: WebSocket connections accumulate during mount/unmount cycles', async () => {
    console.log('🔍 Starting WebSocket leak exploration test...');
    console.log('📊 This test is EXPECTED TO FAIL on unfixed code');
    console.log('');

    const CYCLES = 50;
    const results = [];

    // Simulate mount/unmount cycles (typical SPA navigation)
    for (let i = 0; i < CYCLES; i++) {
      // Mount: Simulate Dashboard component mounting
      const { result, unmount } = renderHook(() => useWebSocket());

      // Wait for WebSocket to connect
      await act(async () => {
        await waitFor(() => {
          const openConnections = MockWebSocket.getOpenConnections();
          return openConnections.length > 0;
        }, { timeout: 100 });
      });

      // Capture state before unmount
      const beforeUnmount = {
        totalConnections: MockWebSocket.instances.length,
        openConnections: MockWebSocket.getOpenConnections().length,
        closedConnections: MockWebSocket.getClosedConnections().length,
        pendingTimeouts: mockTimeouts.filter(t => !t.cleared).length
      };

      // Unmount: Simulate navigation to Settings (component unmounts)
      unmount();

      // Wait for cleanup to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Capture state after unmount
      const afterUnmount = {
        totalConnections: MockWebSocket.instances.length,
        openConnections: MockWebSocket.getOpenConnections().length,
        closedConnections: MockWebSocket.getClosedConnections().length,
        pendingTimeouts: mockTimeouts.filter(t => !t.cleared).length
      };

      results.push({
        cycle: i + 1,
        beforeUnmount,
        afterUnmount
      });

      // Log progress every 10 cycles
      if ((i + 1) % 10 === 0) {
        console.log(`✓ Completed ${i + 1}/${CYCLES} cycles`);
        console.log(`  Open connections: ${afterUnmount.openConnections}`);
        console.log(`  Pending timeouts: ${afterUnmount.pendingTimeouts}`);
      }
    }

    // Print final statistics
    console.log('');
    console.log('📈 Final Statistics:');
    console.log(`  Total cycles: ${CYCLES}`);
    console.log(`  Total WebSocket instances created: ${MockWebSocket.instances.length}`);
    console.log(`  Open connections remaining: ${MockWebSocket.getOpenConnections().length}`);
    console.log(`  Closed connections: ${MockWebSocket.getClosedConnections().length}`);
    console.log(`  Pending timeouts not cleared: ${mockTimeouts.filter(t => !t.cleared).length}`);
    console.log('');

    // Wait for any pending reconnection attempts
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const finalOpenConnections = MockWebSocket.getOpenConnections().length;
    const finalPendingTimeouts = mockTimeouts.filter(t => !t.cleared).length;

    console.log('🎯 Assertions:');
    console.log(`  Expected: 1 WebSocket connection (only current one)`);
    console.log(`  Actual: ${finalOpenConnections} connections`);
    console.log(`  Expected: 0 pending reconnection timeouts`);
    console.log(`  Actual: ${finalPendingTimeouts} timeouts`);
    console.log('');

    /**
     * ASSERTION 1: Only 1 WebSocket connection should exist
     * 
     * EXPECTED FAILURE ON UNFIXED CODE:
     * - Unfixed code does NOT close WebSocket connections on unmount
     * - Result: finalOpenConnections will be ~50 instead of 1
     * 
     * This failure proves bug 1.4:
     * "WHEN a React component using useWebSocket unmounts THEN the WebSocket 
     * connection remains open causing memory leaks"
     */
    expect(finalOpenConnections).toBe(1);

    /**
     * ASSERTION 2: No reconnection timeouts should be pending after unmount
     * 
     * EXPECTED FAILURE ON UNFIXED CODE:
     * - Unfixed code does NOT clear reconnection timeouts on unmount
     * - Result: finalPendingTimeouts will be >> 0 (many unclosed timeouts)
     * 
     * This failure proves bug 1.5:
     * "WHEN a React component using useWebSocket unmounts THEN reconnection 
     * timeouts continue firing causing unnecessary network activity"
     */
    expect(finalPendingTimeouts).toBe(0);

    // Additional diagnostic assertion: verify proper cleanup ratio
    const closedConnections = MockWebSocket.getClosedConnections().length;
    const totalConnections = MockWebSocket.instances.length;
    
    console.log('🔬 Cleanup Diagnostic:');
    console.log(`  Cleanup ratio: ${closedConnections}/${totalConnections} connections closed`);
    console.log(`  Expected ratio: ${totalConnections - 1}/${totalConnections} (all but current)`);
    console.log('');

    /**
     * ASSERTION 3: All previous connections should be closed
     * 
     * EXPECTED FAILURE ON UNFIXED CODE:
     * - Very few or no connections will be closed
     * - Result: closedConnections will be 0 or very low instead of CYCLES
     */
    expect(closedConnections).toBeGreaterThanOrEqual(CYCLES - 1);

    console.log('❌ EXPECTED FAILURE: This test should FAIL on unfixed code');
    console.log('✅ If this test PASSES, the WebSocket cleanup bug is FIXED');
  });

  /**
   * SUPPLEMENTARY TEST: Verify reconnection attempts after unmount
   * 
   * This test specifically checks that reconnection logic does not fire
   * after the component has been unmounted.
   */
  test('Bug Condition: Reconnection timeouts fire after component unmount', async () => {
    console.log('🔍 Testing reconnection timeout behavior after unmount...');

    // Mount component
    const { unmount } = renderHook(() => useWebSocket());

    // Wait for initial connection
    await act(async () => {
      await waitFor(() => MockWebSocket.getOpenConnections().length > 0, { timeout: 100 });
    });

    const initialConnectionCount = MockWebSocket.instances.length;

    // Simulate connection drop (triggers reconnection logic)
    const currentWs = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    act(() => {
      currentWs.close(1006, 'Connection lost');
    });

    // Wait for close event to be processed
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Unmount component immediately after connection drop
    unmount();

    // Wait for what would be the reconnection delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    const finalConnectionCount = MockWebSocket.instances.length;
    const reconnectionAttempts = finalConnectionCount - initialConnectionCount;

    console.log(`📊 Reconnection attempts after unmount: ${reconnectionAttempts}`);
    console.log(`   Initial connections: ${initialConnectionCount}`);
    console.log(`   Final connections: ${finalConnectionCount}`);
    console.log('');

    /**
     * EXPECTED FAILURE ON UNFIXED CODE:
     * - Reconnection logic continues after unmount
     * - Result: reconnectionAttempts will be > 0 (new connections created)
     * 
     * This proves the bug: reconnection timeouts are not cleared on unmount
     */
    expect(reconnectionAttempts).toBe(0);

    console.log('❌ EXPECTED FAILURE: Reconnection should be prevented after unmount');
    console.log('✅ If this test PASSES, reconnection cleanup is working correctly');
  });
});
