/**
 * Test utility to verify error suppression is working
 * This file can be imported in development to test error handling
 */

export function testErrorSuppression() {
  if (typeof window === 'undefined') return;

  console.log('🧪 Testing Error Suppression...');

  // Test 1: Simulate browser extension message channel error
  setTimeout(() => {
    try {
      const error = new Error('A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received');
      console.error(error.message);
    } catch (e) {
      // This should be suppressed
    }
  }, 100);

  // Test 2: Simulate chrome extension error
  setTimeout(() => {
    try {
      console.error('chrome-extension://abc123/content.js: Connection error');
    } catch (e) {
      // This should be suppressed
    }
  }, 200);

  // Test 3: Normal error (should NOT be suppressed)
  setTimeout(() => {
    console.log('✅ Normal log message (should appear)');
    console.warn('⚠️ Normal warning (should appear)');
  }, 300);

  // Test 4: Check suppression stats
  setTimeout(() => {
    if ((window as any).errorSuppressor) {
      const stats = (window as any).errorSuppressor.getStats();
      console.log('📊 Error Suppression Stats:', stats);
    }
  }, 500);

  console.log('🧪 Error suppression test completed. Check console for results.');
}

// Auto-run in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Add to window for manual testing
  (window as any).testErrorSuppression = testErrorSuppression;
  console.log('🔧 testErrorSuppression() available globally for testing');
}
