# Docker Setup Guide

This application is containerized using Docker with separate containers for the frontend and backend services.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Project Structure

```
form-check/
├── docker-compose.yml          # Orchestrates both services
├── frontend/
│   ├── Dockerfile             # Frontend container configuration
│   ├── nginx.conf             # Nginx configuration for serving built app
│   └── .dockerignore          # Files to exclude from frontend image
└── backend/
    ├── Dockerfile             # Backend container configuration
    └── .dockerignore          # Files to exclude from backend image
```

## Environment Setup

Before running the containers, ensure you have a `.env` file in the backend directory:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and add your actual Anthropic API key.

## Building and Running

### Build all containers

```bash
docker compose build
```

### Start all services

```bash
docker compose up
```

Or run in detached mode (background):

```bash
docker compose up -d
```

### View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop services

```bash
docker compose down
```

## Accessing the Application

Once running:
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Service Details

### Backend Service
- **Port**: 8000
- **Technology**: Python/FastAPI with Uvicorn
- **Health Check**: `http://localhost:8000/health`
- **Container Name**: form-check-backend

### Frontend Service
- **Port**: 80
- **Technology**: React built with Vite, served by Nginx
- **Health Check**: `http://localhost/`
- **Container Name**: form-check-frontend

## Development vs Production

### Development Mode

The current `docker-compose.yml` is configured for development with:
- Volume mounting for hot-reloading (backend)
- Environment set to `development`
- CORS configured for local development

### Production Mode

For production deployment:

1. Remove volume mounts from `docker-compose.yml`
2. Set `ENVIRONMENT=production` in backend service
3. Update `CORS_ORIGINS` to your production domain
4. Consider using Docker secrets for sensitive data
5. Use a reverse proxy (like Traefik or Nginx) in front of the services

## Troubleshooting

### Backend won't start
- Check that `.env` file exists in backend directory
- Verify your Anthropic API key is set correctly
- Check logs: `docker compose logs backend`

### Frontend can't connect to backend
- Ensure both services are running: `docker compose ps`
- Check network connectivity: `docker compose exec frontend ping backend`
- Verify CORS settings in backend

### Build fails
- Clear Docker cache: `docker compose build --no-cache`
- Check that all required files are present
- Ensure you have enough disk space

### Port conflicts
If ports 80 or 8000 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "3000:80"  # Frontend now on port 3000
  - "8001:8000"  # Backend now on port 8001
```

## Useful Commands

```bash
# Rebuild a specific service
docker compose build backend

# Restart a specific service
docker compose restart backend

# Execute commands in a running container
docker compose exec backend python -m pytest

# View container resource usage
docker compose stats

# Remove all containers, networks, and volumes
docker compose down -v
```

## Network Architecture

The services communicate via a Docker bridge network (`app-network`):
- Frontend → Backend: Uses service name `backend` as hostname
- Host → Frontend: http://localhost
- Host → Backend: http://localhost:8000

## Health Checks

Both services have health checks configured:
- **Backend**: Checks `/health` endpoint every 30s
- **Frontend**: Checks root `/` endpoint every 30s

The frontend service waits for the backend to be healthy before starting.
