# PrintAI Platform

AI-powered print-on-demand platform for custom T-shirt designs.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache & Queue**: Redis, BullMQ
- **Authentication**: NextAuth.js
- **File Storage**: Cloudinary
- **Payments**: Razorpay
- **AI**: Stability AI SDXL, DALL-E 3
- **Notifications**: SendGrid (Email), MSG91 (SMS), Wati/Interakt (WhatsApp)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

3. Set up the database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the development servers:

```bash
# Terminal 1: Next.js frontend
npm run dev

# Terminal 2: Express API server
npm run api
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:4000`.

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
├── server/                 # Express.js API server
│   ├── config/            # Configuration
│   ├── db/                # Database client
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── queues/            # BullMQ job queues
│   └── utils/             # Utility functions
├── prisma/                # Prisma schema and migrations
└── public/                # Static assets
```

## Development

### Database Management

```bash
# Generate Prisma client
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

### API Server

The API server runs on port 4000 by default and provides:

- RESTful API endpoints at `/api/v1`
- Health check at `/health`
- Request logging with unique request IDs
- Structured error handling
- CORS configuration

### Logging

Logs are written to:
- Console (colored output in development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

Sensitive data (passwords, tokens, API keys) is automatically masked in logs.

## Architecture

### Frontend (Next.js)
- Server-side rendering for SEO
- Client components for interactive features
- Tailwind CSS for styling
- NextAuth.js for authentication

### Backend (Express.js)
- RESTful API with versioning
- JWT authentication
- Request validation with Zod
- Rate limiting
- CSRF protection

### Job Queues (BullMQ)
- Design generation queue
- Notification queue
- Print file generation queue
- Vendor assignment queue

### Caching (Redis)
- Product catalog caching
- Session storage
- Rate limiting
- Queue backend

## License

Private - All rights reserved
