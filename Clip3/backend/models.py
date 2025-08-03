"""
SQLAlchemy models for AI Chat with Telemetry.

This module contains all database models for the application.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

# Create base class for models
Base = declarative_base()

class ChatLog(Base):
    """
    Database model for storing chat session logs.
    
    This model captures essential information about each chat interaction
    including user prompts, AI responses, token usage, sentiment analysis,
    and LLM evaluation of response quality.
    """
    __tablename__ = "chat_logs"
    
    # Primary key - UUID to match PostgreSQL DDL
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # User identification
    user_id = Column(Text, index=True, nullable=False)
    
    # Chat content
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    
    # Token usage tracking
    usage_tokens = Column(Integer, nullable=True)
    
    # Sentiment analysis results
    sentiment_score = Column(Float, nullable=True)  # Sentiment polarity (-1 to 1)
    
    # LLM Judgment fields
    judgment_score = Column(Integer, nullable=True)  # 1-5 rating
    judgment_rationale = Column(Text, nullable=True)  # Explanation of the score
    hallucination_flag = Column(Boolean, nullable=True)  # Whether response contains hallucinations
    judgment_tokens = Column(Integer, nullable=True)  # Tokens used for judgment
    judgment_data = Column(JSON, nullable=True)  # Full judgment response as JSON
    
    # Timestamp with timezone
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        """String representation of the ChatLog model."""
        return f"<ChatLog(id={self.id}, user_id='{self.user_id}', usage_tokens={self.usage_tokens})>" 