import React, { useState } from 'react';
import Chat from './components/Chat';
import Analytics from './components/Analytics';
import './App.css';

/**
 * AI Chat with Telemetry - Main Application Component
 * Author: Brian Letort
 * Created: 2025
 * 
 * This is the root component of the AI Chat application, demonstrating a complete
 * full-stack educational project with modern web development practices.
 * 
 * Application Features:
 * - Interactive AI chat interface with OpenAI GPT-4o integration
 * - Comprehensive analytics dashboard with data visualization
 * - Real-time telemetry tracking and sentiment analysis
 * - Professional sidebar layout with responsive design
 * - Docker containerization for easy deployment
 * 
 * Technical Stack:
 * - Frontend: React 18 with functional components and hooks
 * - Backend: FastAPI with SQLAlchemy ORM
 * - Database: PostgreSQL for telemetry storage
 * - AI Integration: OpenAI GPT-4o API
 * - Deployment: Docker and Docker Compose
 * 
 * Architecture:
 * - Component-based React architecture
 * - Sidebar navigation layout
 * - State management with React hooks
 * - RESTful API communication with Axios
 * - Responsive CSS Grid and Flexbox layouts
 * - Environment-based configuration
 * 
 * Author: Brian Letort
 * License: MIT
 */
function App() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  /**
   * Active view state - controls which component is displayed in main content area
   * 'chat' for the main chat interface, 'analytics' for the dashboard
   * Uses sidebar navigation instead of tab-based navigation
   */
  const [activeView, setActiveView] = useState('chat');

  // ========================================
  // EVENT HANDLERS
  // ========================================
  
  /**
   * Handle navigation between views
   * Updates the active view state to switch between chat and analytics
   * 
   * @param {string} view - The view to switch to ('chat' or 'analytics')
   * 
   * Author: Brian Letort
   */
  const handleViewChange = (view) => {
    setActiveView(view);
    console.log(`🔄 Switched to ${view} view`);
  };

  // ========================================
  // COMPONENT RENDER
  // ========================================
  
  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🤖</div>
            <h2>AI Chat</h2>
          </div>
          <div className="session-info">
            <div className="session-badge">
              <span className="session-icon">🤖</span>
              <div className="session-details">
                <span className="session-title">AI Chat Agent</span>
                <span className="session-id">Session: {Math.random().toString(36).substr(2, 12)}</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === 'chat' ? 'active' : ''}`}
            onClick={() => handleViewChange('chat')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-text">Chat</span>
          </button>
          <button
            className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => handleViewChange('analytics')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Analytics</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="author-credit">
            <span className="author-text">Built by Brian Letort</span>
            <span className="year">{new Date().getFullYear()}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* Conditional rendering based on active view */}
          {activeView === 'chat' && <Chat />}
          {activeView === 'analytics' && <Analytics />}
        </div>
      </main>
    </div>
  );
}

export default App; 