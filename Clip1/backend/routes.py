"""
API routes for the AI Chat with Telemetry application.

This module contains the chat endpoint that handles user prompts,
calls OpenAI's GPT model, analyzes sentiment, and logs telemetry data.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import time
import openai
from textblob import TextBlob
from dotenv import load_dotenv
import os

from database import get_db
from models import ChatLog

# Load environment variables
load_dotenv()

# Configure OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

# Create router
chat_router = APIRouter()

class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    prompt: str
    user_id: str

class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    tokens_used: int
    sentiment: dict
    response_time_ms: int

@chat_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Main chat endpoint that processes user prompts and returns AI responses.
    
    This endpoint:
    1. Accepts a user prompt and user ID
    2. Calls OpenAI's GPT-4o model
    3. Analyzes the response sentiment using TextBlob
    4. Logs comprehensive telemetry data to the database
    5. Returns the AI response with metadata
    
    Args:
        request (ChatRequest): Contains the user prompt and user ID
        db (Session): Database session for logging telemetry
        
    Returns:
        ChatResponse: AI response with telemetry metadata
        
    Raises:
        HTTPException: If OpenAI API call fails or API key is missing
    """
    start_time = time.time()
    
    # Validate OpenAI API key
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": request.prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        # Extract response content and token usage
        ai_response = response.choices[0].message.content
        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        total_tokens = response.usage.total_tokens
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Analyze sentiment using TextBlob
        blob = TextBlob(ai_response)
        sentiment_polarity = blob.sentiment.polarity  # -1 (negative) to 1 (positive)
        sentiment_subjectivity = blob.sentiment.subjectivity  # 0 (objective) to 1 (subjective)
        
        # Create database record using ChatLog model
        chat_log = ChatLog(
            user_id=request.user_id,
            prompt=request.prompt,
            response=ai_response,
            tokens=total_tokens,
            sentiment=sentiment_polarity
        )
        
        # Save to database
        db.add(chat_log)
        db.commit()
        
        # Return response with telemetry
        return ChatResponse(
            response=ai_response,
            tokens_used=total_tokens,
            sentiment={
                "polarity": sentiment_polarity,
                "subjectivity": sentiment_subjectivity,
                "description": _get_sentiment_description(sentiment_polarity)
            },
            response_time_ms=response_time_ms
        )
        
    except Exception as e:
        # Log error and raise HTTP exception
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")

def _get_sentiment_description(polarity: float) -> str:
    """
    Convert sentiment polarity to human-readable description.
    
    Args:
        polarity (float): Sentiment polarity score (-1 to 1)
        
    Returns:
        str: Human-readable sentiment description
    """
    if polarity > 0.3:
        return "Positive"
    elif polarity < -0.3:
        return "Negative"
    else:
        return "Neutral" 