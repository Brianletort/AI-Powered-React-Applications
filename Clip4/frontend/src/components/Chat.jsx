import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';

/**
 * ChatApp Component - Modern Dark-Themed Chat Interface
 * Author: Brian Letort
 * Created: 2025
 * 
 * Modern, compact chat interface with dark theme design.
 */
const ChatApp = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  /**
   * Messages state - stores all chat messages
   * Each message contains: id, type, content, timestamp, tokens, sentiment
   */
  const [messages, setMessages] = useState([]);
  
  /**
   * Input value state - controlled input component
   */
  const [inputValue, setInputValue] = useState('');
  
  /**
   * Loading state - tracks API request status
   */
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * User ID state - unique identifier for each user session
   */
  const [userId, setUserId] = useState(null);
  
  /**
   * Messages end reference - for auto-scrolling
   */
  const messagesEndRef = useRef(null);

  /**
   * Show debugging mode toggle state - controls visibility of telemetry data
   */
  const [showMetrics, setShowMetrics] = useState(true);

  // ========================================
  // EFFECTS
  // ========================================
  
  /**
   * Initialize user ID on component mount
   */
  useEffect(() => {
    const storedUserId = localStorage.getItem('chat_user_id');
    
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chat_user_id', newUserId);
      setUserId(newUserId);
    }
  }, []);

  /**
   * Auto-scroll to bottom on new messages
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages]);

  // ========================================
  // HANDLERS
  // ========================================
  
  /**
   * Handle sending messages
   * POSTs { user_id, prompt } to /chat endpoint
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !userId) return;

    // Create user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // POST { user_id, prompt } to /chat via axios
      const response = await axios.post(API_ENDPOINTS.CHAT, {
        user_id: userId,
        prompt: userMessage.content
      });

      // Create assistant message with response, tokens, sentiment, and judgment
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        timestamp: new Date().toLocaleTimeString(),
        tokens: response.data.tokens,
        sentiment: response.data.sentiment,
        judgment: response.data.judgment
      };

      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Clear chat history
   */
  const clearChat = () => {
    setMessages([]);
  };

  /**
   * Format sentiment score for display
   */
  const formatSentiment = (score) => {
    if (score > 0.3) return { label: 'Positive', color: 'text-accent-400', icon: '😊' };
    if (score < -0.3) return { label: 'Negative', color: 'text-danger-400', icon: '😞' };
    return { label: 'Neutral', color: 'text-slate-400', icon: '😐' };
  };

  /**
   * Format evaluation score for display
   */
  const formatEvaluation = (score) => {
    if (score >= 5) return { label: 'Excellent', color: 'text-accent-400', icon: '⭐' };
    if (score >= 4) return { label: 'Good', color: 'text-primary-400', icon: '✅' };
    if (score >= 3) return { label: 'Average', color: 'text-yellow-400', icon: '📊' };
    if (score >= 2) return { label: 'Below Average', color: 'text-orange-400', icon: '⚠️' };
    return { label: 'Poor', color: 'text-danger-400', icon: '❌' };
  };

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col"> {/* Fixed height to prevent scrolling */}
      {/* Chat Header */}
      <div className="card p-4 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
              <p className="text-sm text-slate-400">User: {userId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
                         {/* Debugging Mode Toggle */}
             <div className="flex items-center space-x-2">
               <span className="text-sm text-slate-400">Debugging Mode</span>
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800 ${
                  showMetrics ? 'bg-primary-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    showMetrics ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Clear Chat Button */}
            <button 
              onClick={clearChat} 
              disabled={messages.length === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container - Flexible height */}
      <div className="card flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Welcome to AI Chat!</h3>
              <p className="text-slate-400 mb-4">Start a conversation by typing a message below.</p>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <span>Powered by</span>
                <span className="px-2 py-1 bg-primary-600/20 text-primary-300 rounded-md font-mono text-xs">GPT-4o</span>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
                  message.type === 'user' 
                    ? 'bg-primary-600 text-white' 
                    : message.type === 'error'
                    ? 'bg-danger-600/20 border border-danger-500/30 text-danger-200'
                    : 'bg-dark-700/50 border border-dark-600/50 text-slate-100'
                } rounded-2xl p-4 backdrop-blur-sm`}>
                  
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium opacity-75">
                      {message.type === 'user' ? 'You' : message.type === 'error' ? 'Error' : 'AI Assistant'}
                    </span>
                    <span className="text-xs opacity-60">{message.timestamp}</span>
                  </div>
                  
                  {/* Message Content */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  
                  {/* Assistant Message Telemetry */}
                  {message.type === 'assistant' && showMetrics && (
                    <div className="mt-3 pt-3 border-t border-dark-600/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                            <span>{message.tokens} tokens</span>
                          </span>
                          {message.sentiment !== undefined && (
                            <span className={`flex items-center space-x-1 ${formatSentiment(message.sentiment).color}`}>
                              <span>{formatSentiment(message.sentiment).icon}</span>
                              <span>{formatSentiment(message.sentiment).label}</span>
                              <span className="opacity-60">({message.sentiment.toFixed(2)})</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Judgment Display */}
                      {message.judgment && (
                        <div className="bg-dark-800/30 rounded-lg p-2 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-400">Response Quality</span>
                            <div className="flex items-center space-x-1">
                              <span className={`flex items-center space-x-1 ${formatEvaluation(message.judgment.score).color}`}>
                                <span>{formatEvaluation(message.judgment.score).icon}</span>
                                <span>{formatEvaluation(message.judgment.score).label}</span>
                                <span className="opacity-60">({message.judgment.score}/5)</span>
                              </span>
                              {message.judgment.hallucination_flag && (
                                <span className="ml-2 px-1 py-0.5 bg-danger-600/20 text-danger-300 rounded text-xs">
                                  ⚠️ Hallucination
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-slate-300 text-xs opacity-80 mb-1">
                            {message.judgment.rationale}
                          </div>
                          {message.judgment.tokens_used && (
                            <div className="text-slate-400 text-xs opacity-60">
                              Judgment tokens: {message.judgment.tokens_used}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-dark-700/50 border border-dark-600/50 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-sm text-slate-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area - Fixed at bottom */}
        <div className="border-t border-dark-700/50 p-4 bg-dark-800/30 backdrop-blur-sm">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={isLoading}
                rows={1}
                className="w-full bg-dark-700/50 border border-dark-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 h-11"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>User: {userId}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatApp; 