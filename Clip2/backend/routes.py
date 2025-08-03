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
    user_id: str
    prompt: str

class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    tokens: int
    sentiment: float

@chat_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Enhanced chat endpoint that processes user prompts and returns AI responses.
    
    This endpoint:
    1. Accepts JSON with user_id and prompt
    2. Calls OpenAI's ChatCompletion API
    3. Captures usage.total_tokens
    4. Uses TextBlob to analyze sentiment polarity
    5. Inserts row into chat_logs with all required fields
    6. Returns response, tokens, sentiment to frontend
    
    Args:
        request (ChatRequest): Contains user_id and prompt
        db (Session): Database session for logging telemetry
        
    Returns:
        ChatResponse: AI response with tokens and sentiment
        
    Raises:
        HTTPException: If OpenAI API call fails or API key is missing
    """
    # Validate OpenAI API key
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        # Call OpenAI ChatCompletion API
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": request.prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        # Extract response content and capture usage.total_tokens
        ai_response = response.choices[0].message.content
        total_tokens = response.usage.total_tokens
        
        # Use TextBlob to analyze response sentiment polarity
        blob = TextBlob(ai_response)
        sentiment_polarity = blob.sentiment.polarity  # -1 (negative) to 1 (positive)
        
        # Insert row into chat_logs with all required fields
        chat_log = ChatLog(
            user_id=request.user_id,
            prompt=request.prompt,
            response=ai_response,
            usage_tokens=total_tokens,
            sentiment_score=sentiment_polarity
            # created_at will be set automatically by default
        )
        
        # Save to database
        db.add(chat_log)
        db.commit()
        
        # Return response, tokens, sentiment to frontend
        return ChatResponse(
            response=ai_response,
            tokens=total_tokens,
            sentiment=sentiment_polarity
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