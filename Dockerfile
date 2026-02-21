# Multi-stage build: Frontend (nginx) + API (uvicorn)
# Stage 1: Build frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with production API URL
ARG VITE_API_BASE=https://api.argonanalytics.org
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# Stage 2: Final image with nginx + uvicorn
FROM python:3.11-slim

WORKDIR /app

# Install nginx, supervisor, and curl for healthcheck
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY api/requirements.txt ./api/
RUN pip install --no-cache-dir -r api/requirements.txt

# Copy API code
COPY api/ ./api/
COPY simulation/ ./simulation/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy supervisor config
COPY deploy/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Remove default nginx config
RUN rm -f /etc/nginx/sites-enabled/default

# Expose ports
EXPOSE 3005 8000

# Healthcheck on API
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
