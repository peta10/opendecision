'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';

export const EnvironmentDebug: React.FC = () => {
  const [supabaseStatus, setSupabaseStatus] = React.useState<string>('checking...');
  const [buildInfo, setBuildInfo] = React.useState<any>({});
  const [cacheInfo, setCacheInfo] = React.useState<any>({});

  React.useEffect(() => {
    const checkSupabase = async () => {
      if (!supabase) {
        setSupabaseStatus('❌ Not configured');
        return;
      }
      
      try {
        const { data, error } = await supabase.from('criteria').select('count').limit(1);
        if (error) {
          setSupabaseStatus(`⚠️ Error: ${error.message}`);
        } else {
          setSupabaseStatus('✅ Connected');
        }
      } catch (err) {
        setSupabaseStatus(`❌ Failed: ${err}`);
      }
    };
    
    // Gather build info
    const gatherBuildInfo = () => {
      setBuildInfo({
        env: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? (navigator.userAgent.substring(0, 50) + '...') : 'SSR',
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
      });
    };
    
    // Check cache status
    const checkCacheStatus = async () => {
      const info: any = {};
      
      // Check service workers
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        info.serviceWorkers = registrations.length;
      }
      
      // Check caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        info.caches = cacheNames.length;
      }
      
      // Check localStorage
      info.localStorageKeys = Object.keys(localStorage).length;
      
      setCacheInfo(info);
    };
    
    checkSupabase();
    gatherBuildInfo();
    checkCacheStatus();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md space-y-2">
      <div className="font-bold text-yellow-400 mb-2">🔧 Environment Debug</div>
      
      {/* Connection Status */}
      <div className="border-t border-gray-600 pt-2">
        <div className="font-semibold text-blue-400">Connection</div>
        <div>Supabase: {supabaseStatus}</div>
        <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</div>
        <div>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
      </div>
      
      {/* Build Info */}
      <div className="border-t border-gray-600 pt-2">
        <div className="font-semibold text-blue-400">Build Info</div>
        <div>Env: {buildInfo.env}</div>
        <div>TZ: {buildInfo.timezone}</div>
        <div>Viewport: {buildInfo.viewport}</div>
      </div>
      
      {/* Cache Info */}
      <div className="border-t border-gray-600 pt-2">
        <div className="font-semibold text-blue-400">Cache Status</div>
        <div>Service Workers: {cacheInfo.serviceWorkers || 0}</div>
        <div>Caches: {cacheInfo.caches || 0}</div>
        <div>LocalStorage Keys: {cacheInfo.localStorageKeys || 0}</div>
      </div>
      
      {/* Clear Cache Button */}
      <button
        onClick={() => {
          if (confirm('Clear all caches and reload?')) {
            const script = document.createElement('script');
            script.src = '/clear-cache.js?reload=true';
            document.body.appendChild(script);
          }
        }}
        className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white font-semibold w-full"
      >
        Clear Cache & Reload
      </button>
    </div>
  );
};