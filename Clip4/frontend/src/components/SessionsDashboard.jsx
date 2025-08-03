import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { VictoryPie, VictoryContainer } from 'victory';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';

/**
 * SessionsDashboard Component - Modern Dark-Themed Analytics Dashboard
 * Author: Brian Letort
 * Created: 2025
 * 
 * Professional analytics dashboard with dark theme design.
 * Features real-time data visualization with modern charts.
 */
const SessionsDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [hoveredSession, setHoveredSession] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageLimit] = useState(20); // Default page size

  // Fetch sessions data (paginated)
  const fetchSessions = async (page = 1, showLoader = false) => {
    // Defensive: ensure page is a number
    const safePage = typeof page === 'number' ? page : 1;
    if (showLoader) setIsLoading(true);
    try {
      setError(null);
      const response = await axios.get(`${API_ENDPOINTS.SESSIONS}?page=${safePage}&limit=${pageLimit}`);
      console.log('Pagination response:', response.data);
      setSessions(response.data.sessions);
      setTotalPages(response.data.total_pages);
      setHasNext(response.data.has_next);
      setHasPrevious(response.data.has_previous);
      setTotalCount(response.data.total_count);
      setLastRefresh(new Date());
      setCurrentPage(response.data.page);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load analytics data');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchSessions(currentPage, true); // Show loader on initial/page change
    const interval = setInterval(() => fetchSessions(currentPage, false), 2000); // Silent background refresh
    return () => clearInterval(interval);
  }, [currentPage]);

  // Process data for charts
  const processed = useMemo(() => {
    if (!sessions.length) return { chartData: [], hourlyData: [], judgmentChartData: [], stats: {} };

    const chartData = sessions.map((session, index) => {
      let time = '—';
      let timestamp = null;
      if (session.ts) {
        const dateObj = new Date(session.ts);
        if (!isNaN(dateObj.getTime())) {
          time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          timestamp = dateObj;
        }
      }
      return {
        id: index,
        time,
        timestamp,
        tokens: session.tokens || 0,
        sentiment: session.sentiment || 0,
      };
    });

    // Hourly aggregation
    const hourlyMap = {};
    sessions.forEach(session => {
      if (session.ts) {
        const dateObj = new Date(session.ts);
        if (!isNaN(dateObj.getTime())) {
          const hour = dateObj.getHours();
          if (!hourlyMap[hour]) {
            hourlyMap[hour] = { hour, sessions: 0, tokens: 0 };
          }
          hourlyMap[hour].sessions += 1;
          hourlyMap[hour].tokens += session.tokens || 0;
        }
      }
    });

    const hourlyData = Object.values(hourlyMap).sort((a, b) => a.hour - b.hour);

    // Calculate statistics
    const totalTokens = sessions.reduce((sum, s) => sum + (s.tokens || 0), 0);
    const avgTokens = sessions.length > 0 ? totalTokens / sessions.length : 0;
    const avgSentiment = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.sentiment || 0), 0) / sessions.length 
      : 0;
    const latestSentiment = sessions.length > 0 ? sessions[sessions.length - 1].sentiment || 0 : 0;

    // Calculate judgment statistics
    const sessionsWithJudgment = sessions.filter(s => s.judgment_score !== null && s.judgment_score !== undefined);
    const avgJudgmentScore = sessionsWithJudgment.length > 0 
      ? sessionsWithJudgment.reduce((sum, s) => sum + s.judgment_score, 0) / sessionsWithJudgment.length 
      : 0;
    const lowQualityCount = sessionsWithJudgment.filter(s => s.judgment_score < 3).length;
    const hallucinationCount = sessions.filter(s => s.hallucination_flag === true).length;
    
    // Calculate critical issues (score < 2 or hallucination)
    const criticalIssueCount = sessions.filter(s => 
      (s.judgment_score !== null && s.judgment_score < 2) || s.hallucination_flag === true
    ).length;

    // Process judgment scores over time (last 10 sessions with judgment data)
    const judgmentChartData = sessionsWithJudgment
      .slice(-10) // Take last 10 sessions with judgment data
      .map((session, index) => {
        let time = '—';
        let timestamp = null;
        if (session.ts) {
          const dateObj = new Date(session.ts);
          if (!isNaN(dateObj.getTime())) {
            time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timestamp = dateObj;
          }
        }
        return {
          id: index,
          time,
          timestamp,
          judgment_score: session.judgment_score,
          tokens: session.tokens || 0,
          sentiment: session.sentiment || 0,
          hallucination_flag: session.hallucination_flag
        };
      });

    return {
      chartData,
      hourlyData,
      judgmentChartData,
      stats: {
        totalSessions: sessions.length,
        totalTokens,
        avgTokens: Math.round(avgTokens),
        avgSentiment: avgSentiment,
        latestSentiment: latestSentiment,
        avgJudgmentScore: avgJudgmentScore,
        lowQualityCount: lowQualityCount,
        hallucinationCount: hallucinationCount,
        criticalIssueCount: criticalIssueCount,
        judgmentCoverage: sessions.length > 0 ? (sessionsWithJudgment.length / sessions.length * 100) : 0
      }
    };
  }, [sessions]);
  const { chartData, hourlyData, judgmentChartData, stats } = processed;

  // Sentiment color mapping
  const getSentimentColor = (sentiment) => {
    if (sentiment > 0.3) return 'text-accent-400';
    if (sentiment < -0.3) return 'text-danger-400';
    return 'text-slate-400';
  };

  const getSentimentGaugeColor = (sentiment) => {
    if (sentiment > 0.3) return '#22c55e';
    if (sentiment < -0.3) return '#ef4444';
    return '#64748b';
  };

  // Judgment score formatting
  const getJudgmentColor = (score) => {
    if (score === null || score === undefined) return 'text-slate-500';
    if (score >= 4) return 'text-accent-400';
    if (score === 3) return 'text-yellow-400';
    return 'text-danger-400'; // scores 1-2 are highlighted as problematic
  };

  const getJudgmentIcon = (score) => {
    if (score === null || score === undefined) return '—';
    if (score >= 5) return '⭐';
    if (score >= 4) return '✅';
    if (score >= 3) return '📊';
    if (score >= 2) return '⚠️';
    return '❌';
  };

  const getJudgmentLabel = (score) => {
    if (score === null || score === undefined) return 'No Score';
    if (score >= 5) return 'Excellent';
    if (score >= 4) return 'Good';
    if (score >= 3) return 'Average';
    if (score >= 2) return 'Below Average';
    return 'Poor';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 bg-danger-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Error Loading Data</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <button 
          onClick={fetchSessions}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
            <p className="text-slate-400">Real-time insights from your AI conversations</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
              <span>Auto-refresh: 2s</span>
            </div>
            <div className="text-sm text-slate-500">
              Last update: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="card card-hover p-6 bg-gradient-to-br from-primary-600/20 to-primary-800/20 border-primary-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-300 mb-1">Total Sessions</p>
              <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
            </div>
            <div className="w-12 h-12 bg-primary-600/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card card-hover p-6 bg-gradient-to-br from-accent-600/20 to-accent-800/20 border-accent-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-300 mb-1">Total Tokens</p>
              <p className="text-2xl font-bold text-white">{stats.totalTokens.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-accent-600/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card card-hover p-6 bg-gradient-to-br from-warning-600/20 to-warning-800/20 border-warning-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning-300 mb-1">Avg Tokens</p>
              <p className="text-2xl font-bold text-white">{stats.avgTokens}</p>
            </div>
            <div className="w-12 h-12 bg-warning-600/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card card-hover p-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-300 mb-1">Avg Sentiment</p>
              <p className={`text-2xl font-bold ${getSentimentColor(stats.avgSentiment)}`}>
                {stats.avgSentiment.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-600/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card card-hover p-6 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-300 mb-1">Avg Quality</p>
              <p className={`text-2xl font-bold ${getJudgmentColor(stats.avgJudgmentScore)}`}>
                {stats.avgJudgmentScore > 0 ? stats.avgJudgmentScore.toFixed(1) : '—'}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-600/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card card-hover p-6 bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-300 mb-1">Quality Issues</p>
              <p className="text-2xl font-bold text-white">{stats.lowQualityCount}</p>
              <p className="text-xs text-red-400 mt-1">Score &lt; 3</p>
            </div>
            <div className="w-12 h-12 bg-red-600/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card card-hover p-6 bg-gradient-to-br from-red-900/50 to-red-950/50 border-red-700/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-200 mb-1">Critical Issues</p>
              <p className="text-2xl font-bold text-red-100">{stats.criticalIssueCount}</p>
              <p className="text-xs text-red-300 mt-1">Score &lt; 2 or hallucination</p>
            </div>
            <div className="w-12 h-12 bg-red-800/50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tokens Over Time Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            </svg>
            Tokens Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#60a5fa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Judgment Score Over Time Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Quality Score Trend
          </h3>
          <div className="h-64">
            {judgmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={judgmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    formatter={(value, name) => [
                      `${value}/5`,
                      'Quality Score'
                    ]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="judgment_score" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    dot={(props) => {
                      const score = props.payload?.judgment_score;
                      let color = '#22c55e'; // Default green
                      if (score < 3) color = '#ef4444'; // Red for low scores
                      else if (score === 3) color = '#eab308'; // Yellow for average
                      
                      return (
                        <circle 
                          cx={props.cx} 
                          cy={props.cy} 
                          r={6} 
                          fill={color} 
                          stroke="#fff" 
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 8, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">No judgment data available</p>
                  <p className="text-xs opacity-75">Quality scores will appear here after AI evaluations</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hourly Sessions Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Sessions by Hour
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="sessions" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

                 {/* Sentiment Gauge */}
         <div className="card p-6">
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
             <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
             </svg>
             Latest Sentiment
           </h3>
           <div className="h-64 flex items-center justify-center">
             <div className="relative">
               <VictoryPie
                 animate={{ duration: 1000 }}
                 height={200}
                 width={200}
                 data={[
                   { x: 'Sentiment', y: Math.max(0.1, (stats.latestSentiment + 1) * 50) },
                   { x: 'Remaining', y: Math.max(0.1, 100 - (stats.latestSentiment + 1) * 50) }
                 ]}
                 innerRadius={60}
                 cornerRadius={5}
                 colorScale={[getSentimentGaugeColor(stats.latestSentiment), '#374151']}
                 labelComponent={<div />}
                 startAngle={-90}
                 endAngle={90}
                 containerComponent={<VictoryContainer responsive={false} />}
               />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center">
                   <div className={`text-2xl font-bold ${getSentimentColor(stats.latestSentiment)}`}>
                     {stats.latestSentiment.toFixed(2)}
                   </div>
                   <div className="text-xs text-slate-500">Sentiment</div>
                 </div>
               </div>
             </div>
           </div>
         </div>
      </div>

      {/* Data Table */}
      {sessions.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Recent Sessions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Tokens</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Sentiment</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Quality Score</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-300">Flags</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(sessions) && sessions.filter(Boolean).map((session, index) => {
                  if (!session || typeof session !== 'object') return null;
                  // Defensive: check if session.ts is a valid date
                  let timeDisplay = '—';
                  if (session.ts) {
                    const dateObj = new Date(session.ts);
                    if (!isNaN(dateObj.getTime())) {
                      timeDisplay = dateObj.toLocaleString();
                    }
                  }
                  const isCritical = (session.judgment_score !== null && session.judgment_score < 2) || session.hallucination_flag;
                  return (
                    <tr key={index} className={`border-b border-dark-800/50 hover:bg-dark-700/30 ${isCritical ? 'bg-red-950/30 border-red-900/50' : ''}`}>
                      <td className="py-3 px-4 text-slate-400">
                        {timeDisplay}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {typeof session.tokens === 'number' ? session.tokens : '—'}
                      </td>
                      <td className={`py-3 px-4 ${getSentimentColor(session.sentiment || 0)}`}>
                        {typeof session.sentiment === 'number' ? session.sentiment.toFixed(2) : '—'}
                      </td>
                      <td className="py-3 px-4 relative">
                        {session.judgment_score !== null && session.judgment_score !== undefined ? (
                          <div 
                            className={`inline-flex items-center space-x-1 cursor-help ${getJudgmentColor(session.judgment_score)}`}
                            onMouseEnter={(e) => {
                              setHoveredSession({
                                index,
                                score: session.judgment_score,
                                rationale: session.judgment_rationale,
                                label: getJudgmentLabel(session.judgment_score)
                              });
                              setTooltipPosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => setHoveredSession(null)}
                            onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
                          >
                            <span>{getJudgmentIcon(session.judgment_score)}</span>
                            <span className="font-medium">{session.judgment_score}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {/* Critical Issues - Score < 2 */}
                          {session.judgment_score !== null && session.judgment_score < 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-900/50 text-red-200 border border-red-600/70 animate-pulse">
                              🚨 Critical
                            </span>
                          )}
                          {/* Hallucination Warning */}
                          {session.hallucination_flag && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-900/50 text-red-200 border border-red-600/70 animate-pulse">
                              ⚠️ Hallucination
                            </span>
                          )}
                          {/* Regular Quality Issues - Score < 3 but >= 2 */}
                          {session.judgment_score !== null && session.judgment_score < 3 && session.judgment_score >= 2 && !session.hallucination_flag && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-600/20 text-orange-300 border border-orange-500/30">
                              Low Quality
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-slate-400 text-sm">
              Page {currentPage} of {totalPages} • {totalCount} total sessions
            </div>
            <div className="flex space-x-2">
              <button
                className="btn-primary px-4 py-2 rounded disabled:opacity-50"
                onClick={() => {
                  console.log('Previous clicked:', { currentPage, hasPrevious, isLoading });
                  setCurrentPage(Math.max(1, currentPage - 1));
                }}
                disabled={!hasPrevious || isLoading}
              >
                Previous
              </button>
              <button
                className="btn-primary px-4 py-2 rounded disabled:opacity-50"
                onClick={() => {
                  console.log('Next clicked:', { currentPage, hasNext, isLoading, totalPages });
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                }}
                disabled={!hasNext || isLoading}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Judgment Score Tooltip */}
      {hoveredSession && (
        <div 
          className="fixed z-50 max-w-xs bg-dark-800 border border-dark-600 rounded-lg shadow-xl p-3 pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-lg ${getJudgmentColor(hoveredSession.score)}`}>
              {getJudgmentIcon(hoveredSession.score)}
            </span>
            <div>
              <div className={`font-medium ${getJudgmentColor(hoveredSession.score)}`}>
                {hoveredSession.label} ({hoveredSession.score}/5)
              </div>
            </div>
          </div>
          {hoveredSession.rationale && (
            <div className="text-sm text-slate-300 border-t border-dark-600 pt-2">
              <div className="font-medium text-slate-400 mb-1">Rationale:</div>
              <div className="leading-relaxed">{hoveredSession.rationale}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SessionsDashboard); 