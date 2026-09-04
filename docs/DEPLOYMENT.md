# NeuralFlow V5 - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Cloud Deployments](#cloud-deployments)
7. [Environment Configuration](#environment-configuration)
8. [Security Hardening](#security-hardening)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup & Recovery](#backup--recovery)
11. [Troubleshooting](#troubleshooting)

## Overview

This guide covers all deployment scenarios for NeuralFlow V5, from local development to production cloud deployments.

### Deployment Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
      │ Instance 1│    │Instance 2│    │Instance 3│
      └───────────┘    └──────────┘    └──────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Persistent     │
                    │  Storage (Logs, │
                    │  Models)        │
                    └─────────────────┘
```

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Disk: 10GB
- OS: Linux, macOS, Windows

**Recommended:**
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 20GB+ SSD
- OS: Linux (Ubuntu 20.04+, CentOS 8+)

### Software Requirements

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Docker 20.10+ (for containerized deployment)
- Kubernetes 1.21+ (for K8s deployment)
- Git

## Local Development

### Step 1: Clone Repository

```bash
git clone https://github.com/neuralflow/v5.git
cd v5
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm run install-all

# Or install separately
npm install --prefix backend
npm install --prefix frontend
```

### Step 3: Environment Configuration

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
```

### Step 4: Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access Points

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

## Docker Deployment

### Single Container Deployment

#### Step 1: Build Image

```bash
docker build -t neuralflow:v5 .
```

#### Step 2: Run Container

```bash
docker run -d \
  --name neuralflow \
  -p 3001:3001 \
  -p 4000:4000 \
  -p 5100:5100 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -v neuralflow-logs:/app/backend/logs \
  -v neuralflow-models:/app/backend/models \
  --restart unless-stopped \
  neuralflow:v5
```

#### Step 3: Verify Deployment

```bash
# Check container status
docker ps | grep neuralflow

# View logs
docker logs neuralflow

# Health check
curl http://localhost:3001/api/health
```

### Docker Compose Deployment

#### Step 1: Create docker-compose.yml

```yaml
version: '3.8'

services:
  neuralflow:
    build: .
    ports:
      - "3001:3001"
      - "4000:4000"
      - "5100:5100"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    volumes:
      - neuralflow-logs:/app/backend/logs
      - neuralflow-models:/app/backend/models
    restart: unless-stopped

volumes:
  neuralflow-logs:
  neuralflow-models:
```

#### Step 2: Deploy

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.21+)
- kubectl configured
- Container registry access

### Step 1: Build and Push Image

```bash
# Build image
docker build -t your-registry/neuralflow:v5 .

# Push to registry
docker push your-registry/neuralflow:v5
```

### Step 2: Create Namespace

```bash
kubectl create namespace neuralflow
```

### Step 3: Create Secrets

```bash
# Create API key secret
kubectl create secret generic neuralflow-secrets \
  --from-literal=api-key=your-secret-api-key \
  -n neuralflow
```

### Step 4: Deploy Application

```bash
# Apply configurations
kubectl apply -f k8s/deployment.yaml -n neuralflow
kubectl apply -f k8s/service.yaml -n neuralflow
kubectl apply -f k8s/ingress.yaml -n neuralflow
```

### Step 5: Verify Deployment

```bash
# Check pods
kubectl get pods -n neuralflow

# Check services
kubectl get svc -n neuralflow

# View logs
kubectl logs -f deployment/neuralflow -n neuralflow

# Port forward for testing
kubectl port-forward svc/neuralflow-service 3001:80 -n neuralflow
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment neuralflow --replicas=5 -n neuralflow

# Auto-scaling (HPA already configured)
kubectl get hpa -n neuralflow
```

## Cloud Deployments

### AWS Deployment

#### ECS Fargate

```bash
# Create ECR repository
aws ecr create-repository --repository-name neuralflow

# Build and push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URI
docker build -t neuralflow:v5 .
docker tag neuralflow:v5 YOUR_ECR_URI/neuralflow:v5
docker push YOUR_ECR_URI/neuralflow:v5

# Create ECS service (use AWS Console or CLI)
aws ecs create-service \
  --cluster neuralflow-cluster \
  --service-name neuralflow \
  --task-definition neuralflow:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Elastic Beanstalk

```bash
# Initialize EB
eb init neuralflow --platform node.js --region us-east-1

# Create environment
eb create production-env

# Deploy
eb deploy
```

### Google Cloud Platform

#### Cloud Run

```bash
# Build and submit
gcloud builds submit --tag gcr.io/PROJECT_ID/neuralflow

# Deploy
gcloud run deploy neuralflow \
  --image gcr.io/PROJECT_ID/neuralflow \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

#### GKE

```bash
# Create cluster
gcloud container clusters create neuralflow-cluster \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --region us-central1

# Get credentials
gcloud container clusters get-credentials neuralflow-cluster

# Deploy (follow Kubernetes steps above)
```

### Microsoft Azure

#### Azure Container Instances

```bash
# Create resource group
az group create --name neuralflow-rg --location eastus

# Create container
az container create \
  --resource-group neuralflow-rg \
  --name neuralflow \
  --image your-registry/neuralflow:v5 \
  --cpu 2 \
  --memory 4 \
  --ports 3001 4000 5100 \
  --environment-variables NODE_ENV=production
```

#### AKS

```bash
# Create AKS cluster
az aks create \
  --resource-group neuralflow-rg \
  --name neuralflow-cluster \
  --node-count 3 \
  --enable-addons monitoring

# Get credentials
az aks get-credentials --resource-group neuralflow-rg --name neuralflow-cluster

# Deploy (follow Kubernetes steps above)
```

## Environment Configuration

### Production Environment Variables

```env
# Server
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Security
API_KEY=your-strong-secret-key-here
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Neural Network
TRAINING_SAMPLES=500
TRAINING_EPOCHS=300
LEARNING_RATE=0.01

# Monitoring
REFRESH_INTERVAL=2000
ALERT_THRESHOLD=300
DETECTION_SENSITIVITY=0.85

# Integrations
WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
SLACK_NOTIFICATIONS=true

# Database (if applicable)
DATABASE_URL=postgresql://user:pass@host:5432/neuralflow

# Cache (if applicable)
REDIS_URL=redis://host:6379
```

### Configuration Management

#### Using AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret \
  --name neuralflow/api-key \
  --secret-string "your-secret-key"

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id neuralflow/api-key \
  --query SecretString \
  --output text
```

#### Using Kubernetes Secrets

```bash
# Create from file
kubectl create secret generic neuralflow-config \
  --from-env-file=.env.production \
  -n neuralflow

# Use in deployment
# (see k8s/deployment.yaml for examples)
```

## Security Hardening

### SSL/TLS Configuration

#### Let's Encrypt with Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.neuralflow.io;

    ssl_certificate /etc/letsencrypt/live/api.neuralflow.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.neuralflow.io/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Firewall Rules

```bash
# Allow only necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw deny 3001/tcp  # Internal port
ufw enable
```

### Security Headers

Already configured in `middleware/security.js`:

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Referrer-Policy

### Rate Limiting

Configured per endpoint:
- Global: 100 req/min
- API: 60 req/min
- Attack simulation: 10 req/min

## Monitoring & Logging

### Centralized Logging

#### ELK Stack

```yaml
# docker-compose-logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
```

#### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'neuralflow'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
```

### Health Monitoring

```bash
# Uptime monitoring
curl -fsS --retry 3 https://api.neuralflow.io/api/health || exit 1

# Cron job for monitoring
*/5 * * * * /usr/local/bin/check-neuralflow-health.sh
```

## Backup & Recovery

### Backup Strategy

#### Logs Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf neuralflow-logs-$DATE.tar.gz backend/logs/
aws s3 cp neuralflow-logs-$DATE.tar.gz s3://neuralflow-backups/logs/
```

#### Model Backup

```bash
# Backup trained models
tar -czf neuralflow-models-$DATE.tar.gz backend/models/
aws s3 cp neuralflow-models-$DATE.tar.gz s3://neuralflow-backups/models/
```

### Disaster Recovery

#### RTO/RPO Targets

- Recovery Time Objective (RTO): < 1 hour
- Recovery Point Objective (RPO): < 15 minutes

#### Recovery Procedure

1. Deploy new instance from Docker image
2. Restore latest model backup
3. Restore configuration from secrets manager
4. Update DNS/load balancer
5. Verify health checks pass
6. Monitor for 30 minutes

## Troubleshooting

### Common Issues

#### High CPU Usage

```bash
# Check process
top -p $(pgrep -f "node.*server.js")

# Review logs
tail -f backend/logs/neuralflow.log | grep ERROR

# Restart service
docker restart neuralflow
```

#### Memory Leaks

```bash
# Monitor memory
docker stats neuralflow

# Heap snapshot
node --inspect backend/src/server.js
```

#### Port Conflicts

```bash
# Find process
lsof -ti:3001
netstat -ano | findstr :3001

# Kill process
kill -9 <PID>
```

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug docker run ...

# Node.js inspector
node --inspect=0.0.0.0:9229 backend/src/server.js
```

### Support

For deployment issues:
- Check logs first
- Review system metrics
- Verify environment variables
- Test network connectivity
- Contact support: deploy@neuralflow.io

---

**Last Updated**: December 2024  
**Version**: 5.0.0
