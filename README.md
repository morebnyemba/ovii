# Ovii - Fintech Wallet & Payment Gateway

---

&copy; 2025 Moreblessing Nyemba & Ovii. All Rights Reserved.

**Author**: Moreblessing Nyemba (+263787211325)

**Intellectual Property Notice**: This software and all its components are the intellectual property of Ovii. Unauthorized copying, distribution, or use of this software, or any part thereof, is strictly prohibited.

---

## 🚀 The Vision: Building Flow

Ovii is not just another payments app. We are building a wallet that moves like people move—for the creators, freelancers, vendors, and everyday hustlers across Zimbabwe and beyond. The mission is simple: **people don’t need banks; they need flow.**

Our job is to deliver a clean, fast, and trusted way to send, receive, and manage money, optimized for the generation that lives on their phones.

This repository contains the full source code for both the backend API and the frontend web application.

## 🗺️ The Roadmap: Proof, Growth, Scale

This project is structured in clear phases to deliver value incrementally.

### Phase 1: The Foundation (MVP)
*This phase delivers the core functionality required for a market-ready product.*

-   **Secure Onboarding**: Mobile-first, two-step OTP-based account creation and login.
-   **Wallet Creation**: Automatic wallet generation for every new user.
-   **Peer-to-Peer Transfers**: Instant and secure transfers between Ovii users.
-   **Transaction PIN**: A separate, secure PIN for authorizing all financial transactions.
-   **Admin Dashboard**: A comprehensive admin panel to manage users, wallets, and transactions.

### Phase 2: The Growth Tools
*This phase focuses on building trust and enabling user growth.*

-   **Tiered KYC Verification**: A multi-level KYC system (from mobile-verified to identity and address verified) with corresponding transaction limits.
-   **KYC Document Uploads**: A secure API endpoint for users to submit verification documents.
-   **Admin KYC Approval**: Custom admin actions for the compliance team to efficiently review documents and upgrade user verification levels.
-   **Real-time Notifications**: WebSocket-based notifications for key events like KYC approval.
-   **Referral System**: A simple mechanism to incentivize user growth.
-   **Basic Analytics**: A dashboard for admins to track core growth metrics.

### Phase 3: The Scale (Future Vision)
*With a proven product, this phase will focus on expansion and automation. This will be planned and budgeted for separately.*

-   **Dedicated Mobile App**
-   **Public API & Webhooks** for merchant integrations.
-   **Bulk Payouts** for business clients.
-   **Automated Workflows** for compliance and support.
-   **Geographic Expansion**.

---

## 🛠️ Technology Stack

### Backend (`ovii_backend`)

-   **Framework**: Django 5+
-   **API**: Django REST Framework (DRF)
-   **Authentication**: DRF Simple JWT (for token-based auth)
-   **Asynchronous Tasks**: Celery
-   **Real-time Communication**: Django Channels
-   **Database**: SQLite (development), PostgreSQL (production)
-   **Message Broker/Cache**: Redis
-   **Phone Number Validation**: `django-phonenumber-field`

### Frontend (`ovii-frontend`)

-   **Framework**: Next.js 14+ (React)
-   **UI**: Tailwind CSS

---

## 📂 Project Structure

The project is structured as a monorepo with two primary directories:

-   `ovii_backend/`: Contains the Django project that serves the REST API.
-   `ovii-frontend/`: Contains the Next.js project for the user-facing web application.

---

## ⚙️ Local Development Setup

Follow these steps to set up and run the project locally for development.

### Prerequisites

-   Python 3.11+
-   Node.js 18+
-   **Redis**: Must be running on the default port `6379`.
-   Git

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

You can now access the frontend at `http://localhost:3000` and the backend API at `http://localhost:8000`.
