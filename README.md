# Rentora Nepal - Full Stack Platform

A comprehensive rental and marketplace platform replicating the features of rentoranepal.com, built with modern web technologies.

## Features

### 🏠 Property Rentals
- Search and filter properties by location, price, type, amenities
- Detailed property listings with images, maps, and reviews
- Booking system with availability calendar
- Host dashboard for managing listings

### 🔧 Professional Services
- Book home services (electricians, plumbers, cleaners, doctors)
- Service provider profiles with ratings and reviews
- Scheduling and confirmation system

### 🛒 Marketplace
- Buy and sell pre-owned electronics and items
- Category-based browsing and search
- Direct messaging between buyers and sellers

### ⭐ Reviews & Ratings
- Review properties and services
- Verified review system
- Average ratings displayed on listings

### 📊 Admin Dashboard
- User management
- Property verification
- Analytics and reporting
- Contact form submissions

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management

### Backend
- **Bun** - Fast JavaScript runtime
- **Hono** - Lightweight web framework
- **Prisma** - Database ORM
- **Zod** - Schema validation

### Infrastructure
- **PostgreSQL** - Primary database with PostGIS
- **Redis** - Caching and session store
- **Typesense** - Fast search engine
- **MinIO** - Object storage for images
- **BullMQ** - Job queues
- **Prometheus + Grafana** - Monitoring and metrics

## Project Structure

```
rentora-platform/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   └── backend/           # Hono + Bun API server
├── packages/
│   ├── database/          # Prisma schema and client
│   └── types/            # Shared TypeScript types
├── infrastructure/        # Docker and monitoring configs
├── docker-compose.yml     # All services orchestration
└── README.md
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Bun (for local development)
- Node.js 20+ (for frontend)

### Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd rentora-platform
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start all services:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
docker-compose exec backend bun run db:migrate
```

5. Seed the database:
```bash
docker-compose exec backend bun run db:seed
```

6. Access the applications:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PGAdmin: http://localhost:5050
   - Grafana: http://localhost:3001
   - Bull Board: http://localhost:3002
   - Typesense: http://localhost:8108
   - MinIO: http://localhost:9000

### Local Development

1. Install dependencies:
```bash
bun install
```

2. Start infrastructure services:
```bash
docker-compose up postgres redis typesense minio -d
```

3. Setup database:
```bash
cd packages/database
bun run migrate
bun run db:seed
```

4. Start backend:
```bash
cd apps/backend
bun run dev
```

5. Start frontend:
```bash
cd apps/frontend
npm run dev
```

## API Documentation

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Properties
- `GET /api/v1/properties` - List properties
- `GET /api/v1/properties/:id` - Get property details
- `POST /api/v1/properties` - Create property
- `PUT /api/v1/properties/:id` - Update property
- `DELETE /api/v1/properties/:id` - Delete property

### Bookings
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings/my` - Get my bookings
- `GET /api/v1/bookings/host` - Get host bookings
- `PATCH /api/v1/bookings/:id/confirm` - Confirm booking
- `PATCH /api/v1/bookings/:id/cancel` - Cancel booking

### Services
- `GET /api/v1/services/categories` - List service categories
- `GET /api/v1/services` - List services
- `POST /api/v1/services/bookings` - Book service
- `GET /api/v1/services/bookings/my` - Get my service bookings

### Marketplace
- `GET /api/v1/marketplace` - List items
- `GET /api/v1/marketplace/:id` - Get item details
- `POST /api/v1/marketplace` - Create listing

### Search
- `GET /api/v1/search/properties?q=` - Search properties
- `GET /api/v1/search/marketplace?q=` - Search marketplace
- `GET /api/v1/search/suggestions?q=` - Autocomplete

## Database Schema

The database uses PostgreSQL with the following main entities:

- **Users** - Platform users with roles (USER, HOST, ADMIN)
- **Properties** - Rental listings with images, amenities, location
- **PropertyBookings** - Booking records with dates and status
- **ServiceCategories** & **Services** - Professional services
- **ServiceBookings** - Service appointment bookings
- **MarketplaceItems** - Items for sale
- **Reviews** - User reviews for properties and services
- **Conversations** & **Messages** - User messaging

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rentora_db

# Redis
REDIS_URL=redis://localhost:6379

# Typesense
TYPESENSE_API_KEY=rentora-typesense-api-key
TYPESENSE_HOST=localhost

# MinIO
MINIO_ENDPOINT=localhost
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MINIO_URL=http://localhost:9000
```

## Deployment

### Vercel (Frontend)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Docker (Backend)
```bash
docker build -t rentora-backend -f apps/backend/Dockerfile .
docker run -p 3001:3001 --env-file .env rentora-backend
```

### Production Checklist
- [ ] Change default JWT secrets
- [ ] Enable HTTPS
- [ ] Configure email service (SMTP)
- [ ] Set up backup for PostgreSQL
- [ ] Configure MinIO for production
- [ ] Enable rate limiting
- [ ] Set up log aggregation

## Monitoring

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Bull Board**: http://localhost:3002 (Redis queues)

Default Grafana dashboards include:
- API request metrics
- Database performance
- Redis metrics
- System resources

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@rentora.com or join our Slack channel.