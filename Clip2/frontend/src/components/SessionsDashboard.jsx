import React, { useState, useEffect } from 'react';
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

  // Fetch sessions data
  const fetchSessions = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_ENDPOINTS.SESSIONS}?limit=50`);
      setSessions(response.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Process data for charts
  const processData = () => {
    if (!sessions.length) return { chartData: [], hourlyData: [], stats: {} };

    const chartData = sessions.map((session, index) => ({
      id: index,
      time: new Date(session.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(session.ts),
      tokens: session.tokens || 0,
      sentiment: session.sentiment || 0,
    }));

    // Hourly aggregation
    const hourlyMap = {};
    sessions.forEach(session => {
      const hour = new Date(session.ts).getHours();
      if (!hourlyMap[hour]) {
        hourlyMap[hour] = { hour, sessions: 0, tokens: 0 };
      }
      hourlyMap[hour].sessions += 1;
      hourlyMap[hour].tokens += session.tokens || 0;
    });

    const hourlyData = Object.values(hourlyMap).sort((a, b) => a.hour - b.hour);

    // Calculate statistics
    const totalTokens = sessions.reduce((sum, s) => sum + (s.tokens || 0), 0);
    const avgTokens = sessions.length > 0 ? totalTokens / sessions.length : 0;
    const avgSentiment = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.sentiment || 0), 0) / sessions.length 
      : 0;
    const latestSentiment = sessions.length > 0 ? sessions[sessions.length - 1].sentiment || 0 : 0;

    return {
      chartData,
      hourlyData,
      stats: {
        totalSessions: sessions.length,
        totalTokens,
        avgTokens: Math.round(avgTokens),
        avgSentiment: avgSentiment,
        latestSentiment: latestSentiment,
      }
    };
  };

  const { chartData, hourlyData, stats } = processData();

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
              <span>Auto-refresh: 10s</span>
            </div>
            <div className="text-sm text-slate-500">
              Last update: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tokens Over Time Chart */}
        <div className="card p-6 lg:col-span-2">
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
                </tr>
              </thead>
              <tbody>
                {sessions.slice(-10).reverse().map((session, index) => (
                  <tr key={index} className="border-b border-dark-800/50 hover:bg-dark-700/30">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(session.ts).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {session.tokens || 0}
                    </td>
                    <td className={`py-3 px-4 ${getSentimentColor(session.sentiment || 0)}`}>
                      {(session.sentiment || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsDashboard; 