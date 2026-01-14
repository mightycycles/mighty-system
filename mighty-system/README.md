# Mighty System

A production-ready multi-tenant SaaS booking platform for retail and service businesses.

## Features

- **Multi-tenancy**: Isolated data per tenant with subdomain routing
- **Clean Architecture**: Domain-driven design with separation of concerns
- **UK Compliance**: GDPR-compliant data handling with consent management
- **Real-time Availability**: Smart booking slot management
- **API-First**: RESTful API with OpenAPI documentation
- **Modern Stack**: TypeScript, Fastify, Next.js, Prisma, PostgreSQL

## Tech Stack

### Core
- TypeScript
- Node.js 20+
- PostgreSQL
- Redis (optional)

### Backend
- Fastify (API server)
- Prisma (ORM)
- JWT (authentication)
- Zod (validation)

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- TanStack Query

### Infrastructure
- Docker / Docker Compose
- Turborepo (monorepo)
- PostgreSQL + Redis

## Project Structure

```
mighty-system/
├── packages/
│   ├── core/           # Domain layer (entities, use cases)
│   ├── api/           # Fastify API server
│   └── web/           # Next.js frontend
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd mighty-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start infrastructure:
```bash
docker compose up -d postgres redis
```

5. Set up the database:
```bash
npm run db:generate
npm run db:push
```

6. Start development servers:
```bash
npm run dev
```

The API will be available at `http://localhost:3001` and the web app at `http://localhost:3000`.

### Production Deployment

1. Build containers:
```bash
docker compose build
```

2. Start services:
```bash
docker compose up -d
```

## API Documentation

Once the API is running, visit `http://localhost:3001/docs` for interactive API documentation.

## Key Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new tenant and owner
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Current user info

### Tenants
- `GET /api/v1/tenants` - Get current tenant
- `PUT /api/v1/tenants` - Update tenant
- `GET /api/v1/tenants/stats` - Get tenant statistics

### Bookings
- `GET /api/v1/bookings` - List bookings
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id` - Update booking
- `POST /api/v1/bookings/:id/cancel` - Cancel booking

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id/export` - Export customer data (GDPR)

### Services
- `GET /api/v1/services` - List services
- `POST /api/v1/services` - Create service
- `PUT /api/v1/services/:id` - Update service

### Staff
- `GET /api/v1/staff` - List staff members
- `POST /api/v1/staff` - Create staff member
- `PUT /api/v1/staff/:id` - Update staff member

## Multi-tenancy

Mighty System uses subdomain-based routing for multi-tenancy:
- `tenant1.mighty-system.com` → Tenant with slug "tenant1"
- `tenant2.mighty-system.com` → Tenant with slug "tenant2"

For local development, set `CORS_ORIGIN` to allow localhost origins.

## UK Compliance

### GDPR Features
- Customer data export endpoint
- Data deletion (soft and hard delete)
- Consent tracking with audit trail
- Right to be forgotten implementation

### Security
- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting
- CORS protection
- Helmet security headers

## Scripts

```bash
npm run dev           # Start development servers
npm run build         # Build all packages
npm run test          # Run tests
npm run lint          # Run linter
npm run format        # Format code with Prettier

npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio

docker:build          # Build Docker images
docker:up             # Start containers
docker:down           # Stop containers
```

## License

MIT
