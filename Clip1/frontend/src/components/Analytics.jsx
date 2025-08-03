import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import './Analytics.css';

/**
 * Analytics Dashboard Component
 * Author: Brian Letort
 * Created: 2025
 * 
 * This component provides a comprehensive analytics dashboard for the AI chat application.
 * It demonstrates data visualization, API integration, and modern React patterns.
 * 
 * Key Features:
 * - Real-time data fetching from FastAPI backend
 * - Interactive data visualization with placeholder charts
 * - Comprehensive metrics and KPI tracking
 * - Responsive design with professional styling
 * - Error handling and loading states
 * 
 * Technical Implementation:
 * - React hooks for state management and side effects
 * - Axios for HTTP communication with backend
 * - Data transformation and aggregation
 * - Placeholder chart components (ready for Recharts/Victory integration)
 * - CSS Grid and Flexbox for responsive layout
 * 
 * Future Enhancements:
 * - Integration with charting libraries (Recharts, Victory, Chart.js)
 * - Real-time updates with WebSocket connections
 * - Export functionality for reports
 * - Advanced filtering and date range selection
 * 
 * Author: Brian Letort
 * License: MIT
 */
const Analytics = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  /**
   * Sessions data state - stores all chat session data from backend
   * Contains user interactions, tokens, sentiment, and timestamps
   */
  const [sessions, setSessions] = useState([]);
  
  /**
   * Loading state - tracks API request status
   * Used to show loading indicators during data fetching
   */
  const [loading, setLoading] = useState(true);
  
  /**
   * Error state - stores error messages for user feedback
   * Displays user-friendly error messages when API calls fail
   */
  const [error, setError] = useState(null);
  
  /**
   * Analytics metrics state - stores computed analytics data
   * Aggregated metrics calculated from session data
   */
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalTokens: 0,
    averageTokensPerSession: 0,
    sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
    dailyActivity: [],
    topUsers: []
  });

  // ========================================
  // DATA FETCHING AND PROCESSING
  // ========================================
  
  /**
   * Fetch sessions data from backend API
   * 
   * This function demonstrates:
   * - Async/await pattern for API calls
   * - Comprehensive error handling
   * - State management during async operations
   * - Data transformation after successful fetch
   * 
   * Author: Brian Letort
   */
  const fetchSessions = async () => {
    try {
      console.log('📊 Fetching analytics data from:', API_ENDPOINTS.SESSIONS);
      setLoading(true);
      setError(null);

      // Make API request to backend sessions endpoint
      const response = await axios.get(API_ENDPOINTS.SESSIONS);
      const sessionsData = response.data.sessions || [];
      
      console.log('✅ Analytics data received:', {
        sessionCount: sessionsData.length,
        totalCount: response.data.total_count
      });

      // Update sessions state with fetched data
      setSessions(sessionsData);
      
      // Calculate analytics metrics from the fetched data
      calculateMetrics(sessionsData);

    } catch (err) {
      console.error('❌ Error fetching analytics data:', err);
      
      // Set user-friendly error message
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          'Failed to load analytics data';
      setError(errorMessage);
      
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  /**
   * Calculate analytics metrics from session data
   * 
   * This function demonstrates:
   * - Data aggregation and transformation
   * - Statistical calculations
   * - Array manipulation and filtering
   * - Date/time processing
   * 
   * @param {Array} sessionsData - Raw session data from API
   * 
   * Author: Brian Letort
   */
  const calculateMetrics = (sessionsData) => {
    if (!sessionsData || sessionsData.length === 0) {
      console.log('📊 No session data available for metrics calculation');
      return;
    }

    // Calculate total sessions and tokens
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

    // Calculate daily activity (group sessions by date)
    const dailyActivity = calculateDailyActivity(sessionsData);
    
    // Calculate top users by session count
    const topUsers = calculateTopUsers(sessionsData);

    // Update metrics state
    const calculatedMetrics = {
      totalSessions,
      totalTokens,
      averageTokensPerSession,
      sentimentDistribution: sentimentCounts,
      dailyActivity,
      topUsers
    };

    console.log('📈 Calculated metrics:', calculatedMetrics);
    setMetrics(calculatedMetrics);
  };

  /**
   * Calculate daily activity metrics
   * Groups sessions by date and counts interactions per day
   * 
   * Author: Brian Letort
   */
  const calculateDailyActivity = (sessionsData) => {
    const dailyGroups = {};
    
    sessionsData.forEach(session => {
      const date = new Date(session.created_at).toDateString();
      dailyGroups[date] = (dailyGroups[date] || 0) + 1;
    });

    return Object.entries(dailyGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Last 7 days
  };

  /**
   * Calculate top users by session count
   * Aggregates sessions by user and sorts by activity level
   * 
   * Author: Brian Letort
   */
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
      .slice(0, 5); // Top 5 users
  };

  // ========================================
  // COMPONENT LIFECYCLE
  // ========================================
  
  /**
   * Component initialization effect
   * Fetches data when component mounts and sets up auto-refresh
   * 
   * Author: Brian Letort
   */
  useEffect(() => {
    // Initial data fetch
    fetchSessions();

    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(fetchSessions, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  
  /**
   * Format large numbers for display
   * Converts numbers to human-readable format (1.2K, 1.5M, etc.)
   * 
   * Author: Brian Letort
   */
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  /**
   * Calculate percentage for sentiment distribution
   * 
   * Author: Brian Letort
   */
  const calculatePercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // ========================================
  // PLACEHOLDER CHART COMPONENTS
  // ========================================
  // These components provide placeholder visualizations
  // Ready for integration with charting libraries like Recharts or Victory
  
  /**
   * Placeholder Bar Chart Component
   * Displays daily activity data as a simple bar chart
   * 
   * Author: Brian Letort
   */
  const PlaceholderBarChart = ({ data, title }) => (
    <div className="chart-placeholder">
      <h4>{title}</h4>
      <div className="bar-chart">
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div 
              className="bar" 
              style={{ 
                height: `${Math.max(item.count * 20, 10)}px`,
                backgroundColor: '#4f46e5'
              }}
            />
            <span className="bar-label">{new Date(item.date).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /**
   * Placeholder Pie Chart Component
   * Displays sentiment distribution as a simple pie chart representation
   * 
   * Author: Brian Letort
   */
  const PlaceholderPieChart = ({ data, title }) => {
    const total = data.positive + data.neutral + data.negative;
    
    return (
      <div className="chart-placeholder">
        <h4>{title}</h4>
        <div className="pie-chart">
          <div className="pie-legend">
            <div className="legend-item">
              <span className="legend-color positive"></span>
              <span>Positive: {calculatePercentage(data.positive, total)}%</span>
            </div>
            <div className="legend-item">
              <span className="legend-color neutral"></span>
              <span>Neutral: {calculatePercentage(data.neutral, total)}%</span>
            </div>
            <div className="legend-item">
              <span className="legend-color negative"></span>
              <span>Negative: {calculatePercentage(data.negative, total)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // RENDER METHODS
  // ========================================
  
  /**
   * Render loading state
   * Shows loading spinner and message while fetching data
   */
  const renderLoading = () => (
    <div className="analytics-loading">
      <div className="loading-spinner"></div>
      <p>Loading analytics data...</p>
      <small>Built by Brian Letort</small>
    </div>
  );

  /**
   * Render error state
   * Shows error message with retry option
   */
  const renderError = () => (
    <div className="analytics-error">
      <h3>⚠️ Error Loading Analytics</h3>
      <p>{error}</p>
      <button onClick={fetchSessions} className="retry-button">
        🔄 Retry
      </button>
      <small>Built by Brian Letort</small>
    </div>
  );

  /**
   * Render main analytics dashboard
   * Shows comprehensive metrics and visualizations
   */
  const renderDashboard = () => (
    <div className="analytics-container">
      {/* Dashboard Header */}
      <div className="analytics-header">
        <h2>📊 Analytics Dashboard</h2>
        <div className="header-actions">
          <button onClick={fetchSessions} className="refresh-button">
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Key Performance Indicators (KPIs) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">💬</div>
          <div className="kpi-content">
            <h3>{formatNumber(metrics.totalSessions)}</h3>
            <p>Total Sessions</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🔢</div>
          <div className="kpi-content">
            <h3>{formatNumber(metrics.totalTokens)}</h3>
            <p>Total Tokens</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <h3>{metrics.averageTokensPerSession}</h3>
            <p>Avg Tokens/Session</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <h3>{metrics.topUsers.length}</h3>
            <p>Active Users</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-container">
          <PlaceholderBarChart 
            data={metrics.dailyActivity} 
            title="Daily Activity (Last 7 Days)"
          />
        </div>

        <div className="chart-container">
          <PlaceholderPieChart 
            data={metrics.sentimentDistribution} 
            title="Sentiment Distribution"
          />
        </div>
      </div>

      {/* Top Users Cards */}
      <div className="section-container">
        <h3 className="section-title">
          <span className="section-icon">👑</span>
          Top Users
        </h3>
        <div className="users-cards-grid">
          {metrics.topUsers.slice(0, 8).map((user, index) => (
            <div key={user.userId} className="user-card">
              <div className="user-rank">#{index + 1}</div>
              <div className="user-info">
                <div className="user-id">{user.userId}</div>
                <div className="user-stats">
                  <div className="stat">
                    <span className="stat-value">{user.sessions}</span>
                    <span className="stat-label">Sessions</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{formatNumber(user.tokens)}</span>
                    <span className="stat-label">Tokens</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{Math.round(user.tokens / user.sessions)}</span>
                    <span className="stat-label">Avg/Session</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions Cards */}
      <div className="section-container">
        <h3 className="section-title">
          <span className="section-icon">🕒</span>
          Recent Sessions
        </h3>
        <div className="sessions-cards-grid">
          {sessions.slice(0, 12).map((session) => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <div className="session-user">
                  <span className="user-avatar">👤</span>
                  <span className="user-name">{session.user_id}</span>
                </div>
                <div className={`sentiment-badge ${getSentimentClass(session.sentiment)}`}>
                  {getSentimentLabel(session.sentiment)}
                </div>
              </div>
              <div className="session-metrics">
                <div className="metric">
                  <span className="metric-icon">🔢</span>
                  <div className="metric-info">
                    <span className="metric-value">{session.tokens}</span>
                    <span className="metric-label">Tokens</span>
                  </div>
                </div>
                <div className="metric">
                  <span className="metric-icon">📊</span>
                  <div className="metric-info">
                    <span className="metric-value">{session.sentiment.toFixed(2)}</span>
                    <span className="metric-label">Sentiment</span>
                  </div>
                </div>
              </div>
              <div className="session-time">
                <span className="time-icon">⏱️</span>
                <span className="time-text">{new Date(session.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Token Usage Overview */}
      <div className="section-container">
        <h3 className="section-title">
          <span className="section-icon">💰</span>
          Token Usage Overview
        </h3>
        <div className="token-overview-grid">
          <div className="token-card total">
            <div className="token-header">
              <span className="token-icon">🔢</span>
              <span className="token-title">Total Tokens</span>
            </div>
            <div className="token-value">{formatNumber(metrics.totalTokens)}</div>
            <div className="token-subtitle">Across all sessions</div>
          </div>
          <div className="token-card average">
            <div className="token-header">
              <span className="token-icon">📈</span>
              <span className="token-title">Average per Session</span>
            </div>
            <div className="token-value">{metrics.averageTokensPerSession}</div>
            <div className="token-subtitle">Tokens per conversation</div>
          </div>
          <div className="token-card efficiency">
            <div className="token-header">
              <span className="token-icon">⚡</span>
              <span className="token-title">Efficiency Score</span>
            </div>
            <div className="token-value">{Math.round((metrics.totalTokens / metrics.totalSessions) * 100 / 500)}%</div>
            <div className="token-subtitle">Based on optimal usage</div>
          </div>
          <div className="token-card cost">
            <div className="token-header">
              <span className="token-icon">💵</span>
              <span className="token-title">Estimated Cost</span>
            </div>
            <div className="token-value">${((metrics.totalTokens / 1000) * 0.002).toFixed(2)}</div>
            <div className="token-subtitle">At $0.002 per 1K tokens</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="analytics-footer">
        <p>
          📊 Analytics Dashboard • Last updated: {new Date().toLocaleTimeString()} • 
          Built by Brian Letort
        </p>
      </div>
    </div>
  );

  /**
   * Get CSS class for sentiment display
   * 
   * Author: Brian Letort
   */
  const getSentimentClass = (sentiment) => {
    if (sentiment > 0.1) return 'positive';
    if (sentiment < -0.1) return 'negative';
    return 'neutral';
  };

  /**
   * Get human-readable sentiment label
   * 
   * Author: Brian Letort
   */
  const getSentimentLabel = (sentiment) => {
    if (sentiment > 0.1) return '😊 Positive';
    if (sentiment < -0.1) return '😞 Negative';
    return '😐 Neutral';
  };

  // ========================================
  // MAIN COMPONENT RENDER
  // ========================================
  
  // Conditional rendering based on component state
  if (loading) return renderLoading();
  if (error) return renderError();
  return renderDashboard();
};

export default Analytics; 