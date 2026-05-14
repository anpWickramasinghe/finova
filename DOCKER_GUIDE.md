# Finova Docker Setup Guide

This document provides complete instructions on how to build, run, and manage the Finova Intelligent Platform using Docker. 

## Prerequisites
- Docker
- Docker Compose V2

## Architecture Overview

The Finova platform is fully dockerized and consists of the following microservices configured in the root `docker-compose.yml`:

| Service | Container Name | Host Port | Internal Port | Description |
|---------|----------------|-----------|---------------|-------------|
| **Backend API** | `finova-backend` | `5001` | `5000` | Node.js Main API Gateway & Auth |
| **Admin Portal** | `finova-admin-portal` | `8081` | `80` | React web application for Admins |
| **Manager Portal** | `finova-manager-portal` | `8082` | `80` | React web application for Managers |
| **Employee Portal** | `finova-employee-portal` | `8083` | `80` | Web/Expo application for Employees |
| **AI Chatbot** | `finova-ai-chatbot` | `8000` | `8000` | Python/FastAPI Agno Assistant |
| **AI Forecasting** | `finova-ai-forecasting` | `8001` | `8001` | Python/FastAPI Cash Flow Predictor |

## Environment Configuration

Before starting the services, ensure that the `.env` files are configured in their respective directories. You can usually copy the provided `.env.example` files:

- **Backend:** `backend/.env`
- **AI Chatbot:** `ai-core/chatbot/.env`
- **AI Forecasting:** `ai-core/forecasting/.env`

## Running the Application

### Start All Services
To build the images and start all services in detached mode (running in the background), run the following command from the root directory:

```bash
docker compose up --build -d
```

### Start Specific Services
If you are developing and only want to start specific components (e.g., just the backend and the AI core):

```bash
docker compose up --build -d backend ai-chatbot ai-forecasting
```

## Managing Services

### View Logs
To view the aggregated logs for all services in real-time:
```bash
docker compose logs -f
```

To view logs for a specific service (e.g., the chatbot):
```bash
docker compose logs -f ai-chatbot
```

### Stop Services
To safely stop and remove all running containers and networks defined in the `docker-compose.yml`:
```bash
docker compose down
```

## Rebuilding & Development

If you make changes to the source code or install new dependencies, you need to rebuild the specific service image to reflect the changes:

```bash
# Rebuild and restart just the backend
docker compose up --build -d backend

# Rebuild and restart the employee portal
docker compose up --build -d employee-portal
```
