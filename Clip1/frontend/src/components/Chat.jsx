import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import './Chat.css';

/**
 * AI Chat Component - Main chat interface
 * Author: Brian Letort
 * Created: 2025
 * 
 * This component serves as the primary user interface for the AI chat application.
 * It demonstrates modern React development patterns and best practices including:
 * 
 * Key Features:
 * - Real-time chat interface with AI responses
 * - Persistent user identification using localStorage
 * - Comprehensive error handling and user feedback
 * - Auto-scrolling chat history
 * - Loading states and optimistic UI updates
 * - Telemetry display for educational purposes
 * 
 * Technical Implementation:
 * - React hooks for state management (useState, useEffect, useRef)
 * - Axios for HTTP communication with FastAPI backend
 * - CSS modules for component styling
 * - Local storage for user session persistence
 * - Responsive design principles
 * 
 * Author: Brian Letort
 * License: MIT
 */
const Chat = () => {
  // ========================================
  // STATE MANAGEMENT WITH REACT HOOKS
  // ========================================
  // Modern React uses hooks for state management instead of class components
  // This approach is more functional and easier to test and maintain
  
  /**
   * Messages state - stores all chat messages in chronological order
   * Each message object contains:
   * - id: unique identifier (timestamp-based)
   * - type: 'user', 'assistant', or 'error'
   * - content: the actual message text
   * - timestamp: human-readable time string
   * - telemetry: optional metadata for assistant messages
   */
  const [messages, setMessages] = useState([]);
  
  /**
   * Input value state - controlled component pattern
   * React best practice: always use controlled components for form inputs
   * This ensures the component state is the single source of truth
   */
  const [inputValue, setInputValue] = useState('');
  
  /**
   * Loading state - tracks API request status
   * Used to show loading indicators and prevent duplicate requests
   * Essential for good user experience during async operations
   */
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * User ID state - unique identifier for each user session
   * Persisted in localStorage to maintain identity across browser sessions
   * Used for backend analytics and user tracking
   */
  const [userId, setUserId] = useState(null);
  
  /**
   * Messages end reference - for auto-scrolling functionality
   * useRef creates a mutable reference that persists across re-renders
   * This is used to scroll to the bottom when new messages arrive
   */
  const messagesEndRef = useRef(null);

  // ========================================
  // SIDE EFFECTS WITH USEEFFECT HOOKS
  // ========================================
  // useEffect hooks handle side effects in functional components
  // They replace componentDidMount, componentDidUpdate, etc. from class components
  
  /**
   * User initialization effect
   * Runs once when component mounts (empty dependency array)
   * 
   * This effect:
   * 1. Checks for existing user ID in localStorage
   * 2. Generates new user ID if none exists
   * 3. Persists user ID for future sessions
   * 
   * Author: Brian Letort
   */
  useEffect(() => {
    // Check browser's localStorage for existing user session
    // localStorage persists data even after browser restart
    const storedUserId = localStorage.getItem('chat_user_id');
    
    if (storedUserId) {
      // Returning user - restore their ID
      setUserId(storedUserId);
      console.log('👤 Restored user session:', storedUserId);
    } else {
      // New user - generate unique identifier
      // Using timestamp + random string for uniqueness
      const newUserId = 'user_' + Math.random().toString(36).substr(2, 9);
      
      // Persist the new user ID for future visits
      localStorage.setItem('chat_user_id', newUserId);
      setUserId(newUserId);
      console.log('👤 Created new user session:', newUserId);
    }
  }, []); // Empty dependency array = run only on component mount

  /**
   * Auto-scroll effect
   * Runs every time the messages array changes
   * 
   * This effect automatically scrolls to the bottom of the chat
   * when new messages are added, ensuring users see the latest content
   * 
   * Author: Brian Letort
   */
  useEffect(() => {
    // Scroll to bottom of chat container
    // Optional chaining (?.) prevents errors if ref is null
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',  // Smooth scrolling animation
      block: 'end'        // Scroll to bottom of element
    });
  }, [messages]); // Dependency on messages = run when messages change

  // ========================================
  // HTTP COMMUNICATION AND API INTEGRATION
  // ========================================
  
  /**
   * Main message sending function
   * 
   * This function orchestrates the complete chat interaction:
   * 1. Input validation and UI state management
   * 2. Optimistic UI updates (immediate user message display)
   * 3. HTTP request to FastAPI backend
   * 4. Response processing and error handling
   * 5. UI state cleanup and final updates
   * 
   * Demonstrates modern async/await patterns and comprehensive error handling
   * 
   * Author: Brian Letort
   */
  const handleSendMessage = async () => {
    // ========================================
    // STEP 1: INPUT VALIDATION AND GUARDS
    // ========================================
    
    // Prevent sending empty messages or duplicate requests
    if (!inputValue.trim() || isLoading) {
      console.log('⚠️ Message send blocked:', { 
        emptyInput: !inputValue.trim(), 
        isLoading 
      });
      return;
    }

    // ========================================
    // STEP 2: CREATE USER MESSAGE OBJECT
    // ========================================
    
    // Create structured message object with all necessary metadata
    const userMessage = {
      id: Date.now(),                           // Unique timestamp-based ID
      type: 'user',                            // Message type for styling
      content: inputValue.trim(),              // Clean user input
      timestamp: new Date().toLocaleTimeString() // Human-readable time
    };

    console.log('📝 User message created:', userMessage);

    // ========================================
    // STEP 3: OPTIMISTIC UI UPDATE
    // ========================================
    
    // Add user message immediately for instant feedback
    // This improves perceived performance by showing the message before API response
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and show loading state
    setInputValue('');    // Clear the input field
    setIsLoading(true);   // Show loading indicator

    // ========================================
    // STEP 4: API REQUEST TO BACKEND
    // ========================================
    
    try {
      // Log API request details for debugging
      console.log('🌐 Making API request to:', API_ENDPOINTS.CHAT);
      console.log('📤 Request payload:', { 
        prompt: userMessage.content, 
        user_id: userId 
      });
      
      // Send POST request to FastAPI backend
      // Using axios for HTTP communication with automatic JSON handling
      const response = await axios.post(API_ENDPOINTS.CHAT, {
        prompt: userMessage.content,  // User's message
        user_id: userId              // Session identifier
      });
      
      console.log('✅ API response received:', response.data);

      // ========================================
      // STEP 5: PROCESS SUCCESSFUL RESPONSE
      // ========================================
      
      // Create assistant message with comprehensive metadata
      const assistantMessage = {
        id: Date.now() + 1,                    // Unique ID (offset to avoid collision)
        type: 'assistant',                     // Message type for styling
        content: response.data.response,       // AI-generated response
        timestamp: new Date().toLocaleTimeString(),
        // Include telemetry data for educational transparency
        telemetry: {
          tokens: response.data.tokens_used,           // Token usage for cost tracking
          responseTime: response.data.response_time_ms, // Performance metrics
          sentiment: response.data.sentiment           // Sentiment analysis results
        }
      };

      console.log('🤖 Assistant message created:', assistantMessage);

      // Add assistant response to chat history
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      // ========================================
      // STEP 6: COMPREHENSIVE ERROR HANDLING
      // ========================================
      
      // Log detailed error information for debugging
      console.error('❌ API request failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      
      // Create user-friendly error message
      // In production, you might want to show different messages based on error type
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      };

      // Add error message to chat
      setMessages(prev => [...prev, errorMessage]);
      
      // Optional: Show more specific error messages based on error type
      if (error.response?.status === 500) {
        console.log('🔧 Server error - check backend logs');
      } else if (error.code === 'NETWORK_ERROR') {
        console.log('🌐 Network error - check connectivity');
      }

    } finally {
      // ========================================
      // STEP 7: CLEANUP (ALWAYS EXECUTED)
      // ========================================
      
      // Reset loading state regardless of success or failure
      // This ensures the UI returns to normal state
      setIsLoading(false);
      console.log('🔄 Loading state reset');
    }
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================
  
  /**
   * Handle Enter key press in input field
   * Provides keyboard shortcut for sending messages
   * 
   * Author: Brian Letort
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();  // Prevent default form submission
      handleSendMessage();
    }
  };

  /**
   * Clear chat history
   * Resets the conversation while preserving user session
   * 
   * Author: Brian Letort
   */
  const clearChat = () => {
    setMessages([]);
    console.log('🗑️ Chat history cleared');
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  
  /**
   * Format telemetry data for display
   * Converts technical metrics into user-friendly format
   * 
   * Author: Brian Letort
   */
  const formatTelemetry = (telemetry) => {
    if (!telemetry) return null;
    
    return (
      <div className="telemetry-info">
        <small>
          📊 Tokens: {telemetry.tokens} | 
          ⏱️ Response: {telemetry.responseTime}ms | 
          😊 Sentiment: {telemetry.sentiment.description}
        </small>
      </div>
    );
  };

  // ========================================
  // COMPONENT RENDER
  // ========================================
  
  return (
    <div className="chat-container">
      {/* Header with branding and controls */}
      <div className="chat-header">
        <h2>AI Chat Assistant</h2>
        <div className="header-info">
          <span className="user-id">User: {userId}</span>
          <button 
            onClick={clearChat} 
            className="clear-button"
            disabled={messages.length === 0}
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages display area */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to AI Chat!</h3>
            <p>Start a conversation by typing a message below.</p>
            <p><small>Built by Brian Letort</small></p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-header">
                <span className="message-type">
                  {message.type === 'user' ? '👤 You' : 
                   message.type === 'assistant' ? '🤖 AI Assistant' : 
                   '⚠️ Error'}
                </span>
                <span className="message-time">{message.timestamp}</span>
              </div>
              <div className="message-content">
                {message.content}
              </div>
              {/* Show telemetry data for assistant messages */}
              {message.telemetry && formatTelemetry(message.telemetry)}
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-header">
              <span className="message-type">🤖 AI Assistant</span>
              <span className="message-time">thinking...</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="message-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
        <div className="input-help">
          <small>Press Enter to send • Built with React and FastAPI by Brian Letort</small>
        </div>
      </div>
    </div>
  );
};

export default Chat; 