'use client';

/**
 * Production Monitor
 * Tracks bumper system performance and issues in production
 * Helps diagnose why bumpers might not work for different users
 */

import { stateManager } from '../state/UniversalBumperStateManager';
import { capabilityDetector } from '../state/BrowserCapabilityDetector';

interface MonitoringEvent {
  timestamp: string;
  event: string;
  data: any;
  userAgent: string;
  url: string;
  capabilities?: any;
}

class ProductionMonitor {
  private static instance: ProductionMonitor;
  private events: MonitoringEvent[] = [];
  private maxEvents = 100; // Keep last 100 events
  
  static getInstance(): ProductionMonitor {
    if (!this.instance) {
      this.instance = new ProductionMonitor();
    }
    return this.instance;
  }
  
  private log(event: string, data: any = {}) {
    if (typeof window === 'undefined') return;
    
    const monitoringEvent: MonitoringEvent = {
      timestamp: new Date().toISOString(),
      event,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.events.push(monitoringEvent);
    
    // Keep only last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Console log for debugging
    console.log(`📊 [Monitor] ${event}:`, data);
  }
  
  // System events
  systemInitialized(capabilities: any) {
    this.log('system_initialized', { capabilities });
  }
  
  systemFailed(error: any) {
    this.log('system_failed', { error: error.message || error });
  }
  
  hydrationComplete() {
    this.log('hydration_complete');
  }
  
  // Storage events
  storageTest(results: any) {
    this.log('storage_test', results);
  }
  
  storageFallback(reason: string) {
    this.log('storage_fallback', { reason });
  }
  
  // Bumper events
  bumperTriggered(type: 'product' | 'exit-intent', method: 'automatic' | 'manual') {
    this.log('bumper_triggered', { type, method });
  }
  
  bumperBlocked(type: 'product' | 'exit-intent', reasons: string[]) {
    this.log('bumper_blocked', { type, reasons });
  }
  
  bumperShown(type: 'product' | 'exit-intent') {
    this.log('bumper_shown', { type });
  }
  
  bumperDismissed(type: 'product' | 'exit-intent') {
    this.log('bumper_dismissed', { type });
  }
  
  // Timer events
  timerStarted(type: string, duration: number) {
    this.log('timer_started', { type, duration });
  }
  
  timerCompleted(type: string) {
    this.log('timer_completed', { type });
  }
  
  // User action events
  userAction(action: string, data: any = {}) {
    this.log('user_action', { action, ...data });
  }
  
  // Error events
  error(error: any, context: string) {
    this.log('error', { 
      message: error.message || error,
      stack: error.stack,
      context 
    });
  }
  
  // Get diagnostic report
  async getDiagnosticReport() {
    const capabilities = await capabilityDetector.detect();
    const state = stateManager.getState();
    
    return {
      timestamp: new Date().toISOString(),
      environment: {
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        isProduction: process.env.NODE_ENV === 'production',
        domain: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
      },
      capabilities,
      state,
      recentEvents: this.events.slice(-20), // Last 20 events
      summary: this.generateSummary()
    };
  }
  
  private generateSummary() {
    const summary = {
      totalEvents: this.events.length,
      systemInitialized: this.events.some(e => e.event === 'system_initialized'),
      hydrationComplete: this.events.some(e => e.event === 'hydration_complete'),
      bumpersTriggered: this.events.filter(e => e.event === 'bumper_triggered').length,
      bumpersBlocked: this.events.filter(e => e.event === 'bumper_blocked').length,
      errors: this.events.filter(e => e.event === 'error').length,
      storageFallbacks: this.events.filter(e => e.event === 'storage_fallback').length
    };
    
    return summary;
  }
  
  // Export data for support
  exportData() {
    return {
      events: this.events,
      diagnosticReport: this.getDiagnosticReport()
    };
  }
  
  // Clear monitoring data
  clear() {
    this.events = [];
    this.log('monitoring_cleared');
  }
}

export const productionMonitor = ProductionMonitor.getInstance();

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).productionMonitor = {
    getReport: () => productionMonitor.getDiagnosticReport(),
    export: () => productionMonitor.exportData(),
    clear: () => productionMonitor.clear(),
    
    // Quick diagnostic
    diagnose: async () => {
      const report = await productionMonitor.getDiagnosticReport();
      console.log('🔍 Production Diagnostic Report');
      console.log('================================');
      console.log('Environment:', report.environment);
      console.log('Capabilities Score:', report.capabilities.overallScore);
      console.log('System Status:', report.summary);
      console.log('State:', report.state);
      console.log('Recent Events:', report.recentEvents);
      
      // Specific issues
      if (!report.summary.systemInitialized) {
        console.warn('⚠️ System not initialized - check browser compatibility');
      }
      
      if (!report.summary.hydrationComplete) {
        console.warn('⚠️ Hydration not complete - SSR/client mismatch possible');
      }
      
      if (report.summary.errors > 0) {
        console.warn(`⚠️ ${report.summary.errors} errors detected`);
      }
      
      if (report.summary.storageFallbacks > 0) {
        console.warn(`⚠️ ${report.summary.storageFallbacks} storage fallbacks used`);
      }
      
      if (report.capabilities.overallScore < 0.7) {
        console.warn('⚠️ Low browser capability score - limited functionality');
      }
      
      return report;
    }
  };
}
