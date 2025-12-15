/**
 * Error Suppression Utility
 * Handles and suppresses known browser extension and environment errors
 */

interface ErrorPattern {
  message: RegExp | string;
  source?: RegExp | string;
  description: string;
  suppress: boolean;
}

// Known error patterns to suppress
const SUPPRESSED_ERROR_PATTERNS: ErrorPattern[] = [
  {
    message: /listener indicated an asynchronous response by returning true.*message channel closed/i,
    description: 'Browser extension message channel error',
    suppress: true
  },
  {
    message: /extension context invalidated/i,
    description: 'Browser extension context invalidated',
    suppress: true
  },
  {
    message: /could not establish connection.*receiving end does not exist/i,
    description: 'Browser extension connection error',
    suppress: true
  },
  {
    message: /chrome-extension:/,
    description: 'Chrome extension related error',
    suppress: true
  },
  {
    message: /moz-extension:/,
    description: 'Firefox extension related error',
    suppress: true
  },
  {
    message: /safari-extension:/,
    description: 'Safari extension related error',
    suppress: true
  },
  {
    message: /non-error promise rejection captured/i,
    source: /extension/i,
    description: 'Extension promise rejection',
    suppress: true
  }
];

class ErrorSuppressor {
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private suppressedCount = 0;
  private enabled = true;

  constructor() {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
  }

  /**
   * Initialize error suppression
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Suppress window errors
    window.addEventListener('error', this.handleWindowError.bind(this), true);
    
    // Suppress unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this), true);

    // Override console methods to filter extension errors
    this.overrideConsole();

    console.log('[ErrorSuppressor] ✅ Initialized - browser extension errors will be suppressed');
  }

  /**
   * Handle window errors
   */
  private handleWindowError(event: ErrorEvent): void {
    if (!this.enabled) return;

    const shouldSuppress = this.shouldSuppressError(
      event.message,
      event.filename || '',
      event.error
    );

    if (shouldSuppress.suppress) {
      this.suppressedCount++;
      event.preventDefault();
      event.stopPropagation();
      
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[ErrorSuppressor] Suppressed: ${shouldSuppress.description}`, {
          message: event.message,
          filename: event.filename,
          count: this.suppressedCount
        });
      }
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    if (!this.enabled) return;

    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : 
                   reason?.message || 
                   reason?.toString() || 
                   'Unknown promise rejection';

    const shouldSuppress = this.shouldSuppressError(message, '', reason);

    if (shouldSuppress.suppress) {
      this.suppressedCount++;
      event.preventDefault();
      
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[ErrorSuppressor] Suppressed promise rejection: ${shouldSuppress.description}`, {
          reason,
          count: this.suppressedCount
        });
      }
    }
  }

  /**
   * Override console methods to filter extension errors
   */
  private overrideConsole(): void {
    console.error = (...args: any[]) => {
      if (this.shouldSuppressConsoleMessage(args)) {
        this.suppressedCount++;
        if (process.env.NODE_ENV === 'development') {
          console.debug('[ErrorSuppressor] Suppressed console.error:', args[0]);
        }
        return;
      }
      this.originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (this.shouldSuppressConsoleMessage(args)) {
        this.suppressedCount++;
        if (process.env.NODE_ENV === 'development') {
          console.debug('[ErrorSuppressor] Suppressed console.warn:', args[0]);
        }
        return;
      }
      this.originalConsoleWarn.apply(console, args);
    };
  }

  /**
   * Check if console message should be suppressed
   */
  private shouldSuppressConsoleMessage(args: any[]): boolean {
    if (!this.enabled || !args.length) return false;

    const message = args[0];
    if (typeof message !== 'string') return false;

    return this.shouldSuppressError(message, '', null).suppress;
  }

  /**
   * Determine if an error should be suppressed
   */
  private shouldSuppressError(message: string, source: string, error: any): { suppress: boolean; description: string } {
    for (const pattern of SUPPRESSED_ERROR_PATTERNS) {
      // Check message pattern
      const messageMatch = typeof pattern.message === 'string' 
        ? message.includes(pattern.message)
        : pattern.message.test(message);

      // Check source pattern if specified
      const sourceMatch = !pattern.source || (
        typeof pattern.source === 'string'
          ? source.includes(pattern.source)
          : pattern.source.test(source)
      );

      if (messageMatch && sourceMatch) {
        return {
          suppress: pattern.suppress,
          description: pattern.description
        };
      }
    }

    return { suppress: false, description: '' };
  }

  /**
   * Get suppression statistics
   */
  getStats(): { suppressedCount: number; enabled: boolean } {
    return {
      suppressedCount: this.suppressedCount,
      enabled: this.enabled
    };
  }

  /**
   * Enable/disable error suppression
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[ErrorSuppressor] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Reset suppression count
   */
  resetCount(): void {
    this.suppressedCount = 0;
  }

  /**
   * Restore original console methods
   */
  destroy(): void {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    this.enabled = false;
  }
}

// Create singleton instance
export const errorSuppressor = new ErrorSuppressor();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  errorSuppressor.init();
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).errorSuppressor = errorSuppressor;
  console.log('🔧 ErrorSuppressor available globally: window.errorSuppressor');
}

export default errorSuppressor;
