# Next Session Quick Start Guide

## 🎯 Session 2 Goals

Continue implementation from Task 4.6 onwards, focusing on:
1. Pre-prompt gallery
2. Design studio frontend
3. Product catalog
4. Shopping cart
5. Checkpoint

---

## ✅ What's Already Done

- ✅ Database schema and seeding
- ✅ Authentication (Email, OAuth, OTP)
- ✅ Cloudinary file storage
- ✅ AI design generation (Stability AI + DALL-E)
- ✅ Design API endpoints
- ✅ 67+ tests passing

---

## 🚀 Quick Start Commands

### Start Infrastructure
```bash
# Start Redis (if not running)
docker ps | grep redis  # Check if running
# If not running:
docker start medassist_redis  # Or your Redis container name

# Verify PostgreSQL is running
# Database: printai
# User: postgres
# Password: $Predators@7837$
```

### Start Application
```bash
# Terminal 1: API Server
npm run api

# Terminal 2: Next.js Frontend
npm run dev

# Terminal 3: Run tests (optional)
npm test
```

### Verify Everything Works
```bash
# Check API health
curl http://localhost:4000/api/v1/health

# Should return: {"status":"ok","version":"v1"}
```

---

## 📋 Next Tasks to Execute

### Task 4.6: Pre-Prompt Gallery
**Goal:** Create a gallery of example prompts to inspire users

**Sub-tasks:**
- Seed pre-prompt data (already in database)
- Create GET /api/v1/designs/pre-prompts endpoint
- Add category filtering
- Build gallery UI component

**Files to create:**
- `server/routes/prePrompts.ts` - API routes
- `app/components/PrePromptGallery.tsx` - UI component


### Task 4.8: Design Studio Frontend
**Goal:** Build the main UI for design generation

**Sub-tasks:**
- Create prompt input interface
- Implement pre-prompt selection
- Add design generation loading states
- Display generated designs with preview
- Add error handling and retry UI

**Files to create:**
- `app/studio/page.tsx` - Design studio page
- `app/components/DesignStudio.tsx` - Main component
- `app/components/PromptInput.tsx` - Prompt input
- `app/components/DesignPreview.tsx` - Design display

---

### Task 5: Product Catalog and Configuration
**Goal:** Implement product options and pricing

**Sub-tasks:**
- Product catalog retrieval (already seeded)
- Price calculation service
- Mockup generation service
- Product configurator frontend

**Files to create:**
- `server/services/product.ts` - Product service
- `server/services/mockup.ts` - Mockup generation
- `server/routes/products.ts` - Product API
- `app/components/ProductConfigurator.tsx` - UI

---

### Task 6: Shopping Cart
**Goal:** Implement cart functionality

**Sub-tasks:**
- Cart service (add, update, remove)
- Cart API endpoints
- Cart frontend component

**Files to create:**
- `server/services/cart.ts` - Cart service
- `server/routes/cart.ts` - Cart API
- `app/components/ShoppingCart.tsx` - Cart UI

---

## 🔑 Important Information

### Test Credentials
```
Admin: admin@printai.com / Admin@123
Test User: test@example.com / Test@123456
Mobile: 9876543210 (OTP)
```

### Database Seeded Data
- 3 Fabrics: Cotton, Polyester, Blend
- 4 GSM: 160, 180, 200, 220
- 7 Sizes: XS, S, M, L, XL, XXL, XXXL
- 5 Colors: White, Black, Navy, Red, Gray
- Base Price: ₹299
- 3 Pre-prompts (sample)

### API Endpoints Available
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/otp/send
POST   /api/v1/auth/otp/verify
POST   /api/v1/designs/generate
GET    /api/v1/designs/job/:jobId
GET    /api/v1/designs
GET    /api/v1/designs/:id
DELETE /api/v1/designs/:id
GET    /api/v1/health
```

---

## 📚 Reference Documentation

### Key Files to Review
- `IMPLEMENTATION_PROGRESS_SUMMARY.md` - Full progress report
- `.kiro/specs/printai-platform/tasks.md` - Complete task list
- `docs/API_DESIGN_ENDPOINTS.md` - API reference
- `server/services/aiDesign.ts` - AI service example
- `server/routes/designs.ts` - Route example

### Architecture Patterns
1. **Services:** Business logic in `server/services/`
2. **Routes:** API endpoints in `server/routes/`
3. **Workers:** Background jobs in `server/workers/`
4. **Middleware:** Auth, logging in `server/middleware/`
5. **Frontend:** Next.js components in `app/`

---

## 🐛 Troubleshooting

### If API Server Won't Start
```bash
# Check if port 4000 is in use
netstat -ano | findstr :4000

# Kill process if needed
taskkill /PID <PID> /F

# Restart
npm run api
```

### If Redis Connection Fails
```bash
# Check Redis status
docker ps | grep redis

# Restart Redis
docker restart medassist_redis

# Or start new Redis
docker run -d -p 6379:6379 --name redis redis:latest
```

### If Database Connection Fails
```bash
# Verify PostgreSQL is running
# Check connection string in .env
DATABASE_URL="postgresql://postgres:$Predators@7837$@localhost:5432/printai"

# Regenerate Prisma client
npm run prisma:generate
```

### If Tests Fail
```bash
# Clear test cache
npm test -- --clearCache

# Run specific test
npm test -- server/services/aiDesign.test.ts

# Check for missing mocks
```

---

## 💡 Tips for Next Session

1. **Start with API first:** Build backend endpoints before frontend
2. **Test as you go:** Write tests for each new service
3. **Use existing patterns:** Follow patterns from completed tasks
4. **Check requirements:** Reference requirements.md for each task
5. **Document as you build:** Update docs for new features

---

## 🎯 Success Criteria for Session 2

By end of session, you should have:
- [ ] Pre-prompt gallery working
- [ ] Design studio UI functional
- [ ] Product catalog API complete
- [ ] Shopping cart working
- [ ] All new tests passing
- [ ] Checkpoint 7 verified

---

## 📞 Quick Commands Reference

```bash
# Development
npm run dev          # Start Next.js
npm run api          # Start API server
npm test             # Run all tests
npm run test:watch   # Watch mode

# Database
npm run prisma:generate  # Generate client
npm run prisma:studio    # Open DB GUI
npm run prisma:seed      # Seed database
npx prisma db push       # Push schema

# Docker
docker ps                # List containers
docker logs <container>  # View logs
docker restart <container>  # Restart
```

---

**Ready to continue! 🚀**

When you start the next session, just say "continue with remaining tasks" and I'll pick up from Task 4.6.

