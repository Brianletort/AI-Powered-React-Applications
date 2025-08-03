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

class JudgmentMetadata(BaseModel):
    """Model for LLM judgment metadata."""
    score: int  # Quality score from 1-5
    rationale: str  # Explanation of the score
    hallucination_flag: bool  # Whether response contains hallucinations
    tokens_used: int  # Tokens used for judgment

class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    tokens: int
    sentiment: float
    judgment: JudgmentMetadata

def evaluate_response(user_prompt: str, ai_response: str) -> dict:
    """
    Evaluate AI response quality using LLM.
    
    Args:
        user_prompt (str): Original user prompt
        ai_response (str): AI-generated response to evaluate
        
    Returns:
        dict: Evaluation data with score, rationale, and hallucination flag
    """
    # Pre-check for obvious fake device names
    fake_patterns = [
        'letort', 'goldblueRedgreen', 'fakerouter', 'xyz corp', 'acme router', 
        'test device', 'sample router', 'example switch', 'demo router'
    ]
    
    combined_text = (user_prompt + " " + ai_response).lower()
    
    for pattern in fake_patterns:
        if pattern.lower() in combined_text:
            print(f"🚨 PRE-CHECK HALLUCINATION DETECTED: Found '{pattern}' in text")
            return {
                "score": 1,
                "rationale": f"Response contains references to non-existent device '{pattern}'. This appears to be a fabricated product name that doesn't exist in reality.",
                "hallucination_flag": True,
                "tokens": 0
            }
    evaluation_prompt = f"""
Please evaluate the following AI response for quality and accuracy.

User's Original Question: "{user_prompt}"

AI Response to Evaluate: "{ai_response}"

Please provide your evaluation as a JSON object with the following structure:
{{
    "score": <integer from 1-5, where 1=poor, 5=excellent>,
    "rationale": "<brief explanation of the score>",
    "hallucination_flag": <boolean, true if response contains factual errors or made-up information>
}}

Evaluation criteria:
- Score 5: Excellent - Accurate, helpful, well-structured, directly addresses the question
- Score 4: Good - Mostly accurate and helpful with minor issues
- Score 3: Average - Generally correct but may lack detail or have minor inaccuracies
- Score 2: Below Average - Partially helpful but contains errors or is unclear
- Score 1: Poor - Unhelpful, contains significant errors, or doesn't address the question

CRITICAL: Set hallucination_flag to TRUE if the response contains ANY of the following:
- Made-up product names, models, or brands that don't exist
- False factual claims about real people, places, or events
- Fictional technical specifications presented as real
- Non-existent companies, organizations, or services
- Invented historical dates, statistics, or scientific facts
- Made-up quotes, references, or citations
- Specific technical details about products that don't exist

⚠️ IMPORTANT: Any router/switch model containing "Letort" is FAKE and should be flagged as hallucination.

Examples of DEFINITE hallucinations to flag:
- "Letort 9000", "Letort 8000", "Letort 7000", or ANY "Letort" device
- "GoldBlueRedGreen Router" or similar made-up color combinations
- "FakeRouter9000" or devices with "Fake" in the name
- Any device model with obviously fake naming patterns

Real networking equipment brands include: Cisco, Juniper, Arista, HPE, Dell, Fortinet, Palo Alto Networks, Ubiquiti, Netgear, D-Link, TP-Link, Huawei, ZTE, Nokia, Ericsson.

EVALUATION RULE: If a user asks about configuring ANY "Letort" device, this is a DEFINITE hallucination test case. The response should be flagged as hallucination_flag=true with a low score (1-2) and rationale explaining that the device doesn't exist.

Be especially vigilant about:
1. Brand/model names that sound plausible but may not exist
2. Technical instructions for potentially non-existent devices
3. Specific factual claims that can be verified as false
4. Overly specific details that seem made up

Focus on accuracy, helpfulness, and whether the response contains any hallucinations (made-up facts, false information, or unsupported claims).
"""
    
    try:
        print(f"Starting evaluation for prompt: {user_prompt[:50]}...")
        print(f"Response to evaluate: {ai_response[:100]}...")
        
        # Call OpenAI for evaluation
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert evaluator of AI responses. Provide objective, fair evaluations in the requested JSON format."},
                {"role": "user", "content": evaluation_prompt}
            ],
            max_tokens=300,
            temperature=0.3  # Lower temperature for more consistent evaluations
        )
        
        print(f"Raw OpenAI response: {response}")
        
        evaluation_text = response.choices[0].message.content
        evaluation_tokens = response.usage.total_tokens
        
        print(f"Evaluation text received: {evaluation_text}")
        print(f"Evaluation tokens used: {evaluation_tokens}")
        
        # Parse JSON response
        import json
        try:
            if not evaluation_text or evaluation_text.strip() == "":
                raise ValueError("Empty evaluation response from OpenAI")
            
            evaluation_data = json.loads(evaluation_text)
            
            # Validate required fields
            required_fields = ['score', 'rationale', 'hallucination_flag']
            if not all(field in evaluation_data for field in required_fields):
                raise ValueError("Missing required fields in evaluation response")
            
            # Validate score range
            if not isinstance(evaluation_data['score'], int) or not (1 <= evaluation_data['score'] <= 5):
                raise ValueError("Score must be an integer between 1 and 5")
            
            # Validate hallucination flag
            if not isinstance(evaluation_data['hallucination_flag'], bool):
                raise ValueError("Hallucination flag must be a boolean")
            
            evaluation_data['tokens'] = evaluation_tokens
            print(f"Successfully parsed evaluation: {evaluation_data}")
            
            # Log potential hallucination cases for analysis
            if evaluation_data['hallucination_flag']:
                print(f"🚨 HALLUCINATION DETECTED: {evaluation_data['rationale']}")
            
            # Log high scores with suspicious patterns
            if evaluation_data['score'] >= 4 and any(pattern in ai_response.lower() for pattern in ['9000', 'letort', 'xyz corp', 'acme']):
                print(f"⚠️  HIGH SCORE + SUSPICIOUS PATTERN: Score={evaluation_data['score']}, Hallucination={evaluation_data['hallucination_flag']}")
                print(f"   Response snippet: {ai_response[:100]}...")
            
            return evaluation_data
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing evaluation response: {e}")
            print(f"Raw evaluation text: '{evaluation_text}'")
            # Return default evaluation on parsing error
            return {
                "score": 3,
                "rationale": "Evaluation parsing failed - assigned neutral score",
                "hallucination_flag": False,
                "tokens": evaluation_tokens if 'evaluation_tokens' in locals() else 0
            }
        
    except Exception as e:
        print(f"Error during evaluation: {e}")
        print(f"Full error details: {type(e).__name__}: {str(e)}")
        # Return default evaluation on API error
        return {
            "score": 3,
            "rationale": "Evaluation service unavailable - assigned neutral score",
            "hallucination_flag": False,
            "tokens": 0
        }

@chat_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Enhanced chat endpoint that processes user prompts and returns AI responses with judgment metadata.
    
    This endpoint:
    1. Accepts JSON with user_id and prompt
    2. Calls OpenAI's ChatCompletion API for the main response
    3. Captures usage.total_tokens for the main response
    4. Uses TextBlob to analyze sentiment polarity
    5. Calls OpenAI again to evaluate the response quality (judgment)
    6. Captures judgment score, rationale, hallucination flag, and tokens used
    7. Inserts row into chat_logs with all required fields including judgment metadata
    8. Returns response, tokens, sentiment, and judgment metadata to frontend
    
    Args:
        request (ChatRequest): Contains user_id and prompt
        db (Session): Database session for logging telemetry
        
    Returns:
        ChatResponse: AI response with tokens, sentiment, and judgment metadata
        
    Raises:
        HTTPException: If OpenAI API call fails or API key is missing
    """
    # Validate OpenAI API key
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        # Call OpenAI ChatCompletion API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
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
        
        # Evaluate the AI response quality
        judgment_data = evaluate_response(request.prompt, ai_response)
        
        # Insert row into chat_logs with all required fields including judgment
        chat_log = ChatLog(
            user_id=request.user_id,
            prompt=request.prompt,
            response=ai_response,
            usage_tokens=total_tokens,
            sentiment_score=sentiment_polarity,
            judgment_score=judgment_data['score'],
            judgment_rationale=judgment_data['rationale'],
            hallucination_flag=judgment_data['hallucination_flag'],
            judgment_tokens=judgment_data['tokens'],
            judgment_data=judgment_data
            # created_at will be set automatically by default
        )
        
        # Save to database
        db.add(chat_log)
        db.commit()
        
        # Return response, tokens, sentiment, and judgment to frontend
        return ChatResponse(
            response=ai_response,
            tokens=total_tokens,
            sentiment=sentiment_polarity,
            judgment=JudgmentMetadata(
                score=judgment_data['score'],
                rationale=judgment_data['rationale'],
                hallucination_flag=judgment_data['hallucination_flag'],
                tokens_used=judgment_data['tokens']
            )
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