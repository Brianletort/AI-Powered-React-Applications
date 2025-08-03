"""
AI Chat with Telemetry - FastAPI Backend
Author: Brian Letort
Created: 2025

This is the main application entry point for the AI Chat application.
A full-stack educational project demonstrating modern web development practices
with FastAPI, React, PostgreSQL, and OpenAI integration.

Key Features:
- RESTful API with FastAPI framework
- OpenAI GPT-4o integration for AI responses
- PostgreSQL database for telemetry storage
- Comprehensive error handling and logging
- CORS configuration for frontend communication
- Docker containerization for easy deployment

Architecture:
- FastAPI backend with SQLAlchemy ORM
- Pydantic models for request/response validation
- Structured logging for monitoring and debugging
- Environment-based configuration
- Health check endpoints for system monitoring

Author: Brian Letort
License: MIT
"""

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
import os
import logging
import time
import openai
from textblob import TextBlob
from typing import Optional
from math import ceil

# ========================================
# LOGGING CONFIGURATION
# ========================================
# Configure structured logging for production monitoring
# This helps with debugging and system monitoring in production environments
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ========================================
# MODULE IMPORTS
# ========================================
# Import our custom modules for database, models, and routes
# This demonstrates proper code organization and separation of concerns
from database import engine, get_db
from models import Base, ChatLog
from routes import chat_router

# ========================================
# ENVIRONMENT CONFIGURATION
# ========================================
# Load environment variables from .env file
# This is a security best practice for managing sensitive configuration
load_dotenv()

# ========================================
# FASTAPI APPLICATION SETUP
# ========================================
# Create the main FastAPI application instance with comprehensive metadata
# This metadata appears in the automatically generated API documentation
app = FastAPI(
    title="AI Chat with Telemetry",
    description="Educational full-stack AI chat application with comprehensive telemetry tracking. Built by Brian Letort to demonstrate modern web development practices.",
    version="1.0.0",
    docs_url="/docs",        # Swagger UI documentation endpoint
    redoc_url="/redoc",      # ReDoc documentation endpoint
    openapi_url="/openapi.json"  # OpenAPI schema endpoint
)

# CORS middleware must be added immediately after app creation
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ========================================
# ROUTER REGISTRATION
# ========================================
# Include our chat routes with API versioning
# This demonstrates proper API versioning and route organization
app.include_router(chat_router, prefix="/api/v1")

# ========================================
# APPLICATION LIFECYCLE EVENTS
# ========================================

@app.on_event("startup")
async def startup_event():
    """
    Application startup event handler.
    
    This function runs when the FastAPI application starts up.
    It initializes the database and performs system health checks.
    
    Author: Brian Letort
    """
    try:
        logger.info("Starting AI Chat with Telemetry application...")
        
        # Create all database tables based on our SQLAlchemy models
        # This ensures the database schema is up-to-date on startup
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
        
        # Test database connection to ensure everything is working
        # This helps catch database connection issues early
        from sqlalchemy import text
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info("✅ Database connection test successful")
            
        logger.info("🚀 Application startup completed successfully")
            
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        raise e

# ========================================
# HEALTH CHECK ENDPOINTS
# ========================================
# These endpoints help with monitoring and debugging the application

@app.get("/")
async def root():
    """
    Basic health check endpoint.
    
    Returns basic application information and status.
    Useful for load balancers and monitoring systems.
    
    Author: Brian Letort
    """
    return {
        "message": "AI Chat with Telemetry API",
        "status": "running",
        "version": "1.0.0",
        "author": "Brian Letort"
    }

@app.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint.
    
    Performs detailed system checks including:
    - Database connectivity
    - OpenAI API configuration
    - Environment variable validation
    
    Returns detailed status information for monitoring systems.
    
    Author: Brian Letort
    """
    try:
        # Test database connection
        from sqlalchemy import text
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Check OpenAI API key configuration
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_status = "configured" if openai_key else "not configured"
    
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "openai": openai_status,
        "database_url": os.getenv("DATABASE_URL", "not set"),
        "author": "Brian Letort"
    }

@app.get("/db-test")
async def test_database():
    """
    Database diagnostic endpoint.
    
    Provides detailed information about the database state including:
    - Table existence and structure
    - Recent chat logs (last 5 entries)
    - Database statistics
    
    Useful for debugging database-related issues.
    
    Author: Brian Letort
    """
    try:
        db = next(get_db())
        
        # Get table info
        from sqlalchemy import text
        result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [row[0] for row in result.fetchall()]
        
        # Get recent chat logs
        recent_logs = db.query(ChatLog).order_by(ChatLog.created_at.desc()).limit(5).all()
        
        # Get total count
        total_count = db.query(ChatLog).count()
        
        return {
            "tables": tables,
            "total_chat_logs": total_count,
            "recent_logs": [
                {
                    "id": str(log.id),
                    "user_id": log.user_id,
                    "tokens": log.usage_tokens,
                    "sentiment": log.sentiment_score,
                    "created_at": log.created_at.isoformat()
                } for log in recent_logs
            ],
            "author": "Brian Letort"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database test failed: {str(e)}")

# ========================================
# DATA MODELS
# ========================================
# Pydantic models for request/response validation and API documentation

class SessionData(BaseModel):
    """
    Response model for individual session data point.
    
    Contains the essential fields for analytics visualization including judgment metadata.
    
    Author: Brian Letort
    """
    ts: str      # timestamp
    tokens: int  # token usage
    sentiment: float  # sentiment score
    judgment_score: int = None  # quality score 1-5
    judgment_rationale: str = None  # explanation of score
    hallucination_flag: bool = None  # whether response contains hallucinations

class PaginatedSessionsResponse(BaseModel):
    sessions: list[SessionData]
    total_count: int
    total_pages: int
    page: int
    limit: int
    has_next: bool
    has_previous: bool

# ========================================
# ANALYTICS ENDPOINTS
# ========================================
# These endpoints provide data for the analytics dashboard

@app.get("/sessions", response_model=PaginatedSessionsResponse)
async def get_chat_sessions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Retrieve chat sessions for analytics dashboard with pagination.
    Args:
        page (int): Page number (1-based)
        limit (int): Number of records per page
        db (Session): Database session dependency
    Returns:
        PaginatedSessionsResponse: Paginated session data and metadata
    """
    try:
        total_count = db.query(ChatLog).count()
        total_pages = ceil(total_count / limit) if total_count > 0 else 1
        offset = (page - 1) * limit
        chat_logs = db.query(ChatLog).order_by(ChatLog.created_at.desc()).offset(offset).limit(limit).all()
        sessions = [
            SessionData(
                ts=log.created_at.isoformat(),
                tokens=log.usage_tokens or 0,
                sentiment=log.sentiment_score or 0.0,
                judgment_score=log.judgment_score,
                judgment_rationale=log.judgment_rationale,
                hallucination_flag=log.hallucination_flag
            )
            for log in chat_logs
        ]
        sessions.reverse()  # oldest→newest
        return PaginatedSessionsResponse(
            sessions=sessions,
            total_count=total_count,
            total_pages=total_pages,
            page=page,
            limit=limit,
            has_next=page < total_pages,
            has_previous=page > 1
        )
    except Exception as e:
        logger.error(f"Error retrieving chat sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chat sessions: {str(e)}")

# ========================================
# OPENAI INTEGRATION HELPER FUNCTIONS
# ========================================

def call_openai(prompt: str) -> dict:
    """
    Helper function to call OpenAI's GPT-4o model.
    
    This function encapsulates the OpenAI API interaction and demonstrates:
    - Proper API configuration and error handling
    - Token usage tracking for cost monitoring
    - Response parsing and data extraction
    
    The function uses the older OpenAI API syntax (v0.28) for compatibility.
    
    Args:
        prompt (str): The user's input prompt to send to the AI
        
    Returns:
        dict: Contains the AI response text and token usage statistics
        
    Raises:
        Exception: If OpenAI API call fails
        
    Author: Brian Letort
    """
    # Configure OpenAI API with environment variable
    # Using the older API syntax for compatibility with openai v0.28
    import openai
    openai.api_key = os.getenv("OPENAI_API_KEY")
    
    # Make the API call with specific parameters
    # These parameters control the AI's behavior and response characteristics
    response = openai.ChatCompletion.create(
        model="gpt-4o",  # Latest GPT-4 model for best performance
        messages=[
            {"role": "user", "content": prompt}  # Simple user message
        ],
        max_tokens=1000,  # Limit response length to control costs
        temperature=0.7   # Balanced creativity vs consistency
    )
    
    # Extract the AI's response text
    ai_response = response.choices[0].message.content
    
    # Extract token usage for cost tracking and analytics
    # This is crucial for monitoring API usage and costs
    token_usage = {
        "prompt_tokens": response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens
    }
    
    return {
        "response": ai_response,
        "tokens": token_usage
    }

def analyze_sentiment(text: str) -> dict:
    """
    Analyze sentiment of AI-generated text using TextBlob.
    
    This function demonstrates:
    - Natural language processing with TextBlob
    - Sentiment analysis for content monitoring
    - Data transformation for user-friendly output
    
    Sentiment analysis helps understand the emotional tone of AI responses,
    which is valuable for content moderation and user experience optimization.
    
    Args:
        text (str): The text to analyze (typically AI response)
        
    Returns:
        dict: Sentiment analysis results with polarity, subjectivity, and description
        
    Author: Brian Letort
    """
    # Create TextBlob object for natural language processing
    blob = TextBlob(text)
    
    # Extract numerical sentiment scores
    sentiment_polarity = blob.sentiment.polarity      # -1 (negative) to 1 (positive)
    sentiment_subjectivity = blob.sentiment.subjectivity  # 0 (objective) to 1 (subjective)
    
    # Convert numerical score to human-readable description
    sentiment_description = _get_sentiment_description(sentiment_polarity)
    
    return {
        "polarity": sentiment_polarity,
        "subjectivity": sentiment_subjectivity,
        "description": sentiment_description
    }

def save_chat_log(user_id: str, prompt: str, response: str, tokens: int, sentiment: float, db: Session) -> None:
    """
    Save chat interaction data to database for analytics.
    
    This function demonstrates:
    - Database record creation with SQLAlchemy ORM
    - Transaction management for data consistency
    - Telemetry data collection for analytics
    
    All chat interactions are logged for analytics, debugging, and
    user experience improvement.
    
    Args:
        user_id (str): Unique identifier for the user
        prompt (str): Original user prompt
        response (str): AI-generated response
        tokens (int): Total tokens used in the interaction
        sentiment (float): Sentiment polarity score
        db (Session): Database session for the transaction
        
    Author: Brian Letort
    """
    # Create new database record using SQLAlchemy ORM
    chat_log = ChatLog(
        user_id=user_id,
        prompt=prompt,
        response=response,
        tokens=tokens,
        sentiment=sentiment
        # created_at is automatically set by the database model
    )
    
    # Add record to database session and commit
    db.add(chat_log)
    db.commit()
    
    # Log successful operation for monitoring
    logger.info(f"Chat log saved to database for user: {user_id}")

# ========================================
# MAIN APPLICATION ENTRY POINT
# ========================================

if __name__ == "__main__":
    """
    Main application entry point.
    
    Runs the FastAPI application using Uvicorn ASGI server.
    This is used for development; in production, use a proper ASGI server setup.
    
    Author: Brian Letort
    """
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )

# ========================================
# UTILITY FUNCTIONS
# ========================================

def _get_sentiment_description(polarity: float) -> str:
    """
    Convert numerical sentiment polarity to human-readable description.
    
    This helper function makes sentiment analysis results more user-friendly
    by converting numerical scores to descriptive text.
    
    Args:
        polarity (float): Sentiment polarity score (-1 to 1)
        
    Returns:
        str: Human-readable sentiment description
        
    Author: Brian Letort
    """
    if polarity > 0.1:
        return "Positive"
    elif polarity < -0.1:
        return "Negative"
    else:
        return "Neutral" 