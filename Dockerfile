# Use a compatible Python base image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy your files
COPY . /app

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Expose port (Railway uses 8080 by default)
EXPOSE 8080

# Start the Flask app using gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8080"]
