"""
SQLAlchemy models for AI Chat with Telemetry.

This module contains all database models for the application.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# Create base class for models
Base = declarative_base()

class ChatLog(Base):
    """
    Database model for storing chat session logs.
    
    This model captures essential information about each chat interaction
    including user prompts, AI responses, token usage, and sentiment analysis.
    """
    __tablename__ = "chat_logs"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # User identification
    user_id = Column(String(255), index=True, nullable=False)
    
    # Chat content
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    
    # Token usage tracking
    tokens = Column(Integer, nullable=False)
    
    # Sentiment analysis results
    sentiment = Column(Float, nullable=False)  # Sentiment polarity (-1 to 1)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        """String representation of the ChatLog model."""
        return f"<ChatLog(id={self.id}, user_id='{self.user_id}', tokens={self.tokens})>" 