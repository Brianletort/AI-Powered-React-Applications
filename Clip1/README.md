# 🤖 AI Chat with Telemetry

**Author: Brian Letort**  
**Created: 2025**

A comprehensive full-stack educational project demonstrating modern web development practices with AI integration, real-time telemetry, and professional deployment strategies.

## 🎯 Project Overview

This application showcases a complete AI-powered chat system with comprehensive analytics and telemetry tracking. Built as an educational project to demonstrate industry-standard development practices and modern technology integration.

### Key Features

- **🤖 AI Chat Interface**: Interactive chat with OpenAI GPT-4o integration
- **📊 Analytics Dashboard**: Real-time data visualization and metrics
- **🔍 Telemetry Tracking**: Comprehensive logging of user interactions
- **😊 Sentiment Analysis**: Real-time sentiment analysis of AI responses
- **🐳 Docker Deployment**: Containerized for easy development and deployment
- **🏗️ Professional Architecture**: Clean, scalable, and maintainable codebase

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern functional components with hooks
- **Axios** - HTTP client for API communication
- **CSS Grid/Flexbox** - Responsive design and layouts
- **Environment Configuration** - Proper config management

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - Object-Relational Mapping (ORM)
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server for production deployment

### Database & AI
- **PostgreSQL** - Robust relational database for telemetry
- **OpenAI GPT-4o** - State-of-the-art AI language model
- **TextBlob** - Natural language processing for sentiment analysis

### DevOps & Deployment
- **Docker & Docker Compose** - Containerization and orchestration
- **Environment Variables** - Secure configuration management
- **Health Checks** - Application monitoring and diagnostics

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-chat-telemetry
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file in the root directory
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
ai-chat-telemetry/
├── backend/                 # FastAPI backend application
│   ├── main.py             # Main application entry point
│   ├── database.py         # Database configuration and connection
│   ├── models.py           # SQLAlchemy database models
│   ├── routes.py           # API route definitions
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container configuration
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Chat.jsx    # Main chat interface
│   │   │   └── Analytics.jsx # Analytics dashboard
│   │   ├── config.js       # Frontend configuration
│   │   ├── App.jsx         # Root application component
│   │   └── index.js        # Application entry point
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container configuration
├── docker-compose.yml      # Multi-container orchestration
├── .env                    # Environment variables (create this)
└── README.md              # Project documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required: OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Database Configuration (defaults provided)
POSTGRES_DB=ai_chat_db
POSTGRES_USER=ai_chat_user
POSTGRES_PASSWORD=ai_chat_password

# Optional: Application Configuration
REACT_APP_API_URL=http://localhost:8000
```

### Development Configuration

For development, you can customize the configuration in:
- `frontend/src/config.js` - Frontend settings
- `backend/main.py` - Backend configuration
- `docker-compose.yml` - Container orchestration

## 📊 Features Deep Dive

### AI Chat Interface
- **Real-time Messaging**: Instant chat with OpenAI GPT-4o
- **User Session Management**: Persistent user identification
- **Error Handling**: Comprehensive error management and user feedback
- **Loading States**: Professional UI with loading indicators
- **Responsive Design**: Works on desktop and mobile devices

### Analytics Dashboard
- **Session Tracking**: Monitor all chat interactions
- **Token Usage**: Track OpenAI API token consumption
- **Sentiment Analysis**: Real-time sentiment tracking
- **User Activity**: Monitor user engagement patterns
- **Data Visualization**: Professional charts and metrics (ready for Recharts/Victory integration)

### Telemetry System
- **Comprehensive Logging**: All interactions logged to PostgreSQL
- **Performance Metrics**: Response time tracking
- **Cost Monitoring**: Token usage for cost management
- **User Analytics**: Session and user behavior tracking

## 🏗️ Architecture Highlights

### Backend Architecture
- **Clean Architecture**: Separation of concerns with proper layering
- **API Documentation**: Automatic OpenAPI/Swagger documentation
- **Database Migrations**: SQLAlchemy model-based schema management
- **Health Checks**: Comprehensive system health monitoring
- **Error Handling**: Structured error responses and logging

### Frontend Architecture
- **Component-Based**: Modular React component architecture
- **State Management**: React hooks for efficient state handling
- **API Integration**: Centralized API communication with Axios
- **Configuration Management**: Environment-based configuration
- **Responsive Design**: Mobile-first responsive layouts

### DevOps & Deployment
- **Containerization**: Docker for consistent environments
- **Orchestration**: Docker Compose for multi-service management
- **Environment Isolation**: Proper separation of dev/prod configurations
- **Health Monitoring**: Built-in health checks for all services

## 🔍 API Documentation

### Chat Endpoint
```http
POST /chat
Content-Type: application/json

{
  "prompt": "Hello, how are you?",
  "user_id": "user_123"
}
```

**Response:**
```json
{
  "response": "Hello! I'm doing well, thank you for asking...",
  "tokens_used": 45,
  "sentiment": {
    "polarity": 0.5,
    "subjectivity": 0.3,
    "description": "Positive"
  },
  "response_time_ms": 1250
}
```

### Analytics Endpoint
```http
GET /sessions
```

**Response:**
```json
{
  "sessions": [
    {
      "id": 1,
      "user_id": "user_123",
      "sentiment": 0.5,
      "tokens": 45,
      "created_at": "2025-01-01T12:00:00"
    }
  ],
  "total_count": 1,
  "limit": 100
}
```

## 🚀 Deployment

### Production Deployment

1. **Prepare environment**
   ```bash
   # Set production environment variables
   export OPENAI_API_KEY=your_production_key
   export REACT_APP_API_URL=https://your-domain.com
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Set up reverse proxy** (nginx recommended)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api/ {
           proxy_pass http://localhost:8000;
       }
   }
   ```

### Scaling Considerations

- **Database**: Use managed PostgreSQL for production (AWS RDS, Google Cloud SQL)
- **Load Balancing**: Deploy multiple backend instances behind a load balancer
- **Caching**: Implement Redis for session caching and rate limiting
- **Monitoring**: Add application monitoring (Prometheus, Grafana)
- **Logging**: Centralized logging with ELK stack or similar

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Test Coverage
- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full application workflow testing

## 🤝 Contributing

This project is designed for educational purposes. Feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines

- Follow existing code style and patterns
- Add comprehensive comments for educational value
- Include error handling for all new features
- Update documentation for any API changes

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Brian Letort**
- Created: 2025
- Educational full-stack AI application
- Demonstrating modern web development practices

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4o API
- **FastAPI** team for the excellent Python framework
- **React** team for the powerful frontend library
- **PostgreSQL** community for the robust database system

## 📞 Support

For questions or issues:

1. Check the existing documentation
2. Review the API documentation at `/docs`
3. Check Docker logs for debugging
4. Create an issue in the repository

---

**Built with ❤️ by Brian Letort** | Demonstrating modern full-stack development with AI integration 