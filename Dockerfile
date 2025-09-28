# Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# --no-cache-dir ensures we don't store the download cache, keeping the image smaller
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# Tell the container to listen for requests on the port provided by Render
# The PORT environment variable is automatically set by Render
EXPOSE $PORT

# Run app.py when the container launches using Gunicorn
# --workers 1: Use a single worker process (safe for free tier memory)
# --bind 0.0.0.0:$PORT: Listen on all network interfaces on the port Render assigns
# app:app: Look for the 'app' object inside the 'app.py' file
# To this:
CMD gunicorn --workers 1 --bind 0.0.0.0:$PORT app:app