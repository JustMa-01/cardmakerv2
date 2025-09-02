# --- Build Stage ---
# Use a slim Python image as a base for building
FROM python:3.9-slim as builder

# Set the working directory
WORKDIR /app

# Install build-time dependencies (if any)
# e.g., RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Copy requirements and install Python packages
# This is done first to leverage Docker's layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Final Stage ---
# Use a minimal base image for the final product
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy only the installed packages from the builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin/rembg /usr/local/bin/rembg

# Copy the application code and necessary assets
COPY app.py .
COPY Anton-Regular.ttf .
COPY static ./static
COPY templates ./templates

# Expose the port the app runs on
EXPOSE 5000

# Set the command to run the app using a production server (Gunicorn)
# Use a reasonable number of workers for your deployment environment
CMD ["gunicorn", "--workers=4", "--bind=0.0.0.0:5000", "app:app"]