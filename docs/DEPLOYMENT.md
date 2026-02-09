# Rentora Platform Deployment Guide

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Cloud Deployment](#cloud-deployment)

## Local Development

### Prerequisites
- Docker 24.0+
- Docker Compose 2.0+
- Bun 1.1+
- Node.js 20+

### Quick Start

```bash
# 1. Clone repository
git clone <repository>
cd rentora-platform

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Run migrations
docker-compose exec backend bun run db:migrate

# 5. Seed database
docker-compose exec backend bun run db:seed

# 6. Setup Typesense collections
cd packages/types && bun run setup:schema
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PGAdmin**: http://localhost:5050 (admin@rentora.com / admin123)
- **Grafana**: http://localhost:3001 (admin / admin123)
- **Bull Board**: http://localhost:3002
- **Typesense**: http://localhost:8108
- **MinIO**: http://localhost:9000 (minioadmin / minioadmin)
- **Redis Commander**: http://localhost:8081
- **Prometheus**: http://localhost:9090

## Docker Deployment

### Build Images

```bash
# Build backend
docker build -t rentora-backend -f apps/backend/Dockerfile .

# Build frontend
docker build -t rentora-frontend -f apps/frontend/Dockerfile .
```

### Run Containers

```bash
# Run backend
docker run -d \
  --name rentora-backend \
  -p 3001:3001 \
  --env-file .env \
  rentora-backend

# Run frontend
docker run -d \
  --name rentora-frontend \
  -p 3000:3000 \
  --env-file .env \
  rentora-frontend
```

## Production Deployment

### Environment Variables

Create a production `.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@db-host:5432/rentora_db

# Security
JWT_SECRET=<random-256-bit-key>
JWT_REFRESH_SECRET=<random-256-bit-key>

# Services
REDIS_URL=redis://redis-host:6379
TYPESENSE_API_KEY=<strong-api-key>
TYPESENSE_HOST=typesense-host

# MinIO
MINIO_ENDPOINT=minio-host
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>

# Frontend
NEXT_PUBLIC_API_URL=https://api.rentora.com
NEXT_PUBLIC_APP_URL=https://rentora.com
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  backend:
    image: rentora-backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3001:3001"
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: rentora-frontend:latest
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    ports:
      - "3000:3000"
    restart: always

  # Use managed services for production:
  # - AWS RDS / Google Cloud SQL for PostgreSQL
  # - AWS ElastiCache / Redis Cloud for Redis
  # - Typesense Cloud for search
  # - AWS S3 / Cloudflare R2 for storage
```

## Cloud Deployment

### Vercel (Frontend)

1. Connect GitHub repository to Vercel
2. Set root directory to `apps/frontend`
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.rentora.com
   NEXT_PUBLIC_MINIO_URL=https://storage.rentora.com
   ```
4. Deploy

### Railway / Render (Backend)

1. Create new project
2. Connect repository
3. Set environment variables
4. Deploy

### AWS Deployment

#### Using ECS (Elastic Container Service)

```bash
# Create ECR repositories
aws ecr create-repository --repository-name rentora-backend
aws ecr create-repository --repository-name rentora-frontend

# Build and push images
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker build -t rentora-backend -f apps/backend/Dockerfile .
docker tag rentora-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/rentora-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/rentora-backend:latest
```

#### Using EC2

```bash
# Launch EC2 instance with Docker
# SSH into instance
git clone <repository>
cd rentora-platform
docker-compose -f docker-compose.prod.yml up -d
```

### DigitalOcean App Platform

Create `app.yaml`:

```yaml
name: rentora-platform
services:
  - name: backend
    source_dir: apps/backend
    github:
      repo: your-org/rentora
      branch: main
    build_command: bun install && bun run build
    run_command: bun run start
    envs:
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: JWT_SECRET
        generate: true
    
  - name: frontend
    source_dir: apps/frontend
    github:
      repo: your-org/rentora
      branch: main
    build_command: npm install && npm run build
    output_dir: .next
    envs:
      - key: NEXT_PUBLIC_API_URL
        value: ${backend.PUBLIC_URL}

databases:
  - name: db
    engine: PG
    version: "16"
```

## SSL/TLS Configuration

### Using Let's Encrypt with Nginx

```nginx
server {
    listen 80;
    server_name rentora.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rentora.com;

    ssl_certificate /etc/letsencrypt/live/rentora.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rentora.com/privkey.pem;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Database Migrations

### Production Migration

```bash
# Always backup first
docker-compose exec postgres pg_dump -U postgres rentora_db > backup.sql

# Run migrations
docker-compose exec backend bun run db:migrate:prod

# If rollback needed
docker-compose exec backend bunx prisma migrate resolve --rolled-back <migration-name>
```

## Monitoring Setup

### Prometheus & Grafana

Already included in docker-compose.yml. For production:

1. Use Grafana Cloud or self-hosted Grafana
2. Configure alerts for:
   - High error rates
   - API latency > 1s
   - Database connection failures
   - Disk space < 20%

### Health Checks

Backend health endpoint: `GET /health`

```bash
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
```

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres rentora_db > backups/rentora_$DATE.sql
# Upload to S3
aws s3 cp backups/rentora_$DATE.sql s3://rentora-backups/
```

### MinIO Backups

```bash
# Sync to S3
mc mirror minio/rentora-storage s3/rentora-backups
```

## Troubleshooting

### Common Issues

1. **Database connection refused**
   - Check if postgres container is running
   - Verify DATABASE_URL format

2. **Typesense connection error**
   - Ensure Typesense is running: `docker-compose ps typesense`
   - Check API key matches

3. **MinIO upload fails**
   - Verify bucket exists and is public
   - Check CORS settings

4. **Frontend can't connect to API**
   - Verify NEXT_PUBLIC_API_URL
   - Check CORS_ORIGIN in backend

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up DDoS protection (Cloudflare)
- [ ] Enable database encryption at rest
- [ ] Rotate API keys regularly
- [ ] Enable audit logging
- [ ] Set up intrusion detection
- [ ] Regular security scans

## Performance Optimization

1. **Enable CDN** for static assets
2. **Database indexing** - ensure proper indexes
3. **Redis caching** - cache frequent queries
4. **Image optimization** - WebP format, lazy loading
5. **API pagination** - never return all records
6. **Connection pooling** - use PgBouncer for Postgres