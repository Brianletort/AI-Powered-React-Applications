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

from fastapi import FastAPI, Depends, HTTPException
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

# ========================================
# CORS MIDDLEWARE CONFIGURATION
# ========================================
# Configure Cross-Origin Resource Sharing (CORS) for frontend communication
# This allows our React frontend to communicate with the FastAPI backend
# In production, you would restrict origins to your actual domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,    # Allow cookies and authentication headers
    allow_methods=["*"],       # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],       # Allow all headers
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
    - Database version information
    - Table existence verification
    - Record count statistics
    
    Useful for debugging database-related issues.
    
    Author: Brian Letort
    """
    try:
        from sqlalchemy import text
        from models import ChatLog
        
        # Test basic connection and get database version
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version()"))
            db_version = result.fetchone()[0]
            
            # Check if our main table exists
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'chat_logs'
            """))
            table_exists = result.fetchone() is not None
            
            # Count records in chat_logs table
            if table_exists:
                result = connection.execute(text("SELECT COUNT(*) FROM chat_logs"))
                record_count = result.fetchone()[0]
            else:
                record_count = 0
        
        return {
            "status": "success",
            "database_version": db_version,
            "chat_logs_table_exists": table_exists,
            "chat_logs_count": record_count,
            "database_url": os.getenv("DATABASE_URL", "not set"),
            "author": "Brian Letort"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "database_url": os.getenv("DATABASE_URL", "not set"),
            "author": "Brian Letort"
        }

# ========================================
# PYDANTIC MODELS FOR REQUEST/RESPONSE VALIDATION
# ========================================
# These models define the structure of our API requests and responses
# Pydantic provides automatic validation and serialization

class ChatRequest(BaseModel):
    """
    Request model for chat endpoint.
    
    Defines the structure of incoming chat requests.
    Pydantic automatically validates the request data.
    
    Author: Brian Letort
    """
    prompt: str
    user_id: str

class ChatResponse(BaseModel):
    """
    Response model for chat endpoint.
    
    Defines the structure of chat responses including telemetry data.
    This ensures consistent API responses and automatic documentation.
    
    Author: Brian Letort
    """
    response: str
    tokens_used: int
    sentiment: dict
    response_time_ms: int

class ChatSession(BaseModel):
    """
    Response model for individual chat session.
    
    Represents a single chat session with metadata.
    Used in the sessions endpoint for analytics.
    
    Author: Brian Letort
    """
    id: int
    user_id: str
    sentiment: float
    tokens: int
    created_at: str

class SessionsResponse(BaseModel):
    """
    Response model for sessions endpoint.
    
    Contains a list of chat sessions with pagination metadata.
    Demonstrates proper API response structure for list endpoints.
    
    Author: Brian Letort
    """
    sessions: list[ChatSession]
    total_count: int
    limit: int

# ========================================
# ANALYTICS ENDPOINTS
# ========================================

@app.get("/sessions", response_model=SessionsResponse)
async def get_chat_sessions(db: Session = Depends(get_db)):
    """
    Retrieve chat sessions for analytics dashboard.
    
    This endpoint demonstrates:
    - Database querying with SQLAlchemy ORM
    - Pagination and ordering best practices
    - Data transformation for API responses
    - Comprehensive error handling
    
    Returns the last 100 chat sessions ordered by creation date.
    
    Args:
        db (Session): Database session injected by FastAPI dependency injection
        
    Returns:
        SessionsResponse: Structured response with sessions and metadata
        
    Raises:
        HTTPException: If database query fails
        
    Author: Brian Letort
    """
    try:
        # Query the database for recent chat logs
        # Using SQLAlchemy ORM for type-safe database operations
        chat_logs = db.query(ChatLog).order_by(
            ChatLog.created_at.desc()  # Most recent first
        ).limit(100).all()  # Limit to 100 records for performance
        
        # Transform database objects into API response format
        # This separation allows for different internal and external representations
        sessions = []
        for log in chat_logs:
            session = ChatSession(
                id=log.id,
                user_id=log.user_id,
                sentiment=log.sentiment,
                tokens=log.tokens,
                created_at=log.created_at.isoformat()  # ISO format for frontend
            )
            sessions.append(session)
        
        # Log successful operation for monitoring
        logger.info(f"Retrieved {len(sessions)} chat sessions from database")
        
        # Return structured response with metadata
        return SessionsResponse(
            sessions=sessions,
            total_count=len(sessions),
            limit=100
        )
        
    except Exception as e:
        # Log error for debugging
        logger.error(f"Error retrieving chat sessions: {str(e)}")
        
        # Return user-friendly error message
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving chat sessions: {str(e)}"
        )

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
# MAIN CHAT ENDPOINT
# ========================================

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Main chat endpoint that orchestrates the complete AI interaction.
    
    This endpoint demonstrates the complete flow of a modern AI application:
    1. Input validation and security checks
    2. External API integration (OpenAI)
    3. Data processing and analysis (sentiment)
    4. Database logging for analytics
    5. Structured response with telemetry
    
    The endpoint includes comprehensive error handling, performance monitoring,
    and detailed logging for production use.
    
    Args:
        request (ChatRequest): User prompt and identifier
        db (Session): Database session for logging telemetry
        
    Returns:
        ChatResponse: AI response with comprehensive telemetry data
        
    Raises:
        HTTPException: If any step in the process fails
        
    Author: Brian Letort
    """
    # Record start time for performance monitoring
    start_time = time.time()
    
    # Validate OpenAI API key configuration
    # This prevents runtime errors and provides clear error messages
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        )
    
    try:
        # Log the start of processing for debugging and monitoring
        logger.info(f"Processing chat request for user: {request.user_id}")
        
        # Step 1: Call OpenAI API to generate AI response
        openai_result = call_openai(request.prompt)
        ai_response = openai_result["response"]
        token_usage = openai_result["tokens"]
        
        # Step 2: Analyze sentiment of AI response
        # This helps monitor the emotional tone of AI-generated content
        sentiment_result = analyze_sentiment(ai_response)
        
        # Step 3: Calculate response time for performance monitoring
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Step 4: Save interaction to database for analytics
        save_chat_log(
            user_id=request.user_id,
            prompt=request.prompt,
            response=ai_response,
            tokens=token_usage["total_tokens"],
            sentiment=sentiment_result["polarity"],
            db=db
        )
        
        # Log successful completion with key metrics
        logger.info(f"Chat request completed successfully. "
                   f"Tokens used: {token_usage['total_tokens']}, "
                   f"Response time: {response_time_ms}ms, "
                   f"Sentiment: {sentiment_result['description']}")
        
        # Return structured response with all telemetry data
        return ChatResponse(
            response=ai_response,
            tokens_used=token_usage["total_tokens"],
            sentiment=sentiment_result,
            response_time_ms=response_time_ms
        )
        
    except Exception as e:
        # Log error for debugging
        logger.error(f"Error processing chat request: {str(e)}")
        
        # Return user-friendly error message
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
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

# ========================================
# APPLICATION ENTRY POINT
# ========================================

if __name__ == "__main__":
    # Run the application directly (for development)
    # In production, use a proper ASGI server like Gunicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 