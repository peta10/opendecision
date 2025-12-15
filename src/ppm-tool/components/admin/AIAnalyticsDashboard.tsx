'use client';

/**
 * AI Analytics Dashboard Component
 *
 * Displays metrics for the AI chat system including:
 * - Total sessions, messages, latency
 * - Token usage and costs
 * - Feedback ratings
 * - Daily activity chart
 * - Top mentioned tools
 */

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Users,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Zap,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { cn } from '@/ppm-tool/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface ChatMetrics {
  total_sessions: number;
  total_messages: number;
  user_messages: number;
  assistant_messages: number;
  avg_latency_ms: number;
  total_input_tokens: number;
  total_output_tokens: number;
  positive_feedback: number;
  negative_feedback: number;
  feedback_rate: number;
}

interface DailyActivity {
  date: string;
  sessions: number;
  messages: number;
  avg_latency: number;
}

interface ToolMention {
  tool_name: string;
  mention_count: number;
}

interface PromptAnalytic {
  prompt_text: string;
  impressions: number;
  clicks: number;
  click_rate: number;
}

// =============================================================================
// Supabase Client
// =============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =============================================================================
// Stat Card Component
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className
}) => (
  <div className={cn(
    'bg-white rounded-xl border border-gray-200 p-5',
    className
  )}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && (
          <p className={cn(
            'text-xs mt-1',
            trend === 'up' ? 'text-green-600' :
            trend === 'down' ? 'text-red-500' : 'text-gray-400'
          )}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="p-2 bg-gray-100 rounded-lg">
        {icon}
      </div>
    </div>
  </div>
);

// =============================================================================
// Simple Bar Chart Component
// =============================================================================

interface SimpleBarChartProps {
  data: { label: string; value: number }[];
  maxValue?: number;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-24 text-xs text-gray-600 truncate" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-alpine-blue rounded-full transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <div className="w-12 text-xs text-gray-600 text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// Main Dashboard Component
// =============================================================================

export interface AIAnalyticsDashboardProps {
  daysBack?: number;
  className?: string;
}

export const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({
  daysBack = 30,
  className
}) => {
  const [metrics, setMetrics] = useState<ChatMetrics | null>(null);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [topTools, setTopTools] = useState<ToolMention[]>([]);
  const [promptAnalytics, setPromptAnalytics] = useState<PromptAnalytic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [metricsRes, activityRes, toolsRes, promptsRes] = await Promise.all([
        supabase.schema('ai').rpc('get_chat_metrics', { p_days_back: daysBack }),
        supabase.schema('ai').rpc('get_daily_activity', { p_days_back: 14 }),
        supabase.schema('ai').rpc('get_top_tools_mentioned', { p_days_back: daysBack, p_limit: 5 }),
        supabase.schema('ai').rpc('get_prompt_analytics', { p_days_back: daysBack, p_limit: 5 })
      ]);

      if (metricsRes.error) throw metricsRes.error;
      if (activityRes.error) throw activityRes.error;
      if (toolsRes.error) throw toolsRes.error;
      if (promptsRes.error) throw promptsRes.error;

      setMetrics(metricsRes.data);
      setDailyActivity(activityRes.data || []);
      setTopTools(toolsRes.data || []);
      setPromptAnalytics(promptsRes.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch AI analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [daysBack]);

  // Calculate estimated cost (GPT-4o-mini pricing)
  const estimatedCost = metrics ? (
    (metrics.total_input_tokens * 0.00015 / 1000) +
    (metrics.total_output_tokens * 0.0006 / 1000)
  ).toFixed(2) : '0.00';

  const feedbackScore = metrics && (metrics.positive_feedback + metrics.negative_feedback) > 0
    ? Math.round((metrics.positive_feedback / (metrics.positive_feedback + metrics.negative_feedback)) * 100)
    : null;

  if (isLoading && !metrics) {
    return (
      <div className={cn('flex items-center justify-center py-20', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-red-50 border border-red-200 rounded-xl p-6 text-center', className)}>
        <p className="text-red-600 mb-2">Failed to load analytics</p>
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Chat Analytics</h2>
          <p className="text-sm text-gray-500">Last {daysBack} days</p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={metrics?.total_sessions?.toLocaleString() || '0'}
          subtitle="Unique conversations"
          icon={<Users className="w-5 h-5 text-gray-600" />}
        />
        <StatCard
          title="Messages"
          value={metrics?.total_messages?.toLocaleString() || '0'}
          subtitle={`${metrics?.user_messages || 0} user / ${metrics?.assistant_messages || 0} AI`}
          icon={<MessageSquare className="w-5 h-5 text-gray-600" />}
        />
        <StatCard
          title="Avg Latency"
          value={`${metrics?.avg_latency_ms || 0}ms`}
          subtitle="Response time"
          icon={<Clock className="w-5 h-5 text-gray-600" />}
        />
        <StatCard
          title="Feedback Score"
          value={feedbackScore !== null ? `${feedbackScore}%` : 'N/A'}
          subtitle={`${metrics?.positive_feedback || 0} positive / ${metrics?.negative_feedback || 0} negative`}
          trend={feedbackScore !== null ? (feedbackScore >= 70 ? 'up' : 'down') : 'neutral'}
          icon={feedbackScore !== null && feedbackScore >= 70
            ? <ThumbsUp className="w-5 h-5 text-green-600" />
            : <ThumbsDown className="w-5 h-5 text-gray-600" />
          }
        />
      </div>

      {/* Token Usage & Cost */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Input Tokens"
          value={(metrics?.total_input_tokens || 0).toLocaleString()}
          icon={<Zap className="w-5 h-5 text-gray-600" />}
        />
        <StatCard
          title="Output Tokens"
          value={(metrics?.total_output_tokens || 0).toLocaleString()}
          icon={<Zap className="w-5 h-5 text-gray-600" />}
        />
        <StatCard
          title="Est. Cost"
          value={`$${estimatedCost}`}
          subtitle="GPT-4o-mini pricing"
          icon={<TrendingUp className="w-5 h-5 text-gray-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Daily Activity (14 days)
          </h3>
          {dailyActivity.length > 0 ? (
            <SimpleBarChart
              data={dailyActivity.map(d => ({
                label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: d.messages
              }))}
            />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No activity data</p>
          )}
        </div>

        {/* Top Tools Mentioned */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Top Tools Mentioned
          </h3>
          {topTools.length > 0 ? (
            <SimpleBarChart
              data={topTools.map(t => ({
                label: t.tool_name,
                value: Number(t.mention_count)
              }))}
            />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No tool mentions yet</p>
          )}
        </div>
      </div>

      {/* Prompt Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Suggested Prompt Performance</h3>
        {promptAnalytics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Prompt</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Impressions</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Clicks</th>
                  <th className="text-right py-2 text-gray-500 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody>
                {promptAnalytics.map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900 max-w-xs truncate" title={p.prompt_text}>
                      {p.prompt_text}
                    </td>
                    <td className="py-2 text-gray-600 text-right">{p.impressions}</td>
                    <td className="py-2 text-gray-600 text-right">{p.clicks}</td>
                    <td className="py-2 text-right">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs',
                        Number(p.click_rate) >= 10 ? 'bg-green-100 text-green-700' :
                        Number(p.click_rate) >= 5 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      )}>
                        {p.click_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No prompt analytics yet</p>
        )}
      </div>

      {/* Last Updated */}
      <p className="text-xs text-gray-400 text-center">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </p>
    </div>
  );
};

export default AIAnalyticsDashboard;
