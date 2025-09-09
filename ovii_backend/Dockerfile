# ovii_backend/Dockerfile

# --- Stage 1: Builder ---
# This stage installs dependencies into a virtual environment to keep the final image slim.
FROM python:3.11-slim-bullseye as builder

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

# Install Python dependencies into the virtual environment
# This is faster and more isolated than using the --user flag.
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir psycopg2-binary


# --- Stage 2: Final Application Image ---
# This stage creates the final, smaller image with the application and its dependencies.
FROM python:3.11-slim-bullseye as final

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Set the PATH to use the virtual environment in the final image
ENV PATH="/opt/venv/bin:${PATH}"

# Create and set the working directory
WORKDIR /home/app/web

# Create the logs directory so the RotatingFileHandler can write to it.
RUN mkdir -p logs

# Copy the application code.
# The user is root, so no chown is needed.
COPY . .