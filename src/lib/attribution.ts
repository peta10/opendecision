// Attribution tracking for user source detection
interface UserAttribution {
  source_category: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page: string;
  timestamp: number;
  session_id: string;
}

/**
 * Capture user attribution on first visit and persist for the entire user journey
 */
export const captureAttribution = (): UserAttribution => {
  // Check if already captured (persist forever until localStorage cleared)
  const existing = localStorage.getItem('user_attribution');
  if (existing) {
    return JSON.parse(existing);
  }

  const attribution: UserAttribution = {
    source_category: detectSourceCategory(document.referrer),
    referrer: document.referrer || 'direct',
    utm_source: getUrlParam('utm_source'),
    utm_medium: getUrlParam('utm_medium'),
    utm_campaign: getUrlParam('utm_campaign'),
    utm_content: getUrlParam('utm_content'),
    utm_term: getUrlParam('utm_term'),
    landing_page: window.location.href,
    timestamp: Date.now(),
    session_id: generateSessionId()
  };

  // Store permanently until user clears data
  localStorage.setItem('user_attribution', JSON.stringify(attribution));
  console.log('🎯 User attribution captured:', attribution);
  
  // ✅ NEW: Set attribution as PostHog super properties (auto-included in all events)
  try {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      const posthog = (window as any).posthog;
      posthog.register({
        initial_referrer: attribution.referrer,
        initial_source: attribution.source_category,
        initial_utm_source: attribution.utm_source || null,
        initial_utm_medium: attribution.utm_medium || null,
        initial_utm_campaign: attribution.utm_campaign || null,
        initial_utm_content: attribution.utm_content || null,
        initial_utm_term: attribution.utm_term || null,
        initial_landing_page: attribution.landing_page
      });
      
      // Also set as user properties for person profile
      posthog.capture('$set', {
        $set_once: {
          first_referrer: attribution.referrer,
          first_source: attribution.source_category,
          first_utm_source: attribution.utm_source,
          first_utm_campaign: attribution.utm_campaign,
          first_landing_page: attribution.landing_page,
          first_visit_date: new Date().toISOString()
        }
      });
      
      console.log('✅ PostHog: Attribution set as super properties');
    }
  } catch (error) {
    console.warn('Failed to set PostHog attribution:', error);
  }
  
  return attribution;
};

/**
 * Detect user source category from referrer domain
 * ✅ ENHANCED: Added more platforms for robust tracking
 */
const detectSourceCategory = (referrer: string): string => {
  if (!referrer) return 'Direct Traffic';
  
  const ref = referrer.toLowerCase();
  
  // Social Media (Enhanced)
  if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'YouTube';
  if (ref.includes('linkedin.com') || ref.includes('lnkd.in')) return 'LinkedIn';
  if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fbclid')) return 'Facebook';
  if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com')) return 'Twitter/X';
  if (ref.includes('instagram.com')) return 'Instagram';
  if (ref.includes('reddit.com') || ref.includes('redd.it')) return 'Reddit';
  if (ref.includes('tiktok.com')) return 'TikTok';
  if (ref.includes('pinterest.com') || ref.includes('pin.it')) return 'Pinterest';
  if (ref.includes('discord.com') || ref.includes('discord.gg')) return 'Discord';
  if (ref.includes('slack.com')) return 'Slack';
  if (ref.includes('whatsapp.com')) return 'WhatsApp';
  if (ref.includes('telegram.org') || ref.includes('t.me')) return 'Telegram';
  
  // Search Engines (Enhanced)
  if (ref.includes('google.com') || ref.includes('google.')) return 'Google Search';
  if (ref.includes('bing.com')) return 'Bing Search';
  if (ref.includes('duckduckgo.com')) return 'DuckDuckGo';
  if (ref.includes('yahoo.com')) return 'Yahoo Search';
  if (ref.includes('baidu.com')) return 'Baidu Search';
  if (ref.includes('yandex.com') || ref.includes('yandex.ru')) return 'Yandex Search';
  
  // PPM Tool Communities (flexible patterns)
  if (ref.includes('smartsheet') && (ref.includes('community') || ref.includes('forum'))) return 'Smartsheet Community';
  if (ref.includes('airtable') && (ref.includes('community') || ref.includes('forum'))) return 'Airtable Community';
  if (ref.includes('asana') && (ref.includes('community') || ref.includes('forum'))) return 'Asana Community';
  if (ref.includes('monday') && (ref.includes('community') || ref.includes('forum'))) return 'Monday.com Community';
  if (ref.includes('clickup') && (ref.includes('community') || ref.includes('forum'))) return 'ClickUp Community';
  if (ref.includes('jira') && (ref.includes('community') || ref.includes('forum'))) return 'Jira Community';
  if (ref.includes('atlassian') && (ref.includes('community') || ref.includes('forum'))) return 'Atlassian Community';
  
  // General PPM/Project Management Sites
  if (ref.includes('projectmanagement.com')) return 'ProjectManagement.com';
  if (ref.includes('pmi.org')) return 'PMI.org';
  
  // Unknown referrer
  return 'Other Referrer';
};

/**
 * Get URL parameter value
 */
const getUrlParam = (param: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || undefined;
};

/**
 * Generate unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get stored attribution data
 */
export const getAttribution = (): UserAttribution | null => {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('user_attribution');
  return stored ? JSON.parse(stored) : null;
};

/**
 * Clear attribution data (useful for testing)
 */
export const clearAttribution = (): void => {
  localStorage.removeItem('user_attribution');
  console.log('🧹 Attribution data cleared');
};

/**
 * Debug function to see current attribution
 */
export const debugAttribution = (): void => {
  const attribution = getAttribution();
  console.log('🔍 Current attribution:', attribution);
};

// Make debug functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugAttribution = debugAttribution;
  (window as any).clearAttribution = clearAttribution;
  console.log('🔧 Attribution debug functions available: debugAttribution(), clearAttribution()');
}
