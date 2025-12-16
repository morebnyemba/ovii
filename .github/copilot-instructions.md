# Ovii Project - Copilot Instructions

## Project Overview

Ovii is a fintech wallet and payment gateway designed to provide a seamless, fast, and secure way for users in Zimbabwe and beyond to send, receive, and manage money. The project emphasizes a mobile-first approach and aims to empower creators, freelancers, vendors, and everyday users with efficient financial tools.

**Vision**: People don't need banks; they need flow.

## Technology Stack

This is a monorepo project with two main components:

### Backend (`ovii_backend/`)
- **Framework**: Django 5+
- **API**: Django REST Framework (DRF)
- **Authentication**: DRF Simple JWT (token-based authentication)
- **Asynchronous Tasks**: Celery
- **Real-time Communication**: Django Channels
- **Database**: 
  - Development: SQLite
  - Production: PostgreSQL
- **Message Broker/Cache**: Redis
- **Phone Number Validation**: `django-phonenumber-field`

### Frontend (`ovii-frontend/`)
- **Framework**: Next.js 14+ (React)
- **UI Styling**: Tailwind CSS

## Project Structure

```
ovii/
├── ovii_backend/          # Django REST API
├── ovii-frontend/         # Next.js web application
├── .github/               # GitHub configuration and templates
├── nginx/                 # Nginx configuration
├── docker-compose.yml     # Docker compose for local development
├── GEMINI.md              # Gemini CLI agent instructions
└── README.md              # Project documentation
```

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis (running on default port `6379`)
- Git

### Backend Setup
```bash
cd ovii_backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # Optional, for admin access
python manage.py runserver  # Terminal 1
# Terminal 2:
celery -A ovii_backend worker -l info  # macOS/Linux
# Or on Windows: celery -A ovii_backend worker -l info -P solo
```

### Frontend Setup
```bash
cd ovii-frontend
npm install
npm run dev
```

Access points:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

## Development Conventions

### Code Organization
- This is a **monorepo** with separate `ovii_backend` and `ovii-frontend` directories
- Keep backend and frontend concerns separated
- Use consistent naming conventions within each stack

### Backend Conventions (Django)
- Follow Django and DRF best practices
- Use Django REST Framework serializers for API responses
- Implement proper authentication using JWT tokens
- Use Celery for background tasks (e.g., sending emails, processing notifications)
- Use Django Channels for real-time features
- Migrations: Always create and apply migrations for model changes
- Use `django-phonenumber-field` for phone number validation

### Frontend Conventions (Next.js)
- Follow React and Next.js best practices
- Use Tailwind CSS for styling - avoid inline styles
- Implement responsive, mobile-first designs
- Use TypeScript where applicable
- Follow the existing project structure for pages and components

### Authentication
- Backend uses token-based authentication via DRF Simple JWT
- OTP-based authentication for mobile onboarding and login
- Transaction PIN required for financial operations

### Database
- Use SQLite for local development
- Ensure all queries are compatible with PostgreSQL for production
- Always create migrations for model changes

### Asynchronous Processing
- Use Celery for background tasks to improve responsiveness
- Ensure Redis is running for Celery task queue

### Real-time Features
- Use Django Channels for WebSocket connections
- Implement real-time notifications for key events

## Key Features (MVP - Phase 1)

- Secure, OTP-based mobile onboarding and login
- Automatic wallet creation for new users
- Instant peer-to-peer transfers between Ovii users
- Transaction PIN for authorizing financial operations
- Comprehensive admin dashboard for managing users, wallets, and transactions

## Testing

### Backend Testing
```bash
cd ovii_backend
python manage.py test
```

### Frontend Testing
```bash
cd ovii-frontend
npm test  # If test scripts are configured
```

## Code Style

- **Python**: Follow PEP 8 guidelines
- **JavaScript/TypeScript**: Follow standard ESLint rules
- **Keep code clean and well-documented**
- **Write descriptive commit messages**

## Important Notes

- **Security**: This is a fintech application - always prioritize security
- **Mobile-first**: Design and develop with mobile users as the primary audience
- **Performance**: Optimize for fast response times and minimal latency
- **Error Handling**: Implement proper error handling and user feedback
- **Validation**: Validate all inputs, especially financial transactions

## Additional Resources

For detailed architectural decisions, business logic, coding patterns, and troubleshooting guides, please refer to:
- **[AGENTS.md](../AGENTS.md)** - Comprehensive agent context with architecture, data flow, and best practices
- **[README.md](../README.md)** - Project overview and development progress
- **[WHATSAPP_INTEGRATION.md](../WHATSAPP_INTEGRATION.md)** - WhatsApp Business API integration guide
- **[ROADMAP_ASSESSMENT.md](../ROADMAP_ASSESSMENT.md)** - Detailed project roadmap and progress tracking

## Intellectual Property

This software and all its components are the intellectual property of Ovii. Unauthorized copying, distribution, or use is strictly prohibited.

**Author**: Moreblessing Nyemba
**Copyright**: © 2025 Moreblessing Nyemba & Ovii. All Rights Reserved.
