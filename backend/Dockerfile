FROM python:3.11-slim

# Install system dependencies for mysqlclient
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    gcc \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full backend source
COPY backend/ .

# Copy frontend appConfig.json so Django settings can load it at import time
# Django settings.py resolves: BASE_DIR.parent / 'frontend' / 'src' / 'config' / 'appConfig.json'
# BASE_DIR = /app  →  BASE_DIR.parent = /  →  path = /frontend/src/config/appConfig.json
RUN mkdir -p /frontend/src/config
COPY frontend/src/config/appConfig.json /frontend/src/config/appConfig.json

# Make entrypoint executable
RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
