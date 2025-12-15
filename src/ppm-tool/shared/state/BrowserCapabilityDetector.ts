'use client';

/**
 * Browser Capability Detection
 * Tests all browser features needed for bumpers to work
 */

export interface BrowserCapabilities {
  // Core APIs
  localStorage: boolean;
  sessionStorage: boolean;
  setTimeout: boolean;
  addEventListener: boolean;
  
  // DOM APIs
  querySelector: boolean;
  createElement: boolean;
  
  // Modern APIs
  intersectionObserver: boolean;
  requestAnimationFrame: boolean;
  
  // Browser info
  userAgent: string;
  browserName: string;
  isMobile: boolean;
  isTablet: boolean;
  
  // Performance score (0-1)
  overallScore: number;
}

export class BrowserCapabilityDetector {
  private static instance: BrowserCapabilityDetector;
  private capabilities: BrowserCapabilities | null = null;
  
  static getInstance(): BrowserCapabilityDetector {
    if (!this.instance) {
      this.instance = new BrowserCapabilityDetector();
    }
    return this.instance;
  }
  
  async detect(): Promise<BrowserCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }
    
    const capabilities: BrowserCapabilities = {
      // Test core APIs
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      setTimeout: this.testSetTimeout(),
      addEventListener: this.testEventListener(),
      
      // Test DOM APIs
      querySelector: this.testQuerySelector(),
      createElement: this.testCreateElement(),
      
      // Test modern APIs
      intersectionObserver: this.testIntersectionObserver(),
      requestAnimationFrame: this.testRequestAnimationFrame(),
      
      // Browser detection
      userAgent: this.getUserAgent(),
      browserName: this.getBrowserName(),
      isMobile: this.isMobileDevice(),
      isTablet: this.isTabletDevice(),
      
      overallScore: 0 // Will be calculated
    };
    
    // Calculate overall score
    capabilities.overallScore = this.calculateScore(capabilities);
    
    this.capabilities = capabilities;
    return capabilities;
  }
  
  private testLocalStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__test_ls__';
      window.localStorage.setItem(testKey, 'test');
      const result = window.localStorage.getItem(testKey) === 'test';
      window.localStorage.removeItem(testKey);
      return result;
    } catch {
      return false;
    }
  }
  
  private testSessionStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return false;
      const testKey = '__test_ss__';
      window.sessionStorage.setItem(testKey, 'test');
      const result = window.sessionStorage.getItem(testKey) === 'test';
      window.sessionStorage.removeItem(testKey);
      return result;
    } catch {
      return false;
    }
  }
  
  private testSetTimeout(): boolean {
    try {
      if (typeof window === 'undefined' || typeof setTimeout !== 'function') return false;
      const timer = setTimeout(() => {}, 0);
      clearTimeout(timer);
      return true;
    } catch {
      return false;
    }
  }
  
  private testEventListener(): boolean {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') return false;
      const testFn = () => {};
      document.addEventListener('test', testFn);
      document.removeEventListener('test', testFn);
      return true;
    } catch {
      return false;
    }
  }
  
  private testQuerySelector(): boolean {
    try {
      if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return false;
      document.querySelector('body');
      return true;
    } catch {
      return false;
    }
  }
  
  private testCreateElement(): boolean {
    try {
      if (typeof document === 'undefined' || typeof document.createElement !== 'function') return false;
      const el = document.createElement('div');
      return el instanceof HTMLElement;
    } catch {
      return false;
    }
  }
  
  private testIntersectionObserver(): boolean {
    try {
      return typeof window !== 'undefined' && 'IntersectionObserver' in window;
    } catch {
      return false;
    }
  }
  
  private testRequestAnimationFrame(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function';
    } catch {
      return false;
    }
  }
  
  private getUserAgent(): string {
    try {
      return typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    } catch {
      return 'Unknown';
    }
  }
  
  private getBrowserName(): string {
    const ua = this.getUserAgent().toLowerCase();
    
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    
    return 'Other';
  }
  
  private isMobileDevice(): boolean {
    const ua = this.getUserAgent();
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  }
  
  private isTabletDevice(): boolean {
    const ua = this.getUserAgent();
    return /iPad|Android(?!.*Mobile)/i.test(ua);
  }
  
  private calculateScore(capabilities: BrowserCapabilities): number {
    const weights = {
      localStorage: 0.2,
      sessionStorage: 0.1,
      setTimeout: 0.2,
      addEventListener: 0.2,
      querySelector: 0.1,
      createElement: 0.1,
      intersectionObserver: 0.05,
      requestAnimationFrame: 0.05
    };
    
    let score = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([key, weight]) => {
      if (capabilities[key as keyof BrowserCapabilities] === true) {
        score += weight;
      }
      totalWeight += weight;
    });
    
    return score / totalWeight;
  }
  
  getRecommendedStrategy(capabilities: BrowserCapabilities): 'full' | 'limited' | 'fallback' {
    if (capabilities.overallScore >= 0.8) return 'full';
    if (capabilities.overallScore >= 0.6) return 'limited';
    return 'fallback';
  }
}

export const capabilityDetector = BrowserCapabilityDetector.getInstance();
