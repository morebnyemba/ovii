# ovii_backend/Dockerfile
# --- Stage 1: Builder ---
# --- Stage 1: Builder ---
# This stage installs dependencies into a virtual environment to keep the final image slim.
FROM python:3.11-slim-bullseye AS builder

# Set environment variables to improve container-friendliness
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Create and activate a virtual environment in a standard location
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

# Install system dependencies required for Python packages (e.g., psycopg2 for PostgreSQL)
# Using --no-install-recommends keeps the image size down.
RUN apt-get update && apt-get install -y --no-install-recommends \
    # build-essential is needed for compiling some Python packages with C extensions
    build-essential \
    # libpq-dev provides header files for PostgreSQL
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file to leverage Docker's layer caching
COPY requirements.txt .

# Install Python dependencies into the virtual environment.
# It's recommended to include psycopg2-binary in your requirements.txt
RUN pip install --no-cache-dir -r requirements.txt


# --- Stage 2: Final Application Image ---
# This stage creates the final, smaller image with the application and its dependencies.
FROM python:3.11-slim-bullseye AS final

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Create a non-root user and group for security
RUN addgroup --system app && adduser --system --group app

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Set the PATH to use the virtual environment in the final image
ENV PATH="/opt/venv/bin:${PATH}"

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && rm -rf /var/lib/apt/lists/*

# Create and set the working directory
WORKDIR /home/app/web

# Copy the application code.
# Use a .dockerignore file to exclude unnecessary files.
COPY --chown=app:app . .

# Create directories for volumes and set permissions before switching user.
# This ensures the non-root 'app' user can write to these directories.
RUN mkdir -p /home/app/web/staticfiles /home/app/web/mediafiles && \
    chown -R app:app /home/app/web/staticfiles && \
    chown -R app:app /home/app/web/mediafiles

# Switch to the non-root user
USER app