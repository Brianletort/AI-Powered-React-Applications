import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { VictoryPie, VictoryLabel, VictoryContainer } from 'victory';

/**
 * Analytics Dashboard Component with Rich Charting
 * Author: Brian Letort
 * Created: 2025
 * 
 * Features:
 * - Real-time token usage tracking with Recharts line chart
 * - Session activity visualization with Recharts bar chart
 * - Sentiment analysis with Victory gauge
 * - Live-updating dashboard with auto-refresh
 * - Professional dark theme design
 */
const Analytics = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalTokens: 0,
    averageTokensPerSession: 0,
    sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
    tokenTimeline: [],
    hourlyActivity: [],
    topUsers: []
  });

  // ========================================
  // DATA FETCHING AND PROCESSING
  // ========================================

  const fetchSessions = async () => {
    try {
      console.log('📊 Fetching analytics data from:', API_ENDPOINTS.SESSIONS);
      setLoading(true);
      setError(null);

      const response = await axios.get(API_ENDPOINTS.SESSIONS);
      const sessionsData = response.data.sessions || [];
      
      console.log('✅ Analytics data received:', {
        sessionCount: sessionsData.length,
        totalCount: response.data.total_count
      });

      setSessions(sessionsData);
      calculateMetrics(sessionsData);

    } catch (err) {
      console.error('❌ Error fetching analytics data:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          'Failed to load analytics data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (sessionsData) => {
    if (!sessionsData || sessionsData.length === 0) {
      console.log('📊 No session data available for metrics calculation');
      return;
    }

    const totalSessions = sessionsData.length;
    const totalTokens = sessionsData.reduce((sum, session) => sum + (session.tokens || 0), 0);
    const averageTokensPerSession = totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0;

    // Calculate sentiment distribution
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    sessionsData.forEach(session => {
      const sentiment = session.sentiment || 0;
      if (sentiment > 0.1) {
        sentimentCounts.positive++;
      } else if (sentiment < -0.1) {
        sentimentCounts.negative++;
      } else {
        sentimentCounts.neutral++;
      }
    });

    // Create token timeline for line chart
    const tokenTimeline = createTokenTimeline(sessionsData);
    
    // Create hourly activity for bar chart
    const hourlyActivity = createHourlyActivity(sessionsData);
    
    // Calculate top users
    const topUsers = calculateTopUsers(sessionsData);

    const calculatedMetrics = {
      totalSessions,
      totalTokens,
      averageTokensPerSession,
      sentimentDistribution: sentimentCounts,
      tokenTimeline,
      hourlyActivity,
      topUsers
    };

    console.log('📈 Calculated metrics:', calculatedMetrics);
    setMetrics(calculatedMetrics);
  };

  const createTokenTimeline = (sessionsData) => {
    const timeline = {};
    
    sessionsData.forEach(session => {
      const date = new Date(session.created_at);
      const timeKey = `${date.getHours().toString().padStart(2, '0')}:${Math.floor(date.getMinutes()/10)*10}`;
      
      if (!timeline[timeKey]) {
        timeline[timeKey] = { time: timeKey, tokens: 0, sessions: 0 };
      }
      timeline[timeKey].tokens += session.tokens || 0;
      timeline[timeKey].sessions += 1;
    });

    return Object.values(timeline)
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(-20); // Last 20 data points
  };

  const createHourlyActivity = (sessionsData) => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sessions: 0,
      tokens: 0
    }));

    sessionsData.forEach(session => {
      const hour = new Date(session.created_at).getHours();
      hourlyData[hour].sessions += 1;
      hourlyData[hour].tokens += session.tokens || 0;
    });

    return hourlyData.filter(item => item.sessions > 0);
  };

  const calculateTopUsers = (sessionsData) => {
    const userGroups = {};
    
    sessionsData.forEach(session => {
      const userId = session.user_id;
      if (!userGroups[userId]) {
        userGroups[userId] = { userId, sessions: 0, tokens: 0 };
      }
      userGroups[userId].sessions++;
      userGroups[userId].tokens += session.tokens || 0;
    });

    return Object.values(userGroups)
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);
  };

  useEffect(() => {
    fetchSessions();
    const refreshInterval = setInterval(fetchSessions, 10000); // Refresh every 10 seconds
    return () => clearInterval(refreshInterval);
  }, []);

  // ========================================
  // CHART COMPONENTS
  // ========================================

  const TokenUsageChart = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">🔢 Token Usage Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={metrics.tokenTimeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="tokens" 
            stroke="#8B5CF6" 
            strokeWidth={3}
            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
            name="Tokens"
          />
          <Line 
            type="monotone" 
            dataKey="sessions" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
            name="Sessions"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const SessionActivityChart = () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">📊 Session Activity by Hour</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={metrics.hourlyActivity}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="hour" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
          />
          <Legend />
          <Bar 
            dataKey="sessions" 
            fill="#3B82F6" 
            name="Sessions"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const SentimentGauge = () => {
    const total = metrics.sentimentDistribution.positive + 
                  metrics.sentimentDistribution.neutral + 
                  metrics.sentimentDistribution.negative;
    
    if (total === 0) {
      return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">😊 Sentiment Analysis</h3>
          <div className="text-center text-gray-400">No sentiment data available</div>
        </div>
      );
    }

    const data = [
      { 
        x: 'Positive', 
        y: metrics.sentimentDistribution.positive,
        label: `${Math.round((metrics.sentimentDistribution.positive / total) * 100)}%`
      },
      { 
        x: 'Neutral', 
        y: metrics.sentimentDistribution.neutral,
        label: `${Math.round((metrics.sentimentDistribution.neutral / total) * 100)}%`
      },
      { 
        x: 'Negative', 
        y: metrics.sentimentDistribution.negative,
        label: `${Math.round((metrics.sentimentDistribution.negative / total) * 100)}%`
      }
    ];

    const colors = ['#10B981', '#6B7280', '#EF4444'];

    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">😊 Sentiment Distribution</h3>
        <div className="flex items-center justify-center">
          <VictoryContainer width={300} height={200}>
            <VictoryPie
              data={data}
              colorScale={colors}
              innerRadius={60}
              padAngle={3}
              labelComponent={<VictoryLabel style={{ fontSize: 14, fill: "#F3F4F6" }} />}
              startAngle={90}
              endAngle={-90}
            />
          </VictoryContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
            <div className="text-white">Positive</div>
            <div className="text-gray-400">{metrics.sentimentDistribution.positive}</div>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mb-1"></div>
            <div className="text-white">Neutral</div>
            <div className="text-gray-400">{metrics.sentimentDistribution.neutral}</div>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
            <div className="text-white">Negative</div>
            <div className="text-gray-400">{metrics.sentimentDistribution.negative}</div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getSentimentClass = (sentiment) => {
    if (sentiment > 0.1) return 'positive';
    if (sentiment < -0.1) return 'negative';
    return 'neutral';
  };

  const getSentimentLabel = (sentiment) => {
    if (sentiment > 0.1) return '😊 Positive';
    if (sentiment < -0.1) return '😞 Negative';
    return '😐 Neutral';
  };

  // ========================================
  // RENDER METHODS
  // ========================================

  const renderLoading = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-white mt-4">Loading analytics data...</p>
        <small className="text-gray-400">Real-time dashboard loading...</small>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <h3 className="text-red-400 text-xl mb-2">⚠️ Error Loading Analytics</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button 
          onClick={fetchSessions} 
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🔄 Retry
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">📊 Analytics Dashboard</h1>
          <p className="text-gray-400">Real-time AI chat telemetry and insights</p>
        </div>
        <button 
          onClick={fetchSessions} 
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Sessions</p>
              <p className="text-2xl font-bold text-white">{formatNumber(metrics.totalSessions)}</p>
            </div>
            <div className="text-3xl">💬</div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Tokens</p>
              <p className="text-2xl font-bold text-white">{formatNumber(metrics.totalTokens)}</p>
            </div>
            <div className="text-3xl">🔢</div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Tokens/Session</p>
              <p className="text-2xl font-bold text-white">{metrics.averageTokensPerSession}</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-white">{metrics.topUsers.length}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TokenUsageChart />
        <SessionActivityChart />
      </div>

      {/* Sentiment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <SentimentGauge />
        </div>
        
        {/* Top Users */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">👑 Top Users</h3>
          <div className="space-y-3">
            {metrics.topUsers.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.userId}</div>
                    <div className="text-gray-400 text-sm">{user.sessions} sessions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{formatNumber(user.tokens)}</div>
                  <div className="text-gray-400 text-sm">tokens</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">🕒 Recent Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 p-3">User</th>
                <th className="text-left text-gray-400 p-3">Tokens</th>
                <th className="text-left text-gray-400 p-3">Sentiment</th>
                <th className="text-left text-gray-400 p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 10).map((session) => (
                <tr key={session.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="p-3 text-white">{session.user_id}</td>
                  <td className="p-3 text-white">{session.tokens}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      getSentimentClass(session.sentiment) === 'positive' ? 'bg-green-900 text-green-300' :
                      getSentimentClass(session.sentiment) === 'negative' ? 'bg-red-900 text-red-300' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {getSentimentLabel(session.sentiment)}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">{new Date(session.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-400">
        <p>📊 Live Analytics Dashboard • Updates every 10 seconds • Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );

  // ========================================
  // MAIN RENDER
  // ========================================

  if (loading) return renderLoading();
  if (error) return renderError();
  return renderDashboard();
};

export default Analytics; 