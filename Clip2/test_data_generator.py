#!/usr/bin/env python3
"""
AI Chat Test Data Generator
Author: Brian Letort
Created: 2025

This script generates realistic test data for the AI Chat with Telemetry application
by continuously sending diverse prompts to the /chat endpoint. It helps populate
the analytics dashboard with varied data for testing and demonstration purposes.

Features:
- Diverse prompt categories (positive, negative, neutral, questions, creative)
- Multiple simulated users
- Realistic timing patterns
- Sentiment variation for comprehensive testing
- Progress tracking and statistics
- Graceful shutdown with Ctrl+C

Usage:
    python test_data_generator.py [--count N] [--delay SECONDS] [--api-url URL]

Example:
    python test_data_generator.py --count 50 --delay 2 --api-url http://localhost:8000
"""

import requests
import json
import random
import time
import argparse
import sys
from datetime import datetime
from typing import List, Dict
import signal

# ========================================
# CONFIGURATION
# ========================================

# API Configuration
DEFAULT_API_URL = "http://localhost:8000/api/v1/chat"
DEFAULT_DELAY = 3  # seconds between requests
DEFAULT_COUNT = 100  # number of requests to send

# Test Users - Simulating different users
TEST_USERS = [
    "user_alice_demo",
    "user_bob_test", 
    "user_charlie_qa",
    "user_diana_dev",
    "user_eve_staging",
    "user_frank_demo",
    "user_grace_test",
    "user_henry_qa"
]

# ========================================
# PROMPT CATEGORIES
# ========================================

# Positive sentiment prompts (expected sentiment: 0.3 to 1.0)
POSITIVE_PROMPTS = [
    "I'm having the most amazing day ever!",
    "This new project is absolutely fantastic!",
    "I love learning about artificial intelligence!",
    "Thank you so much for your help, you're wonderful!",
    "I'm so excited about the future of technology!",
    "This is the best solution I've ever seen!",
    "I feel so grateful for all the opportunities I have!",
    "What a beautiful day to be alive!",
    "I'm thrilled to be working on this innovative project!",
    "Your assistance has been incredibly valuable!",
    "I'm passionate about creating amazing user experiences!",
    "This technology is going to change the world for the better!",
    "I love how creative and helpful AI can be!",
    "I'm so proud of what we've accomplished together!",
    "This makes me feel so happy and optimistic!"
]

# Negative sentiment prompts (expected sentiment: -1.0 to -0.3)
NEGATIVE_PROMPTS = [
    "I'm really frustrated with this problem",
    "This is the worst day I've had in weeks",
    "I hate when technology doesn't work properly",
    "I'm disappointed by these poor results",
    "This error message is driving me crazy",
    "I'm feeling overwhelmed and stressed out",
    "This project has been a complete disaster",
    "I'm annoyed by all these bugs and issues",
    "I feel like giving up on this task",
    "This situation is really getting me down",
    "I'm angry about the lack of progress",
    "This is so confusing and frustrating",
    "I'm worried this will never work correctly",
    "I hate dealing with these technical problems",
    "This setback is really discouraging"
]

# Neutral/Informational prompts (expected sentiment: -0.3 to 0.3)
NEUTRAL_PROMPTS = [
    "What time is it?",
    "How does machine learning work?",
    "Can you explain the difference between React and Vue?",
    "What are the main features of Python?",
    "How do I configure a Docker container?",
    "What is the capital of Australia?",
    "Please describe the process of photosynthesis",
    "What are the benefits of using TypeScript?",
    "How do databases handle transactions?",
    "Can you explain REST API principles?",
    "What is the difference between HTTP and HTTPS?",
    "How does version control with Git work?",
    "What are the main cloud computing services?",
    "Please explain object-oriented programming concepts",
    "What is the purpose of unit testing?"
]

# Technical questions (mixed sentiment)
TECHNICAL_PROMPTS = [
    "How do I optimize database query performance?",
    "What's the best way to handle user authentication?",
    "Can you help me debug this JavaScript error?",
    "How do I implement responsive design with CSS?",
    "What are microservices and their advantages?",
    "How do I deploy a React application to production?",
    "What's the difference between SQL and NoSQL databases?",
    "How do I implement caching for better performance?",
    "What are the security best practices for web APIs?",
    "How do I handle real-time data with WebSockets?",
    "What's the best approach for error handling in Python?",
    "How do I optimize images for web performance?",
    "What are the principles of good API design?",
    "How do I implement user sessions and cookies?",
    "What's the difference between Docker and virtual machines?"
]

# Creative/Open-ended prompts (varied sentiment)
CREATIVE_PROMPTS = [
    "Tell me a short story about a robot learning to paint",
    "What would you do if you could travel back in time?",
    "Describe your ideal workspace for productivity",
    "If you could solve one global problem, what would it be?",
    "What's the most interesting thing about human creativity?",
    "Design a mobile app that would help students learn better",
    "What would cities look like in 100 years?",
    "Create a recipe for the perfect weekend",
    "If AI could have emotions, what would that mean?",
    "Describe the perfect programming language",
    "What would you teach an alien about Earth?",
    "Design a video game that teaches empathy",
    "What's the most beautiful thing about mathematics?",
    "How would you explain music to someone who's never heard it?",
    "What would happen if gravity suddenly stopped working?"
]

# ========================================
# MAIN TEST CLASS
# ========================================

class ChatTestDataGenerator:
    """
    Main class for generating test data for the AI Chat application.
    
    This class manages the entire test data generation process including:
    - Prompt selection and randomization
    - API request handling
    - Progress tracking and statistics
    - Error handling and recovery
    """
    
    def __init__(self, api_url: str, delay: float = DEFAULT_DELAY):
        """
        Initialize the test data generator.
        
        Args:
            api_url (str): Base URL of the chat API endpoint
            delay (float): Delay in seconds between API requests
        """
        self.api_url = api_url
        self.delay = delay
        self.stats = {
            'total_sent': 0,
            'successful': 0,
            'failed': 0,
            'positive_responses': 0,
            'negative_responses': 0,
            'neutral_responses': 0,
            'total_tokens': 0,
            'start_time': None
        }
        self.running = False
        
        # Set up graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        
    def _signal_handler(self, signum, frame):
        """Handle Ctrl+C gracefully."""
        print(f"\n\n🛑 Received interrupt signal. Stopping data generation...")
        self.running = False
        
    def _get_random_prompt(self) -> Dict[str, str]:
        """
        Select a random prompt from all categories.
        
        Returns:
            Dict containing the prompt text and its expected sentiment category
        """
        # Randomly choose a category with weighted distribution
        category_weights = {
            'positive': 0.25,
            'negative': 0.20,
            'neutral': 0.30,
            'technical': 0.15,
            'creative': 0.10
        }
        
        category = random.choices(
            list(category_weights.keys()),
            weights=list(category_weights.values())
        )[0]
        
        prompt_data = {
            'positive': {'prompts': POSITIVE_PROMPTS, 'category': 'positive'},
            'negative': {'prompts': NEGATIVE_PROMPTS, 'category': 'negative'},
            'neutral': {'prompts': NEUTRAL_PROMPTS, 'category': 'neutral'},
            'technical': {'prompts': TECHNICAL_PROMPTS, 'category': 'technical'},
            'creative': {'prompts': CREATIVE_PROMPTS, 'category': 'creative'}
        }
        
        selected_data = prompt_data[category]
        prompt = random.choice(selected_data['prompts'])
        
        return {
            'text': prompt,
            'category': selected_data['category']
        }
    
    def _send_chat_request(self, user_id: str, prompt: str) -> Dict:
        """
        Send a chat request to the API.
        
        Args:
            user_id (str): User identifier
            prompt (str): Chat prompt to send
            
        Returns:
            Dict containing response data or error information
        """
        try:
            payload = {
                "user_id": user_id,
                "prompt": prompt
            }
            
            response = requests.post(
                self.api_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'data': response.json(),
                    'status_code': response.status_code
                }
            else:
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'status_code': response.status_code
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f"Request failed: {str(e)}",
                'status_code': None
            }
    
    def _update_stats(self, result: Dict, prompt_category: str):
        """
        Update internal statistics based on request result.
        
        Args:
            result (Dict): Result from API request
            prompt_category (str): Category of the prompt that was sent
        """
        self.stats['total_sent'] += 1
        
        if result['success']:
            self.stats['successful'] += 1
            data = result['data']
            
            # Track tokens
            if 'tokens' in data:
                self.stats['total_tokens'] += data['tokens']
            
            # Track sentiment responses
            if 'sentiment' in data:
                sentiment = data['sentiment']
                if sentiment > 0.3:
                    self.stats['positive_responses'] += 1
                elif sentiment < -0.3:
                    self.stats['negative_responses'] += 1
                else:
                    self.stats['neutral_responses'] += 1
        else:
            self.stats['failed'] += 1
    
    def _print_progress(self, request_num: int, total: int, result: Dict, prompt: Dict):
        """
        Print progress information for current request.
        
        Args:
            request_num (int): Current request number
            total (int): Total number of requests planned
            result (Dict): Result from API request
            prompt (Dict): Prompt data that was sent
        """
        timestamp = datetime.now().strftime("%H:%M:%S")
        progress = f"[{request_num}/{total}]"
        
        if result['success']:
            data = result['data']
            tokens = data.get('tokens', 0)
            sentiment = data.get('sentiment', 0.0)
            
            # Format sentiment with color-coded emoji
            if sentiment > 0.3:
                sentiment_display = f"😊 +{sentiment:.2f}"
            elif sentiment < -0.3:
                sentiment_display = f"😞 {sentiment:.2f}"
            else:
                sentiment_display = f"😐 {sentiment:.2f}"
            
            print(f"✅ {timestamp} {progress} [{prompt['category'].upper()}] "
                  f"Tokens: {tokens:3d} | Sentiment: {sentiment_display} | "
                  f"Prompt: {prompt['text'][:50]}...")
        else:
            print(f"❌ {timestamp} {progress} FAILED: {result['error']}")
    
    def _print_final_stats(self):
        """Print comprehensive final statistics."""
        if self.stats['start_time']:
            duration = time.time() - self.stats['start_time']
            requests_per_minute = (self.stats['total_sent'] / duration) * 60 if duration > 0 else 0
        else:
            duration = 0
            requests_per_minute = 0
        
        print(f"\n{'='*60}")
        print(f"📊 FINAL STATISTICS")
        print(f"{'='*60}")
        print(f"⏱️  Duration: {duration:.1f} seconds")
        print(f"📨 Total Requests: {self.stats['total_sent']}")
        print(f"✅ Successful: {self.stats['successful']}")
        print(f"❌ Failed: {self.stats['failed']}")
        print(f"📈 Success Rate: {(self.stats['successful']/self.stats['total_sent']*100):.1f}%")
        print(f"⚡ Rate: {requests_per_minute:.1f} requests/minute")
        print(f"")
        print(f"🎭 SENTIMENT DISTRIBUTION:")
        print(f"😊 Positive: {self.stats['positive_responses']}")
        print(f"😞 Negative: {self.stats['negative_responses']}")
        print(f"😐 Neutral: {self.stats['neutral_responses']}")
        print(f"")
        print(f"🔢 Total Tokens Generated: {self.stats['total_tokens']:,}")
        print(f"📊 Average Tokens per Request: {self.stats['total_tokens']/max(1,self.stats['successful']):.1f}")
        print(f"{'='*60}")
    
    def generate_test_data(self, count: int):
        """
        Main method to generate test data.
        
        Args:
            count (int): Number of requests to send
        """
        print(f"🚀 Starting AI Chat Test Data Generator")
        print(f"📡 API Endpoint: {self.api_url}")
        print(f"⏱️  Delay between requests: {self.delay} seconds")
        print(f"🎯 Target requests: {count}")
        print(f"👥 Test users: {len(TEST_USERS)} simulated users")
        print(f"💬 Prompt categories: Positive, Negative, Neutral, Technical, Creative")
        print(f"🛑 Press Ctrl+C to stop gracefully")
        print(f"{'='*60}")
        
        self.stats['start_time'] = time.time()
        self.running = True
        
        for i in range(1, count + 1):
            if not self.running:
                print(f"\n⏹️  Stopped at request {i-1}/{count}")
                break
                
            # Select random user and prompt
            user_id = random.choice(TEST_USERS)
            prompt_data = self._get_random_prompt()
            
            # Send request
            result = self._send_chat_request(user_id, prompt_data['text'])
            
            # Update statistics and print progress
            self._update_stats(result, prompt_data['category'])
            self._print_progress(i, count, result, prompt_data)
            
            # Wait before next request (except for last request)
            if i < count and self.running:
                time.sleep(self.delay)
        
        # Print final statistics
        self._print_final_stats()

# ========================================
# COMMAND LINE INTERFACE
# ========================================

def main():
    """Main entry point with command line argument parsing."""
    parser = argparse.ArgumentParser(
        description="Generate test data for AI Chat with Telemetry application",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test_data_generator.py                           # Use defaults
  python test_data_generator.py --count 50                # Send 50 requests
  python test_data_generator.py --delay 1.5               # 1.5 second delay
  python test_data_generator.py --api-url http://prod:8000/api/v1/chat
  
Author: Brian Letort
        """
    )
    
    parser.add_argument(
        '--count', '-c',
        type=int,
        default=DEFAULT_COUNT,
        help=f'Number of test requests to send (default: {DEFAULT_COUNT})'
    )
    
    parser.add_argument(
        '--delay', '-d',
        type=float,
        default=DEFAULT_DELAY,
        help=f'Delay in seconds between requests (default: {DEFAULT_DELAY})'
    )
    
    parser.add_argument(
        '--api-url', '-u',
        type=str,
        default=DEFAULT_API_URL,
        help=f'Chat API endpoint URL (default: {DEFAULT_API_URL})'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.count <= 0:
        print("❌ Error: Count must be a positive integer")
        sys.exit(1)
        
    if args.delay < 0:
        print("❌ Error: Delay must be non-negative")
        sys.exit(1)
    
    # Test API connectivity
    try:
        test_response = requests.get(args.api_url.replace('/chat', '/health'), timeout=5)
        print(f"✅ API connectivity test successful")
    except Exception as e:
        print(f"⚠️  Warning: Could not verify API connectivity: {e}")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Create generator and start
    generator = ChatTestDataGenerator(args.api_url, args.delay)
    
    try:
        generator.generate_test_data(args.count)
    except KeyboardInterrupt:
        print(f"\n🛑 Interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 