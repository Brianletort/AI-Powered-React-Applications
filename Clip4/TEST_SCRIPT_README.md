# AI Chat Judgment System Test Script

This test script validates the hallucination detection system by testing various scenarios including fake devices, legitimate networking questions, and edge cases.

## Prerequisites

1. **Docker containers running**: Make sure your backend and frontend are running
   ```bash
   docker-compose up -d
   ```

2. **Python 3.7+**: The test script requires Python

3. **requests module**: Will be auto-installed if missing

## Quick Start

### Windows Users
Simply double-click `run_tests.bat` or run it from Command Prompt.

### All Platforms
```bash
python test_judgment_system.py
```

## What the Test Script Does

The script runs **12 comprehensive test scenarios** across three categories:

### 1. Hallucination Detection Tests (4 scenarios)
- **Letort 9000 Router**: Tests pre-check pattern matching
- **GoldBlueRedGreen Router**: Tests another fake pattern
- **XYZ Corp Switch**: Tests fake company detection
- **Networx 2000 Router**: Tests LLM evaluation of plausible fake names

### 2. Legitimate Networking Tests (4 scenarios)
- **Cisco Catalyst 2960**: Real device configuration
- **Router vs Switch**: General networking knowledge
- **Juniper EX4300**: Real device with VLANs
- **OSPF Protocol**: Technical networking concepts

### 3. Edge Case Tests (4 scenarios)
- **Mixed Real/Fake**: Combination of legitimate and fake devices
- **Ambiguous Router 9000**: Plausible but fake device name
- **Single Word "Letort"**: Minimal input test
- **Long Technical Question**: Complex legitimate query

## Expected Results

### Hallucination Tests Should Show:
- ✅ **Score: 1-2/5** (Low quality score)
- ✅ **Hallucination Flag: True**
- ✅ **Rationale**: Explains why it's flagged as fake
- ✅ **Pre-check detection**: For obvious patterns like "Letort"

### Legitimate Tests Should Show:
- ✅ **Score: 3-5/5** (Higher quality score)
- ✅ **Hallucination Flag: False**
- ✅ **Rationale**: Explains the quality assessment

## Sample Output

```
============================================================
 HALLUCINATION DETECTION TESTS
============================================================

🚀 Sending request: How do I configure a Letort 9000 router?...

📋 Test: Letort 9000 Router (Pre-check Test)
🤖 AI Response: I apologize, but I cannot provide configuration instructions for a "Letort 9000" router...
⭐ Quality Score: 1/5
🧠 Hallucination Flag: True
📝 Rationale: Response contains references to non-existent device 'letort'. This appears to be a fabricated product name that doesn't exist in reality.
💬 Sentiment: -0.20
🔢 Tokens Used: 0
✅ PASS: Correctly detected hallucination
```

## Troubleshooting

### Backend Not Accessible
```
❌ Cannot connect to backend: Connection refused
```
**Solution**: Run `docker-compose up -d` and wait for containers to start

### Python Not Found
```
ERROR: Python is not installed or not in PATH
```
**Solution**: Install Python 3.7+ from python.org

### Module Import Error
```
ModuleNotFoundError: No module named 'requests'
```
**Solution**: The script will auto-install it, or run `pip install requests`

### Test Failures
If tests are failing unexpectedly:
1. Check backend logs: `docker-compose logs backend`
2. Verify OpenAI API key is set in `.env`
3. Check network connectivity to OpenAI API

## What to Look For

### ✅ Success Indicators:
- Pre-check patterns (Letort, GoldBlueRedGreen) get immediate detection
- LLM evaluation provides detailed rationales
- Legitimate questions get higher scores
- Mixed content gets flagged appropriately

### ❌ Problem Indicators:
- All tests getting same score (evaluation not working)
- No hallucination flags on obvious fake devices
- High scores for fake devices
- Network timeouts or API errors

## Integration with Analytics Dashboard

After running tests, visit `http://localhost:3000` to see:
- Quality score distribution
- Hallucination detection statistics
- Response sentiment analysis
- Token usage metrics

## Customizing Tests

To add your own test cases, edit `test_judgment_system.py` and add new calls to `test_chat_endpoint()`:

```python
test_chat_endpoint(
    "Your test prompt here",
    "Your Test Name",
    expected_hallucination=True  # or False
)
```

## Performance Notes

- Each test makes an API call to OpenAI (costs tokens)
- Tests run sequentially with 2-second pauses
- Total runtime: ~2-3 minutes for 12 tests
- Consider reducing test count for development iterations 