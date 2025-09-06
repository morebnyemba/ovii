# ---- Builder Stage ----
# Use a specific, slim Python version for a smaller and more predictable base.
FROM python:3.11-slim as builder

# Set the working directory in the container.
WORKDIR /app

# Best practice: Upgrade pip to its latest version.
RUN pip install --upgrade pip

# Copy only the requirements file first to leverage Docker's layer cache.
# This layer is only rebuilt when requirements.txt changes.
COPY requirements.txt .

# Install dependencies into the user's home directory, not as root.
# --no-cache-dir keeps the image size down.
RUN pip install --no-cache-dir --user -r requirements.txt

# ---- Final Stage ----
# Use the same slim base for a lean final image.
FROM python:3.11-slim

WORKDIR /app

# Create a non-root user and group to run the application for security.
RUN useradd --create-home appuser
USER appuser

# Copy the installed packages from the builder stage.
COPY --from=builder /home/appuser/.local /home/appuser/.local

# Copy the application code into the container.
COPY . .

# Add the user's local bin to the PATH. This is where daphne is installed.
ENV PATH="/home/appuser/.local/bin:${PATH}"

# Expose the port the app runs on.
EXPOSE 8000

# Run the application with a production-grade ASGI server (Daphne).
# Replace 'ovii.asgi:application' with your project's ASGI entrypoint.
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "ovii.asgi:application"]
