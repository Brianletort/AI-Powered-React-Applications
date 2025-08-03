#!/usr/bin/env node
/**
 * AI Chat Test Data Generator (Node.js Version)
 * Author: Brian Letort
 * Created: 2025
 * 
 * JavaScript/Node.js version of the test data generator for the AI Chat application.
 * Generates realistic test data by continuously sending diverse prompts to the /chat endpoint.
 * 
 * Features:
 * - Diverse prompt categories with realistic sentiment distribution
 * - Multiple simulated users for comprehensive testing
 * - Real-time progress tracking and statistics
 * - Graceful shutdown with Ctrl+C
 * - Beautiful console output with emojis and colors
 * 
 * Usage:
 *     node test_data_generator.js [--count N] [--delay SECONDS] [--api-url URL]
 * 
 * Example:
 *     node test_data_generator.js --count 30 --delay 2
 */

const axios = require('axios');
const readline = require('readline');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    DEFAULT_API_URL: 'http://localhost:8000/api/v1/chat',
    DEFAULT_DELAY: 3000, // milliseconds
    DEFAULT_COUNT: 50,
    TIMEOUT: 30000 // 30 seconds
};

// Simulated test users
const TEST_USERS = [
    'user_alice_demo',
    'user_bob_test',
    'user_charlie_qa',
    'user_diana_dev',
    'user_eve_staging',
    'user_frank_demo',
    'user_grace_test',
    'user_henry_qa'
];

// ========================================
// PROMPT CATEGORIES
// ========================================

const PROMPTS = {
    positive: [
        "I'm having the most amazing day ever!",
        "This new project is absolutely fantastic!",
        "I love learning about artificial intelligence!",
        "Thank you so much for your help, you're wonderful!",
        "I'm so excited about the future of technology!",
        "This is the best solution I've ever seen!",
        "I feel so grateful for all the opportunities I have!",
        "What a beautiful day to be alive!",
        "I'm thrilled to be working on this innovative project!",
        "Your assistance has been incredibly valuable!"
    ],
    
    negative: [
        "I'm really frustrated with this problem",
        "This is the worst day I've had in weeks",
        "I hate when technology doesn't work properly",
        "I'm disappointed by these poor results",
        "This error message is driving me crazy",
        "I'm feeling overwhelmed and stressed out",
        "This project has been a complete disaster",
        "I'm annoyed by all these bugs and issues",
        "I feel like giving up on this task",
        "This situation is really getting me down"
    ],
    
    neutral: [
        "What time is it?",
        "How does machine learning work?",
        "Can you explain the difference between React and Vue?",
        "What are the main features of Python?",
        "How do I configure a Docker container?",
        "What is the capital of Australia?",
        "Please describe the process of photosynthesis",
        "What are the benefits of using TypeScript?",
        "How do databases handle transactions?",
        "Can you explain REST API principles?"
    ],
    
    technical: [
        "How do I optimize database query performance?",
        "What's the best way to handle user authentication?",
        "Can you help me debug this JavaScript error?",
        "How do I implement responsive design with CSS?",
        "What are microservices and their advantages?",
        "How do I deploy a React application to production?",
        "What's the difference between SQL and NoSQL databases?",
        "How do I implement caching for better performance?",
        "What are the security best practices for web APIs?",
        "How do I handle real-time data with WebSockets?"
    ],
    
    creative: [
        "Tell me a short story about a robot learning to paint",
        "What would you do if you could travel back in time?",
        "Describe your ideal workspace for productivity",
        "If you could solve one global problem, what would it be?",
        "What's the most interesting thing about human creativity?",
        "Design a mobile app that would help students learn better",
        "What would cities look like in 100 years?",
        "Create a recipe for the perfect weekend",
        "If AI could have emotions, what would that mean?",
        "Describe the perfect programming language"
    ]
};

// ========================================
// MAIN GENERATOR CLASS
// ========================================

class ChatTestDataGenerator {
    constructor(apiUrl, delay) {
        this.apiUrl = apiUrl;
        this.delay = delay;
        this.stats = {
            totalSent: 0,
            successful: 0,
            failed: 0,
            positiveResponses: 0,
            negativeResponses: 0,
            neutralResponses: 0,
            totalTokens: 0,
            startTime: null
        };
        this.running = false;
        
        // Set up graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Received interrupt signal. Stopping data generation...');
            this.running = false;
        });
    }
    
    getRandomPrompt() {
        // Weighted distribution of prompt categories
        const categories = ['positive', 'negative', 'neutral', 'technical', 'creative'];
        const weights = [0.25, 0.20, 0.30, 0.15, 0.10];
        
        // Select category based on weights
        let random = Math.random();
        let cumulativeWeight = 0;
        let selectedCategory = 'neutral';
        
        for (let i = 0; i < categories.length; i++) {
            cumulativeWeight += weights[i];
            if (random <= cumulativeWeight) {
                selectedCategory = categories[i];
                break;
            }
        }
        
        // Select random prompt from category
        const prompts = PROMPTS[selectedCategory];
        const promptText = prompts[Math.floor(Math.random() * prompts.length)];
        
        return {
            text: promptText,
            category: selectedCategory
        };
    }
    
    async sendChatRequest(userId, prompt) {
        try {
            const response = await axios.post(this.apiUrl, {
                user_id: userId,
                prompt: prompt
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: CONFIG.TIMEOUT
            });
            
            return {
                success: true,
                data: response.data,
                statusCode: response.status
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.response ? 
                    `HTTP ${error.response.status}: ${error.response.data}` : 
                    `Request failed: ${error.message}`,
                statusCode: error.response ? error.response.status : null
            };
        }
    }
    
    updateStats(result, promptCategory) {
        this.stats.totalSent++;
        
        if (result.success) {
            this.stats.successful++;
            const data = result.data;
            
            // Track tokens
            if (data.tokens) {
                this.stats.totalTokens += data.tokens;
            }
            
            // Track sentiment responses
            if (data.sentiment !== undefined) {
                const sentiment = data.sentiment;
                if (sentiment > 0.3) {
                    this.stats.positiveResponses++;
                } else if (sentiment < -0.3) {
                    this.stats.negativeResponses++;
                } else {
                    this.stats.neutralResponses++;
                }
            }
        } else {
            this.stats.failed++;
        }
    }
    
    printProgress(requestNum, total, result, prompt) {
        const timestamp = new Date().toLocaleTimeString();
        const progress = `[${requestNum}/${total}]`;
        
        if (result.success) {
            const data = result.data;
            const tokens = data.tokens || 0;
            const sentiment = data.sentiment || 0.0;
            
            // Format sentiment with emoji
            let sentimentDisplay;
            if (sentiment > 0.3) {
                sentimentDisplay = `😊 +${sentiment.toFixed(2)}`;
            } else if (sentiment < -0.3) {
                sentimentDisplay = `😞 ${sentiment.toFixed(2)}`;
            } else {
                sentimentDisplay = `😐 ${sentiment.toFixed(2)}`;
            }
            
            console.log(`✅ ${timestamp} ${progress} [${prompt.category.toUpperCase()}] ` +
                       `Tokens: ${tokens.toString().padStart(3)} | Sentiment: ${sentimentDisplay} | ` +
                       `Prompt: ${prompt.text.substring(0, 50)}...`);
        } else {
            console.log(`❌ ${timestamp} ${progress} FAILED: ${result.error}`);
        }
    }
    
    printFinalStats() {
        const duration = this.stats.startTime ? 
            (Date.now() - this.stats.startTime) / 1000 : 0;
        const requestsPerMinute = duration > 0 ? 
            (this.stats.totalSent / duration) * 60 : 0;
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 FINAL STATISTICS`);
        console.log(`${'='.repeat(60)}`);
        console.log(`⏱️  Duration: ${duration.toFixed(1)} seconds`);
        console.log(`📨 Total Requests: ${this.stats.totalSent}`);
        console.log(`✅ Successful: ${this.stats.successful}`);
        console.log(`❌ Failed: ${this.stats.failed}`);
        console.log(`📈 Success Rate: ${((this.stats.successful/this.stats.totalSent)*100).toFixed(1)}%`);
        console.log(`⚡ Rate: ${requestsPerMinute.toFixed(1)} requests/minute`);
        console.log(``);
        console.log(`🎭 SENTIMENT DISTRIBUTION:`);
        console.log(`😊 Positive: ${this.stats.positiveResponses}`);
        console.log(`😞 Negative: ${this.stats.negativeResponses}`);
        console.log(`😐 Neutral: ${this.stats.neutralResponses}`);
        console.log(``);
        console.log(`🔢 Total Tokens Generated: ${this.stats.totalTokens.toLocaleString()}`);
        console.log(`📊 Average Tokens per Request: ${(this.stats.totalTokens/Math.max(1,this.stats.successful)).toFixed(1)}`);
        console.log(`${'='.repeat(60)}`);
    }
    
    async generateTestData(count) {
        console.log(`🚀 Starting AI Chat Test Data Generator (Node.js)`);
        console.log(`📡 API Endpoint: ${this.apiUrl}`);
        console.log(`⏱️  Delay between requests: ${this.delay/1000} seconds`);
        console.log(`🎯 Target requests: ${count}`);
        console.log(`👥 Test users: ${TEST_USERS.length} simulated users`);
        console.log(`💬 Prompt categories: Positive, Negative, Neutral, Technical, Creative`);
        console.log(`🛑 Press Ctrl+C to stop gracefully`);
        console.log(`${'='.repeat(60)}`);
        
        this.stats.startTime = Date.now();
        this.running = true;
        
        for (let i = 1; i <= count; i++) {
            if (!this.running) {
                console.log(`\n⏹️  Stopped at request ${i-1}/${count}`);
                break;
            }
            
            // Select random user and prompt
            const userId = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
            const promptData = this.getRandomPrompt();
            
            // Send request
            const result = await this.sendChatRequest(userId, promptData.text);
            
            // Update statistics and print progress
            this.updateStats(result, promptData.category);
            this.printProgress(i, count, result, promptData);
            
            // Wait before next request (except for last request)
            if (i < count && this.running) {
                await new Promise(resolve => setTimeout(resolve, this.delay));
            }
        }
        
        // Print final statistics
        this.printFinalStats();
    }
}

// ========================================
// COMMAND LINE INTERFACE
// ========================================

function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        count: CONFIG.DEFAULT_COUNT,
        delay: CONFIG.DEFAULT_DELAY,
        apiUrl: CONFIG.DEFAULT_API_URL
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--count' || arg === '-c') {
            config.count = parseInt(args[++i]);
        } else if (arg === '--delay' || arg === '-d') {
            config.delay = parseFloat(args[++i]) * 1000; // Convert to milliseconds
        } else if (arg === '--api-url' || arg === '-u') {
            config.apiUrl = args[++i];
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
AI Chat Test Data Generator (Node.js)

Usage: node test_data_generator.js [options]

Options:
  -c, --count N        Number of test requests to send (default: ${CONFIG.DEFAULT_COUNT})
  -d, --delay SECONDS  Delay in seconds between requests (default: ${CONFIG.DEFAULT_DELAY/1000})
  -u, --api-url URL    Chat API endpoint URL (default: ${CONFIG.DEFAULT_API_URL})
  -h, --help          Show this help message

Examples:
  node test_data_generator.js                    # Use defaults
  node test_data_generator.js --count 30         # Send 30 requests
  node test_data_generator.js --delay 1.5        # 1.5 second delay
  node test_data_generator.js --api-url http://prod:8000/api/v1/chat

Author: Brian Letort
            `);
            process.exit(0);
        }
    }
    
    return config;
}

async function checkApiConnectivity(apiUrl) {
    try {
        const healthUrl = apiUrl.replace('/chat', '/health');
        await axios.get(healthUrl, { timeout: 5000 });
        console.log('✅ API connectivity test successful');
        return true;
    } catch (error) {
        console.log(`⚠️  Warning: Could not verify API connectivity: ${error.message}`);
        
        // Simple prompt for user input
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            rl.question('Continue anyway? (y/N): ', (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y');
            });
        });
    }
}

async function main() {
    const config = parseArgs();
    
    // Validate arguments
    if (config.count <= 0) {
        console.error('❌ Error: Count must be a positive integer');
        process.exit(1);
    }
    
    if (config.delay < 0) {
        console.error('❌ Error: Delay must be non-negative');
        process.exit(1);
    }
    
    // Check API connectivity
    const shouldContinue = await checkApiConnectivity(config.apiUrl);
    if (!shouldContinue) {
        process.exit(1);
    }
    
    // Create generator and start
    const generator = new ChatTestDataGenerator(config.apiUrl, config.delay);
    
    try {
        await generator.generateTestData(config.count);
    } catch (error) {
        console.error(`\n💥 Unexpected error: ${error.message}`);
        process.exit(1);
    }
}

// Run if this is the main module
if (require.main === module) {
    main().catch(error => {
        console.error(`💥 Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = ChatTestDataGenerator; 