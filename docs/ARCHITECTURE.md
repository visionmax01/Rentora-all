# Rentora Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Web App    │  │  Mobile App  │  │     Admin Panel      │  │
│  │  (Next.js)   │  │   (Future)   │  │      (Next.js)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼────────────────────┼──────────────┘
          │                 │                    │
          └─────────────────┴────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  API Gateway  │
                    │   (Hono.js)   │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   ┌──────▼──────┐ ┌───────▼────────┐ ┌──────▼──────┐
   │   Auth      │ │   Business     │ │  Background │
   │   Service   │ │    Logic       │ │   Workers   │
   │  (JWT/Redis)│ │  (Prisma/DB)   │ │   (BullMQ)  │
   └──────┬──────┘ └───────┬────────┘ └──────┬──────┘
          │                │                  │
          └────────────────┼──────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼─────┐
   │ PostgreSQL  │ │    Redis    │ │  Typesense │
   │  (Primary   │ │  (Cache &   │ │  (Search   │
   │   Database) │ │   Sessions) │ │   Engine)  │
   └─────────────┘ └─────────────┘ └────────────┘
          │
   ┌──────▼──────┐
   │    MinIO    │
   │(File Storage)│
   └─────────────┘
```

## Architecture Patterns

### 1. Monorepo Structure
```
rentora-platform/
├── apps/
│   ├── frontend/     # Next.js application
│   └── backend/      # Hono API server
├── packages/
│   ├── database/     # Prisma schema & client
│   └── types/        # Shared TypeScript types
```

### 2. API Design (RESTful)
- Versioned API (`/api/v1/`)
- Resource-based routing
- Consistent response format:
  ```json
  {
    "success": true,
    "data": {},
    "meta": {},
    "error": {}
  }
  ```

### 3. Authentication Flow
```
Client → Login → JWT Access Token + Refresh Token
              ↓
       Store in localStorage
              ↓
   API Requests (Bearer Token)
              ↓
   Token Expired → Refresh Endpoint
              ↓
         New Access Token
```

### 4. Search Architecture (Typesense)
- Real-time indexing on data changes
- Faceted search for filters
- Geo-search for location-based queries
- Typo-tolerant search

### 5. File Upload Flow
```
Client → Presigned URL → Upload to MinIO
              ↓
       Store URL in Database
              ↓
   Serve via CDN/MinIO
```

### 6. Background Jobs (BullMQ)
- Email notifications
- Image processing
- Search index updates
- Data exports

## Data Flow

### Property Listing Creation
```
1. Host submits property form
2. Backend validates & saves to PostgreSQL
3. Images uploaded to MinIO
4. Property indexed in Typesense
5. Notification sent to admins for verification
6. Upon approval, listing goes live
```

### Booking Flow
```
1. Guest selects dates and submits booking
2. Backend checks availability
3. Booking created with PENDING status
4. Host notified
5. Host confirms booking
6. Guest receives confirmation
7. Payment processed (future)
```

## Security Measures

1. **Authentication**
   - JWT with short expiry (15 min)
   - Refresh tokens (7 days)
   - Password hashing (bcrypt)

2. **Authorization**
   - Role-based access control
   - Resource ownership checks
   - API rate limiting

3. **Data Protection**
   - Input validation (Zod)
   - SQL injection prevention (Prisma)
   - XSS protection (Next.js built-in)
   - CORS configuration

4. **Infrastructure**
   - Docker network isolation
   - Environment variable secrets
   - HTTPS in production

## Scalability Considerations

1. **Horizontal Scaling**
   - Stateless API servers
   - Redis session store
   - Load balancer ready

2. **Database**
   - Read replicas for queries
   - Connection pooling
   - Query optimization

3. **Caching Strategy**
   - Redis for sessions and cache
   - CDN for static assets
   - API response caching

4. **Search Scaling**
   - Typesense clustering
   - Async indexing

## Monitoring & Observability

1. **Metrics**
   - Prometheus for system metrics
   - Custom business metrics
   - API latency tracking

2. **Logging**
   - Structured logging
   - Request tracing
   - Error tracking

3. **Alerting**
   - Grafana alerts
   - Error rate thresholds
   - Infrastructure health

## Future Enhancements

1. **Microservices**
   - Split into domain services
   - Event-driven architecture
   - Service mesh

2. **Real-time Features**
   - WebSocket for chat
   - Live notifications
   - Real-time availability

3. **AI/ML**
   - Property recommendations
   - Price predictions
   - Content moderation

4. **Mobile**
   - React Native app
   - Push notifications
   - Offline support