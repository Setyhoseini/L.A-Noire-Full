# backend/Dockerfile
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Run the server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]