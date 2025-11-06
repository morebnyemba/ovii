# Ovii Project Overview

This document summarizes the Ovii project, its technical stack, and development guidelines for the Gemini CLI agent.

## Project Overview

Ovii is a fintech wallet and payment gateway designed to offer a seamless, fast, and secure way for users in Zimbabwe and beyond to send, receive, and manage money. The project emphasizes a mobile-first approach and aims to empower individuals like creators, freelancers, and vendors with efficient financial tools.

### Key Features (MVP - Phase 1):
- Secure, OTP-based mobile onboarding and login.
- Automatic wallet creation for new users.
- Instant peer-to-peer transfers between Ovii users.
- Transaction PIN for authorizing financial operations.
- Comprehensive admin dashboard for managing users, wallets, and transactions.

## Technology Stack

The project is structured as a monorepo, comprising a Django backend and a Next.js frontend.

### Backend (`ovii_backend`)
- **Framework**: Django 5+
- **API**: Django REST Framework (DRF)
- **Authentication**: DRF Simple JWT (token-based)
- **Asynchronous Tasks**: Celery
- **Real-time Communication**: Django Channels
- **Database**: SQLite (development), PostgreSQL (production)
- **Message Broker/Cache**: Redis
- **Phone Number Validation**: `django-phonenumber-field`

### Frontend (`ovii-frontend`)
- **Framework**: Next.js 14+ (React)
- **UI**: Tailwind CSS

## Project Structure

- `ovii_backend/`: Contains the Django project for the REST API.
- `ovii-frontend/`: Contains the Next.js project for the user-facing web application.

## Building and Running

To set up and run the project locally, follow these steps:

### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis (running on default port `6379`)
- Git

### Backend Setup (`ovii_backend`)
1.  **Navigate to the backend directory**:
    ```bash
    cd ovii_backend
    ```
2.  **Create and activate a virtual environment**:
    ```bash
    python -m venv venv
    # On Windows
    venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```
3.  **Install Python dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Apply database migrations**:
    ```bash
    python manage.py migrate
    ```
5.  **Create a superuser**:
    ```bash
    python manage.py createsuperuser
    ```
6.  **Run the backend services** (each in a separate terminal):
    -   **Terminal 1: Django Server**
        ```bash
        python manage.py runserver
        ```
    -   **Terminal 2: Celery Worker**
        ```bash
        # On Windows
        celery -A ovii_backend worker -l info -P solo
        # On macOS/Linux
        celery -A ovii_backend worker -l info
        ```

### Frontend Setup (`ovii-frontend`)
1.  **Navigate to the frontend directory**:
    ```bash
    cd ovii-frontend
    ```
2.  **Install Node.js dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```

Access the frontend at `http://localhost:3000` and the backend API at `http://localhost:8000`.

## Development Conventions

- **Monorepo**: The project is organized into `ovii_backend` and `ovii-frontend` directories.
- **Authentication**: Relies on token-based authentication via DRF Simple JWT, with OTP for login.
- **Asynchronous Processing**: Celery is used for handling background tasks, improving responsiveness.
- **Real-time Features**: Django Channels facilitates real-time communication within the application.
- **Database Management**: SQLite is used for local development, with PostgreSQL designated for production environments.
- **UI/UX**: Frontend development adheres to modern practices using React with Next.js and styled with Tailwind CSS.
