# 🚀 AI Chat Test Data Generator

**Automatically generate realistic test data for your AI Chat with Telemetry dashboard!**

This repository includes two test data generators that continuously send diverse prompts to your chat API, creating realistic data for testing and demonstrating the analytics dashboard.

## 📁 **Available Generators**

| Generator | Language | File | Best For |
|-----------|----------|------|----------|
| **Python** | Python 3.7+ | `test_data_generator.py` | Advanced features, data science users |
| **Node.js** | JavaScript/Node.js | `test_data_generator.js` | Frontend developers, quick setup |

## 🎯 **Features**

- ✅ **5 Prompt Categories**: Positive, Negative, Neutral, Technical, Creative
- ✅ **8 Simulated Users**: Realistic multi-user testing
- ✅ **Smart Sentiment Distribution**: Weighted prompts for realistic sentiment variation
- ✅ **Real-time Progress**: Live statistics and progress tracking
- ✅ **Graceful Shutdown**: Ctrl+C stops cleanly with final statistics
- ✅ **Error Handling**: Robust error handling and recovery
- ✅ **Customizable**: Configurable count, delay, and API URL

---

## 🐍 **Python Version Setup**

### **Prerequisites**
```bash
# Python 3.7+ required
python --version

# Install required package
pip install requests
```

### **Basic Usage**
```bash
# Default: 100 requests, 3-second delay
python test_data_generator.py

# Custom settings
python test_data_generator.py --count 50 --delay 2

# Different API URL
python test_data_generator.py --api-url http://localhost:8000/api/v1/chat
```

### **Advanced Options**
```bash
# Quick test run
python test_data_generator.py --count 10 --delay 1

# Stress test
python test_data_generator.py --count 500 --delay 0.5

# Production testing
python test_data_generator.py --count 200 --delay 5 --api-url https://api.yourdomain.com/api/v1/chat
```

---

## 🚀 **Node.js Version Setup**

### **Prerequisites**
```bash
# Node.js 14+ required
node --version

# Install required package
npm install axios
```

### **Basic Usage**
```bash
# Default: 50 requests, 3-second delay
node test_data_generator.js

# Custom settings
node test_data_generator.js --count 30 --delay 2

# Different API URL  
node test_data_generator.js --api-url http://localhost:8000/api/v1/chat
```

### **Advanced Options**
```bash
# Quick test run
node test_data_generator.js --count 10 --delay 1

# Extended test
node test_data_generator.js --count 100 --delay 2.5

# Help information
node test_data_generator.js --help
```

---

## 📊 **Sample Output**

```bash
🚀 Starting AI Chat Test Data Generator
📡 API Endpoint: http://localhost:8000/api/v1/chat
⏱️  Delay between requests: 3.0 seconds
🎯 Target requests: 20
👥 Test users: 8 simulated users
💬 Prompt categories: Positive, Negative, Neutral, Technical, Creative
🛑 Press Ctrl+C to stop gracefully
============================================================
✅ 10:30:15 [1/20] [POSITIVE] Tokens:  45 | Sentiment: 😊 +0.72 | Prompt: I'm having the most amazing day ever!...
✅ 10:30:18 [2/20] [TECHNICAL] Tokens:  38 | Sentiment: 😐 +0.05 | Prompt: How do I optimize database query performance?...
✅ 10:30:21 [3/20] [NEGATIVE] Tokens:  42 | Sentiment: 😞 -0.58 | Prompt: I'm really frustrated with this problem...
✅ 10:30:24 [4/20] [CREATIVE] Tokens:  52 | Sentiment: 😊 +0.34 | Prompt: Tell me a short story about a robot learning...
...

============================================================
📊 FINAL STATISTICS
============================================================
⏱️  Duration: 63.2 seconds
📨 Total Requests: 20
✅ Successful: 20
❌ Failed: 0
📈 Success Rate: 100.0%
⚡ Rate: 19.0 requests/minute

🎭 SENTIMENT DISTRIBUTION:
😊 Positive: 6
😞 Negative: 4
😐 Neutral: 10

🔢 Total Tokens Generated: 854
📊 Average Tokens per Request: 42.7
============================================================
```

---

## 🎨 **Prompt Categories & Examples**

### **😊 Positive (25% of prompts)**
- "I'm having the most amazing day ever!"
- "This new project is absolutely fantastic!"
- "I love learning about artificial intelligence!"

### **😞 Negative (20% of prompts)**
- "I'm really frustrated with this problem"
- "This is the worst day I've had in weeks"
- "I hate when technology doesn't work properly"

### **😐 Neutral (30% of prompts)**
- "What time is it?"
- "How does machine learning work?"
- "Can you explain the difference between React and Vue?"

### **🔧 Technical (15% of prompts)**
- "How do I optimize database query performance?"
- "What's the best way to handle user authentication?"
- "How do I implement responsive design with CSS?"

### **🎨 Creative (10% of prompts)**
- "Tell me a short story about a robot learning to paint"
- "What would you do if you could travel back in time?"
- "Design a mobile app that would help students learn better"

---

## 🧪 **Testing Scenarios**

### **Quick Dashboard Demo (2 minutes)**
```bash
python test_data_generator.py --count 15 --delay 1
```
*Perfect for demonstrating the dashboard during presentations*

### **Sentiment Analysis Testing (5 minutes)**
```bash
python test_data_generator.py --count 25 --delay 2
```
*Focus on sentiment distribution and analytics accuracy*

### **Performance Testing (10 minutes)**
```bash
python test_data_generator.py --count 100 --delay 1
```
*Test system performance under higher load*

### **Continuous Background Testing**
```bash
python test_data_generator.py --count 1000 --delay 10
```
*Long-running test for extended dashboard monitoring*

---

## 🚨 **Troubleshooting**

### **Common Issues**

| Issue | Solution |
|-------|----------|
| "Connection refused" | Ensure your API server is running on the correct port |
| "Module not found" | Install required dependencies: `pip install requests` or `npm install axios` |
| "API key not configured" | Check your OpenAI API key in the backend environment |
| "High error rate" | Increase delay between requests or check API rate limits |

### **API Server Check**
```bash
# Test if your API server is responding
curl http://localhost:8000/health

# Test chat endpoint directly
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "prompt": "Hello!"}'
```

### **Dashboard Verification**
1. Start the test generator
2. Open browser to `http://localhost:3000`
3. Click "Analytics" tab
4. Watch real-time updates every 10 seconds

---

## 📋 **Command Reference**

### **Python Generator**
```bash
python test_data_generator.py [OPTIONS]

OPTIONS:
  --count, -c      Number of requests (default: 100)
  --delay, -d      Delay in seconds (default: 3)
  --api-url, -u    API endpoint URL
  --help, -h       Show help message
```

### **Node.js Generator**
```bash
node test_data_generator.js [OPTIONS]

OPTIONS:
  --count, -c      Number of requests (default: 50)
  --delay, -d      Delay in seconds (default: 3)
  --api-url, -u    API endpoint URL
  --help, -h       Show help message
```

---

## 💡 **Pro Tips**

### **For Dashboard Demos**
1. **Start with small batches**: Use `--count 10` for quick demos
2. **Use shorter delays**: `--delay 1` for faster results
3. **Pre-populate data**: Run a longer test before the demo

### **For Development Testing**
1. **Vary sentiment**: The weighted distribution creates realistic sentiment patterns
2. **Multiple users**: 8 different user IDs simulate real multi-user scenarios
3. **Monitor performance**: Watch token usage and response times

### **For Production Testing**
1. **Use longer delays**: `--delay 5` or more to avoid rate limiting
2. **Monitor costs**: Higher token usage = higher OpenAI costs
3. **Test different environments**: Change `--api-url` for staging/production

---

## 🔧 **Customization**

### **Adding New Prompts**
Edit the prompt arrays in either script:
```python
# Python version
POSITIVE_PROMPTS = [
    "Your new positive prompt here!",
    # ... existing prompts
]

# JavaScript version
const PROMPTS = {
    positive: [
        "Your new positive prompt here!",
        // ... existing prompts
    ]
};
```

### **Changing User Distribution**
Modify the TEST_USERS array to add more simulated users:
```python
TEST_USERS = [
    "user_alice_demo",
    "user_your_new_user",
    # ... add more users
]
```

### **Adjusting Sentiment Weights**
Change category weights in the `_get_random_prompt()` function:
```python
category_weights = {
    'positive': 0.30,    # Increase positive prompts
    'negative': 0.15,    # Decrease negative prompts
    'neutral': 0.35,     # Increase neutral prompts
    'technical': 0.15,
    'creative': 0.05
}
```

---

## 📈 **Expected Results**

After running the test generator, you should see:

### **In Your Database**
- New records in the `chat_logs` table
- Diverse user_id values from the simulated users
- Token counts ranging from ~20-80 per request
- Sentiment scores distributed between -1.0 and +1.0

### **In Your Analytics Dashboard**
- **Summary cards** updating with new totals
- **Line chart** showing token usage over time
- **Bar chart** displaying sessions by hour
- **Sentiment gauge** reflecting the latest sentiment score
- **Real-time updates** every 10 seconds

---

## 🤝 **Contributing**

Feel free to enhance these test generators:
- Add new prompt categories
- Implement different sentiment distributions  
- Add support for different API formats
- Create specialized testing scenarios

---

## 📝 **Author**

**Brian Letort** - AI Chat with Telemetry Project

Built as part of a comprehensive full-stack AI application demonstrating modern web development practices with real-time telemetry and analytics.

---

**🚀 Ready to generate some test data? Pick your preferred language and start testing!** 