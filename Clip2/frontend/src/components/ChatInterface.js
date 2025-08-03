import React, { useState } from 'react';
import axios from 'axios';
import './ChatInterface.css';

const ChatInterface = ({ userId }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    setResponse('');
    setTelemetry(null);

    try {
      const result = await axios.post('/api/v1/chat', {
        prompt: prompt,
        user_id: userId
      });

      setResponse(result.data.response);
      setTelemetry({
        tokens_used: result.data.tokens_used,
        sentiment: result.data.sentiment,
        response_time_ms: result.data.response_time_ms
      });
      
      // Clear the prompt after successful submission
      setPrompt('');
      
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.response?.data?.detail || 'An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your message here..."
            disabled={loading}
            rows="3"
            className="prompt-input"
          />
          <button 
            type="submit" 
            disabled={loading || !prompt.trim()}
            className="submit-button"
          >
            {loading ? '🤔 Thinking...' : '💬 Send'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {response && (
        <div className="response-section">
          <div className="response-content">
            <h3>🤖 AI Response:</h3>
            <div className="response-text">{response}</div>
          </div>
          
          {telemetry && (
            <div className="telemetry-section">
              <h4>📊 Telemetry Data:</h4>
              <div className="telemetry-grid">
                <div className="telemetry-item">
                  <span className="label">Tokens Used:</span>
                  <span className="value">{telemetry.tokens_used}</span>
                </div>
                <div className="telemetry-item">
                  <span className="label">Response Time:</span>
                  <span className="value">{telemetry.response_time_ms}ms</span>
                </div>
                <div className="telemetry-item">
                  <span className="label">Sentiment:</span>
                  <span className="value">
                    {telemetry.sentiment.description} 
                    ({telemetry.sentiment.polarity.toFixed(2)})
                  </span>
                </div>
                <div className="telemetry-item">
                  <span className="label">Subjectivity:</span>
                  <span className="value">{telemetry.sentiment.subjectivity.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInterface; 