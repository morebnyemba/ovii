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
    # libpq-dev provides header files for PostgreSQL \
    libpq-dev \
    # su-exec is a lightweight tool to drop root privileges
    su-exec \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file to leverage Docker's layer caching
COPY requirements.txt .

# Install Python dependencies into the virtual environment
# This is faster and more isolated than using the --user flag.
RUN pip install --no-cache-dir -r requirements.txt


# --- Stage 2: Final Application Image ---
# This stage creates the final, smaller image with the application and its dependencies.
FROM python:3.11-slim-bullseye as final

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Create a non-root user and group for better security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Set the PATH to use the virtual environment in the final image
ENV PATH="/opt/venv/bin:${PATH}"

# Create and set the working directory
WORKDIR /home/app/web

# Copy the entrypoint script first and make it executable.
# This script will run as root to set permissions before starting the app.
COPY ./entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy the rest of the application code and set ownership.
COPY --chown=appuser:appgroup . .

# The command to run the application is specified in docker-compose.yml,
# and will be executed by the entrypoint script.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]