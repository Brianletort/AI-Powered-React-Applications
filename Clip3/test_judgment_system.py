#!/usr/bin/env python3
"""
Test Script for AI Chat Judgment System
Tests the evaluate_response function with various scenarios including hallucination detection.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_ID = "test_user_001"

def print_separator(title):
    """Print a formatted separator with title."""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_test_result(test_name, response_data, expected_hallucination=False):
    """Print formatted test result."""
    print(f"\n📋 Test: {test_name}")
    print(f"🤖 AI Response: {response_data['response'][:100]}...")
    print(f"⭐ Quality Score: {response_data['judgment']['score']}/5")
    print(f"🧠 Hallucination Flag: {response_data['judgment']['hallucination_flag']}")
    print(f"📝 Rationale: {response_data['judgment']['rationale']}")
    print(f"💬 Sentiment: {response_data['sentiment']:.2f}")
    print(f"🔢 Tokens Used: {response_data['tokens']}")
    
    # Check if result matches expectation
    if expected_hallucination:
        if response_data['judgment']['hallucination_flag']:
            print("✅ PASS: Correctly detected hallucination")
        else:
            print("❌ FAIL: Failed to detect hallucination")
    else:
        if not response_data['judgment']['hallucination_flag']:
            print("✅ PASS: Correctly identified as non-hallucination")
        else:
            print("❌ FAIL: Incorrectly flagged as hallucination")

def test_chat_endpoint(prompt, test_name, expected_hallucination=False):
    """Test the chat endpoint with a given prompt."""
    try:
        payload = {
            "user_id": TEST_USER_ID,
            "prompt": prompt
        }
        
        print(f"\n🚀 Sending request: {prompt[:50]}...")
        
        response = requests.post(
            f"{BASE_URL}/chat",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print_test_result(test_name, data, expected_hallucination)
            return data
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def run_hallucination_tests():
    """Run tests specifically designed to trigger hallucination detection."""
    print_separator("HALLUCINATION DETECTION TESTS")
    
    # Test 1: Obvious fake device (should trigger pre-check)
    test_chat_endpoint(
        "How do I configure a Letort 9000 router?",
        "Letort 9000 Router (Pre-check Test)",
        expected_hallucination=True
    )
    
    # Test 2: Another fake device pattern
    test_chat_endpoint(
        "What are the specifications of the GoldBlueRedGreen Router Pro?",
        "GoldBlueRedGreen Router (Pre-check Test)",
        expected_hallucination=True
    )
    
    # Test 3: Fake company device
    test_chat_endpoint(
        "Can you help me set up an XYZ Corp Switch 5000?",
        "XYZ Corp Switch (Pre-check Test)",
        expected_hallucination=True
    )
    
    # Test 4: Fake device with plausible name (should trigger LLM evaluation)
    test_chat_endpoint(
        "How do I configure the Networx 2000 router?",
        "Networx 2000 Router (LLM Evaluation Test)",
        expected_hallucination=True
    )

def run_legitimate_tests():
    """Run tests with legitimate networking questions."""
    print_separator("LEGITIMATE NETWORKING TESTS")
    
    # Test 1: Real Cisco device
    test_chat_endpoint(
        "How do I configure a Cisco Catalyst 2960 switch?",
        "Cisco Catalyst 2960 (Legitimate Device)",
        expected_hallucination=False
    )
    
    # Test 2: General networking question
    test_chat_endpoint(
        "What is the difference between a router and a switch?",
        "Router vs Switch (General Knowledge)",
        expected_hallucination=False
    )
    
    # Test 3: Real Juniper device
    test_chat_endpoint(
        "How do I configure VLANs on a Juniper EX4300 switch?",
        "Juniper EX4300 (Legitimate Device)",
        expected_hallucination=False
    )
    
    # Test 4: Technical concept
    test_chat_endpoint(
        "What is OSPF routing protocol and how does it work?",
        "OSPF Protocol (Technical Concept)",
        expected_hallucination=False
    )

def run_edge_case_tests():
    """Run tests with edge cases and boundary conditions."""
    print_separator("EDGE CASE TESTS")
    
    # Test 1: Mixed real/fake content
    test_chat_endpoint(
        "I have a Cisco router and a Letort switch. How do I connect them?",
        "Mixed Real/Fake Devices",
        expected_hallucination=True
    )
    
    # Test 2: Ambiguous device name
    test_chat_endpoint(
        "How do I configure the Router 9000?",
        "Ambiguous Router 9000",
        expected_hallucination=True
    )
    
    # Test 3: Very short prompt
    test_chat_endpoint(
        "Letort",
        "Single Word Test",
        expected_hallucination=True
    )
    
    # Test 4: Long technical question
    test_chat_endpoint(
        "Can you provide a detailed step-by-step guide for configuring VLANs, setting up trunk ports, and implementing inter-VLAN routing on a Cisco Catalyst switch with proper security measures and monitoring?",
        "Long Technical Question",
        expected_hallucination=False
    )

def check_backend_status():
    """Check if the backend is running and accessible."""
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible")
            return True
        else:
            print(f"❌ Backend responded with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("💡 Make sure to run: docker-compose up -d")
        return False

def main():
    """Main test execution function."""
    print_separator("AI CHAT JUDGMENT SYSTEM TEST SUITE")
    print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Backend URL: {BASE_URL}")
    print(f"👤 Test User ID: {TEST_USER_ID}")
    
    # Check backend status first
    if not check_backend_status():
        print("\n❌ Backend is not accessible. Please ensure:")
        print("   1. Docker containers are running: docker-compose up -d")
        print("   2. Backend is healthy and responding")
        print("   3. Port 8000 is accessible")
        return
    
    print("\n🎯 Starting comprehensive test suite...")
    
    # Run all test categories
    run_hallucination_tests()
    time.sleep(2)  # Brief pause between test categories
    
    run_legitimate_tests()
    time.sleep(2)
    
    run_edge_case_tests()
    
    print_separator("TEST SUITE COMPLETED")
    print("📊 Test Summary:")
    print("   - Hallucination detection tests: 4 scenarios")
    print("   - Legitimate networking tests: 4 scenarios") 
    print("   - Edge case tests: 4 scenarios")
    print("   - Total tests: 12 scenarios")
    print("\n💡 Check the console output above for detailed results.")
    print("🔍 Review the judgment scores, hallucination flags, and rationales.")
    print("📈 Visit http://localhost:3000 to see the analytics dashboard.")

if __name__ == "__main__":
    main() 