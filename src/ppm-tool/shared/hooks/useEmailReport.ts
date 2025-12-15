'use client';

import { useState } from 'react';
import { Tool, Criterion } from '../types';
import { PPMEmailTemplateGenerator } from '../utils/emailTemplateGenerator';
import { checkAndTrackNewReportSent } from '@/lib/posthog';
import { analytics } from '@/lib/analytics';
import { calculateScore } from '../utils/toolRating';

interface UseEmailReportOptions {
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

interface EmailReportData {
  userEmail: string;
  firstName: string;
  lastName: string;
  selectedTools: Tool[];
  selectedCriteria: Criterion[];
  chartImageUrl?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

export const useEmailReport = (options: UseEmailReportOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const sendEmailReport = async (data: EmailReportData): Promise<EmailResponse> => {
    setIsLoading(true);
    setError(null);
    setProgress('Preparing report...');

    try {
      // Validate inputs
      if (!data.userEmail || !data.firstName || !data.lastName || !data.selectedTools.length || !data.selectedCriteria.length) {
        throw new Error('Missing required data for email report (email, first name, last name, tools, and criteria are required)');
      }

      setProgress('Analyzing your criteria...');

      // Generate chart image if not provided
      let chartImageUrl = data.chartImageUrl;
      if (!chartImageUrl) {
        try {
          setProgress('Creating visualizations...');
          chartImageUrl = await generateChartImage(data.selectedTools, data.selectedCriteria);
        } catch (chartError) {
          console.warn('Failed to generate chart image, continuing without chart:', chartError);
          // Continue without chart - the email template handles this gracefully
        }
      }

      // Check if we're in test mode (useful for debugging email delivery)
      const isTestMode = typeof window !== 'undefined' && 
        new URLSearchParams(window.location.search).get('emailTest') === 'true';

      setProgress('Generating personalized insights...');

      // Generate email payload
      const emailPayload = await PPMEmailTemplateGenerator.generateResendPayload({
        userEmail: data.userEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        selectedTools: data.selectedTools,
        selectedCriteria: data.selectedCriteria,
        chartImageUrl,
        bookingLink: 'https://app.onecal.io/b/matt-wagner/schedule-a-meeting-with-matt',
        unsubscribeLink: `${getBaseUrl()}/unsubscribe`,
        preferencesLink: `${getBaseUrl()}/email-preferences`,
        logoUrl: `${getBaseUrl()}/images/Logo_Panoramic_Solutions.webp`,
        mattHeadshotUrl: `${getBaseUrl()}/images/Wagner_Headshot_2024.webp`
      }, isTestMode);

      // Get guided ranking data from analytics database (replaces localStorage)
      let guidedRankingAnswers: Record<string, any> | null = null;
      let personalizationData: { timestamp: string; departments?: string[]; methodologies?: string[]; userCount?: number } | null = null;
      
      try {
        const userAnalytics = await analytics.getSessionData();
        if (userAnalytics) {
          // Convert question responses to guided ranking format for backward compatibility
          const questionResponses = userAnalytics.question_responses || [];
          guidedRankingAnswers = {};
          
          questionResponses.forEach((response: any) => {
            const questionKey = `q${response.question_order}`;
            guidedRankingAnswers![questionKey] = {
              value: response.choice_value || response.response_text,
              timestamp: response.response_timestamp
            };
          });
          
          // Extract personalization data from questions 10, 11, and 12
          if (questionResponses.length > 0) {
            const q10Response = questionResponses.find((r: any) => r.question_order === 10);
            const q11Responses = questionResponses.filter((r: any) => r.question_order === 11);
            const q12Responses = questionResponses.filter((r: any) => r.question_order === 12);
            
            personalizationData = {
              timestamp: new Date().toISOString(),
              userCount: q10Response?.choice_value || undefined,
              departments: q11Responses.map((r: any) => r.choice_text || '').filter(Boolean),
              methodologies: q12Responses.map((r: any) => r.choice_text || '').filter(Boolean)
            };
          }
          
          console.log('📊 Retrieved guided ranking answers from database:', guidedRankingAnswers);
          console.log('👥 Retrieved personalization data from database:', personalizationData);
        }
      } catch (error) {
        console.warn('Failed to retrieve guided ranking data from database, falling back to localStorage:', error);
        
        // Fallback to localStorage for backward compatibility
        if (typeof window !== 'undefined') {
          try {
            const storedAnswers = localStorage.getItem('guidedRankingAnswers');
            const storedPersonalization = localStorage.getItem('personalizationData');
            
            if (storedAnswers) {
              guidedRankingAnswers = JSON.parse(storedAnswers);
              console.log('📊 Retrieved guided ranking answers from localStorage fallback:', guidedRankingAnswers);
            }
            
            if (storedPersonalization) {
              personalizationData = JSON.parse(storedPersonalization);
              console.log('👥 Retrieved personalization data from localStorage fallback:', personalizationData);
            }
          } catch (fallbackError) {
            console.warn('Failed to retrieve guided ranking data from localStorage fallback:', fallbackError);
          }
        }
      }

      setProgress('Sending your custom report...');

      // Send via API endpoint using new React email format
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: data.userEmail,
          firstName: data.firstName,
          lastName: data.lastName,
          selectedTools: data.selectedTools,
          selectedCriteria: data.selectedCriteria,
          chartImageUrl: data.chartImageUrl,
          userAgent: typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          guidedRankingAnswers,
          personalizationData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to send email`);
      }

      const result: EmailResponse = await response.json();
      
      setProgress('Finalizing delivery...');

      // Track email send event (optional analytics)
      try {
        await trackEmailSent(data.userEmail, data.selectedTools.length, data.selectedCriteria.length);
      } catch (trackingError) {
        console.warn('Failed to track email event:', trackingError);
        // Don't fail the email send for tracking issues
      }

      // Track PostHog New_Report_Sent event (once per session)
      try {
        checkAndTrackNewReportSent({
          tool_count: data.selectedTools.length,
          criteria_count: data.selectedCriteria.length,
          has_chart: !!chartImageUrl,
          email_domain: data.userEmail.split('@')[1] || 'unknown',
          guided_ranking_used: !!guidedRankingAnswers,
          personalization_used: !!personalizationData,
          test_mode: isTestMode
        });
      } catch (posthogError) {
        console.warn('Failed to track PostHog report event:', posthogError);
        // Don't fail the email send for PostHog tracking issues
      }
      
      // Track Supabase email report send (CONVERSION EVENT - fire-and-forget)
      try {
        // Build context object with all relevant data
        const contextData = {
          tool_count: data.selectedTools.length,
          criteria_count: data.selectedCriteria.length,
          has_chart: !!chartImageUrl,
          guided_ranking_used: !!guidedRankingAnswers,
          personalization_used: !!personalizationData,
          test_mode: isTestMode,
          tools: data.selectedTools.map((tool, index) => ({
            id: tool.id,
            name: tool.name,
            score: calculateScore(tool, data.selectedCriteria),
            rank: index + 1
          })),
          criteria: data.selectedCriteria.reduce((acc, criterion) => {
            acc[criterion.id] = criterion.userRating;
            return acc;
          }, {} as Record<string, number>),
          firmographics: personalizationData ? {
            departments: personalizationData.departments || [],
            methodologies: personalizationData.methodologies || [],
            user_count: personalizationData.userCount || null,
            project_volume: guidedRankingAnswers?.q1 || null,
            tasks_per_project: guidedRankingAnswers?.q2 || null,
            expertise_level: guidedRankingAnswers?.q3 || null
          } : {}
        };
        
        // Use new trackEmailReportSend function
        const reportId = await analytics.trackEmailReportSend({
          email: data.userEmail,
          firstName: data.firstName,
          lastName: data.lastName,
          reportType: 'full_report',
          numRecommendations: data.selectedTools.length,
          context: contextData
        });
        
        console.log('📧 Analytics: Email report send tracked with ID:', reportId);
        
        // ✅ NEW: Identify user with PostHog for cross-device tracking
        try {
          const posthog = (await import('posthog-js')).default;
          const { getAttribution } = await import('@/lib/attribution');
          const attribution = getAttribution();
          
          if (posthog && posthog.__loaded) {
            posthog.identify(data.userEmail, {
              email: data.userEmail,
              first_name: data.firstName,
              last_name: data.lastName,
              $set: {
                last_report_sent_at: new Date().toISOString(),
                total_tools_recommended: data.selectedTools.length
              },
              $set_once: {
                first_report_sent_at: new Date().toISOString(),
                first_report_type: 'full_report',
                // ✅ ATTRIBUTION: Permanently associate with user profile
                first_referrer: attribution?.referrer || 'direct',
                first_source: attribution?.source_category || 'Direct Traffic',
                first_utm_source: attribution?.utm_source,
                first_utm_medium: attribution?.utm_medium,
                first_utm_campaign: attribution?.utm_campaign,
                first_landing_page: attribution?.landing_page
              }
            });
            console.log('✅ PostHog: User identified with email:', data.userEmail);
            console.log('🎯 PostHog: Attribution linked to user:', attribution?.source_category);
            
            // ✅ NEW: Track company-level analytics (B2B)
            const emailDomain = data.userEmail.split('@')[1];
            if (emailDomain && !emailDomain.includes('gmail') && !emailDomain.includes('yahoo') && !emailDomain.includes('hotmail')) {
              posthog.group('company', emailDomain, {
                company_domain: emailDomain,
                first_seen: new Date().toISOString()
              });
              console.log('✅ PostHog: Company group tracked:', emailDomain);
            }
          }
        } catch (posthogError) {
          console.warn('Failed to identify user with PostHog:', posthogError);
        }
        
        // Track department if provided in personalization
        if (personalizationData?.departments && personalizationData.departments.length > 0) {
          await analytics.trackDepartment({
            department: personalizationData.departments[0], // Use first department
            companySize: personalizationData.userCount ? `${personalizationData.userCount}+ users` : undefined,
            industry: undefined // Add if we collect this data
          });
        }
      } catch (analyticsError) {
        console.warn('Failed to track Supabase email report event:', analyticsError);
        // Don't fail the email send for analytics tracking issues
      }
      
      setProgress('Complete!');
      options.onSuccess?.(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setProgress('');
      options.onError?.(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
      // Clear progress after a short delay
      setTimeout(() => setProgress(''), 1000);
    }
  };

  const clearError = () => setError(null);

  return {
    sendEmailReport,
    isLoading,
    error,
    progress,
    clearError
  };
};

/**
 * Helper function to get the base URL for the application
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server-side rendering
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://panoramic-solutions.com';
}

/**
 * Helper function to generate chart image
 */
async function generateChartImage(tools: Tool[], criteria: Criterion[]): Promise<string | undefined> {
  try {
    // Use canvas chart generation for Gmail compatibility
    if (tools.length > 0) {
      const tool = tools[0]; // Use first tool for chart
      const chartParams = new URLSearchParams({
        tool: tool.name,
        toolData: encodeURIComponent(JSON.stringify(tool)),
        criteria: criteria.map((c: any) => c.id).join(','),
        userRankings: criteria.map(() => '3').join(','), // Default ratings
        toolIndex: '0'
      });
      
      const imageUrl = `/api/chart/dynamic.png?${chartParams.toString()}`;
      console.log('📊 useEmailReport: Using canvas chart:', imageUrl);
      return imageUrl;
    } else {
      console.warn('No tools available for chart generation');
      return undefined;
    }
  } catch (error) {
    console.warn('Failed to generate chart image:', error);
    return undefined;
  }
}

/**
 * Helper function to track email send event for analytics
 */
async function trackEmailSent(email: string, toolCount: number, criteriaCount: number): Promise<void> {
  try {
    // Hash email for privacy
    const hashedEmail = await hashEmail(email);
    
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'email_report_sent',
        properties: {
          email_hash: hashedEmail,
          tool_count: toolCount,
          criteria_count: criteriaCount,
          timestamp: new Date().toISOString(),
          user_agent: typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
        }
      }),
      // Don't wait too long for analytics
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    console.warn('Failed to track email event:', error);
    // Don't throw - analytics failure shouldn't break email sending
  }
}

/**
 * Simple email hashing for privacy-compliant analytics
 */
async function hashEmail(email: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(email.toLowerCase().trim());
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.warn('Failed to hash email:', error);
  }
  
  // Fallback: return a simple hash
  return btoa(email.toLowerCase().trim()).substring(0, 16);
}
