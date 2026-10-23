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

# Copy frontend appConfig.json, seed data, and public assets so Django settings/checklists/emails can load them
# BASE_DIR = /app  →  BASE_DIR.parent = /  →  paths = /frontend/...
RUN mkdir -p /frontend/src/config /frontend/src/data /frontend/public
COPY frontend/src/config/appConfig.json /frontend/src/config/appConfig.json
COPY frontend/src/data/ /frontend/src/data/
COPY frontend/public/logo-white-text.png /frontend/public/logo-white-text.png

# Make entrypoint executable
RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
