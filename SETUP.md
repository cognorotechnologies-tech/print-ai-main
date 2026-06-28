# PrintAI Platform - Setup Guide

This guide will help you set up the PrintAI platform for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 14.x or higher
- **Redis** 6.x or higher

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and configure the following required variables:

### Database Configuration
```env
DATABASE_URL="postgresql://username:password@localhost:5432/printai"
```

Replace `username` and `password` with your PostgreSQL credentials.

### NextAuth Configuration
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"
```

Generate a secret using: `openssl rand -base64 32`

### Redis Configuration
```env
REDIS_URL="redis://localhost:6379"
```

### API Server Configuration
```env
API_PORT=4000
API_URL="http://localhost:4000"
```

## Step 3: Set Up PostgreSQL Database

1. Create a new PostgreSQL database:

```bash
createdb printai
```

Or using psql:

```sql
CREATE DATABASE printai;
```

2. Update the `DATABASE_URL` in your `.env` file with the correct credentials.

## Step 4: Set Up Redis

Ensure Redis is running on your system:

```bash
# On macOS with Homebrew
brew services start redis

# On Linux with systemd
sudo systemctl start redis

# Or run Redis directly
redis-server
```

## Step 5: Initialize Database Schema

1. Generate Prisma client:

```bash
npm run prisma:generate
```

2. Run database migrations:

```bash
npm run prisma:migrate
```

This will create all the necessary tables in your database.

3. Seed the database with initial data:

```bash
npm run prisma:seed
```

This will create:
- Admin user (email: admin@printai.com, password: Admin@123)
- Product catalog (fabrics, GSM options, sizes, colors)
- Base pricing
- Sample pre-prompts

## Step 6: Start Development Servers

You need to run two servers for development:

### Terminal 1: Next.js Frontend

```bash
npm run dev
```

The frontend will be available at: http://localhost:3000

### Terminal 2: Express API Server

```bash
npm run api
```

The API will be available at: http://localhost:4000

## Step 7: Verify Setup

1. Open http://localhost:3000 in your browser - you should see the PrintAI welcome page
2. Check API health: http://localhost:4000/health - should return `{"status":"ok"}`
3. Check API v1 health: http://localhost:4000/api/v1/health - should return `{"status":"ok","version":"v1"}`

## Optional: External Services Configuration

For full functionality, you'll need to configure these external services:

### Google OAuth (for social login)
```env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### AI Services (for design generation)
```env
STABILITY_API_KEY="your-stability-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

### Cloudinary (for file storage)
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Razorpay (for payments)
```env
RAZORPAY_KEY_ID="your-key-id"
RAZORPAY_KEY_SECRET="your-key-secret"
```

### Notification Services
```env
SENDGRID_API_KEY="your-sendgrid-key"
MSG91_AUTH_KEY="your-msg91-key"
WATI_API_KEY="your-wati-key"
WATI_API_ENDPOINT="your-wati-endpoint"
```

## Useful Commands

### Database Management

```bash
# Open Prisma Studio (database GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Re-seed database
npm run prisma:seed
```

### Development

```bash
# Run Next.js in development mode
npm run dev

# Run API server with auto-reload
npm run api

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

### Port Already in Use

If you get an error that port 3000 or 4000 is already in use:

```bash
# Find and kill the process using the port
# On macOS/Linux:
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Issues

1. Verify PostgreSQL is running:
```bash
pg_isready
```

2. Check your DATABASE_URL format:
```
postgresql://username:password@host:port/database
```

3. Ensure the database exists:
```bash
psql -l
```

### Redis Connection Issues

1. Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

2. Check Redis connection:
```bash
redis-cli
> INFO server
```

## Next Steps

Once setup is complete, you can:

1. Access the admin panel with the seeded credentials
2. Start implementing authentication features (Task 2)
3. Configure external services for full functionality
4. Begin developing customer-facing features

For more information, see the main [README.md](README.md) file.
