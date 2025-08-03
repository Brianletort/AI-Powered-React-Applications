import React, { useState } from 'react';
import ChatApp from './components/Chat';
import SessionsDashboard from './components/SessionsDashboard';
import './App.css';

/**
 * AI Chat with Telemetry - Main Application Component
 * Author: Brian Letort
 * Created: 2025
 * 
 * Modern dark-themed AI chat application with comprehensive analytics.
 * Features a sleek, professional design with minimal scrolling and 
 * intuitive navigation.
 */
function App() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  /**
   * Active tab state - controls which view is displayed
   * 'chat' for the main chat interface, 'analytics' for the dashboard
   * Demonstrates simple state-based navigation in React
   */
  const [activeTab, setActiveTab] = useState('chat');

  // ========================================
  // EVENT HANDLERS
  // ========================================
  
  /**
   * Handle tab switching
   * Updates the active tab state to switch between views
   * 
   * @param {string} tab - The tab to switch to ('chat' or 'analytics')
   * 
   * Author: Brian Letort
   */
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    console.log(`🔄 Switched to ${tab} tab`);
  };

  // ========================================
  // COMPONENT RENDER
  // ========================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Modern Compact Header */}
      <header className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AI Chat</h1>
                <p className="text-xs text-slate-400 -mt-1">with Telemetry</p>
              </div>
            </div>
            
            {/* Modern Tab Navigation */}
            <nav className="flex items-center space-x-1 bg-dark-800/50 p-1 rounded-lg backdrop-blur-sm border border-white/10">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'chat'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => handleTabSwitch('chat')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>Chat</span>
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'analytics'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => handleTabSwitch('analytics')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <span>Analytics</span>
              </button>
            </nav>

            {/* Status Indicator */}
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - No excessive height that causes scrolling */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' && (
          <div className="animate-fade-in">
            <ChatApp />
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in">
            <SessionsDashboard />
          </div>
        )}
      </main>

      {/* Compact Footer */}
      <footer className="border-t border-white/10 bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              Built by <span className="text-primary-400 font-medium">Brian Letort</span> • {new Date().getFullYear()}
            </p>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary-600/20 text-primary-300 border border-primary-500/30">
                React + FastAPI
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-accent-600/20 text-accent-300 border border-accent-500/30">
                OpenAI GPT-4o
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 