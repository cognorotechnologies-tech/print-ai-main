# AI Design Generation Service

## Overview

The AI Design Generation Service provides asynchronous image generation using AI providers (Stability AI SDXL and DALL-E 3) with automatic fallback, retry logic, and job queue management.

## Architecture

### Components

1. **AIDesignService** (`server/services/aiDesign.ts`)
   - Core service for AI image generation
   - Prompt validation and sanitization
   - Integration with Stability AI SDXL (primary)
   - Integration with DALL-E 3 (fallback)
   - Automatic retry with exponential backoff
   - Cloudinary upload integration

2. **Design Generation Worker** (`server/workers/designGeneration.ts`)
   - BullMQ worker for asynchronous processing
   - Handles job queue management
   - Stores generated designs in database
   - Progress tracking and error handling

3. **Design Routes** (`server/routes/designs.ts`)
   - RESTful API endpoints for design operations
   - Job submission and status tracking
   - Design retrieval and deletion

4. **Job Queue** (`server/queues/index.ts`)
   - BullMQ queue for design generation jobs
   - Redis-backed job persistence
   - Concurrency control and rate limiting

## Features

### 1. Prompt Validation and Sanitization

**Security Features:**
- Removes HTML tags and angle brackets
- Strips JavaScript protocols
- Removes event handlers
- Length validation (3-1000 characters)
- Empty prompt detection

**Example:**
```typescript
const validation = aiDesignService.validatePrompt(prompt);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

### 2. AI Provider Integration

**Primary Provider: Stability AI SDXL**
- Endpoint: `https://api.stability.ai/v2beta/stable-image/generate/sd3`
- Supports custom aspect ratios
- 30-second timeout
- 3 retry attempts with exponential backoff

**Fallback Provider: DALL-E 3**
- Endpoint: `https://api.openai.com/v1/images/generations`
- Fixed 1024x1024 size
- Activated when Stability AI fails after all retries

### 3. Timeout and Retry Logic

**Configuration:**
- Timeout: 30 seconds per request
- Max retries: 3 attempts
- Retry delay: Exponential backoff (1s, 2s, 4s)

**Flow:**
1. Try Stability AI (attempt 1)
2. If fails, wait 1 second, retry (attempt 2)
3. If fails, wait 2 seconds, retry (attempt 3)
4. If fails, wait 4 seconds, retry (attempt 4)
5. If all Stability AI attempts fail, try DALL-E 3
6. If DALL-E 3 fails, throw error

### 4. Job Queue Management

**Queue Configuration:**
- Queue name: `design-generation`
- Concurrency: 5 jobs simultaneously
- Rate limit: 10 jobs per 60 seconds
- Redis-backed persistence

**Job Data:**
```typescript
interface DesignGenerationJobData {
  userId: string;
  prompt: string;
  aspectRatio?: string;
}
```

**Job Result:**
```typescript
interface DesignGenerationJobResult {
  designId: string;
  imageUrl: string;
  cloudinaryId: string;
  aiProvider: string;
}
```

### 5. Cloudinary Integration

**Upload Process:**
1. Generate unique design ID
2. Convert image to base64 (Stability AI) or use URL (DALL-E)
3. Upload to Cloudinary with folder structure: `designs/{userId}/{designId}`
4. Store secure URL and public ID in database

**Storage Organization:**
- Folder: `designs/{userId}/`
- Tags: `['design', userId]`
- Resource type: `image`

## API Endpoints

### POST /api/designs/generate

Queue a design generation job.

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "aspectRatio": "16:9"
}
```

**Response (202 Accepted):**
```json
{
  "message": "Design generation started",
  "jobId": "job-123"
}
```

**Authentication:** Required (Bearer token)

### GET /api/designs/job/:jobId

Get the status of a design generation job.

**Response:**
```json
{
  "jobId": "job-123",
  "state": "completed",
  "progress": 100,
  "result": {
    "designId": "design-456",
    "imageUrl": "https://cloudinary.com/...",
    "cloudinaryId": "designs/user123/design-456",
    "aiProvider": "stability"
  },
  "error": null
}
```

**Job States:**
- `waiting`: Job is queued
- `active`: Job is being processed
- `completed`: Job finished successfully
- `failed`: Job failed with error

**Authentication:** Required (Bearer token)

### GET /api/designs

Get all designs for the authenticated user.

**Response:**
```json
{
  "designs": [
    {
      "id": "design-456",
      "userId": "user-123",
      "prompt": "A beautiful sunset",
      "imageUrl": "https://cloudinary.com/...",
      "cloudinaryId": "designs/user123/design-456",
      "aspectRatio": "16:9",
      "aiProvider": "stability",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Authentication:** Required (Bearer token)

### GET /api/designs/:id

Get a specific design by ID.

**Response:**
```json
{
  "design": {
    "id": "design-456",
    "userId": "user-123",
    "prompt": "A beautiful sunset",
    "imageUrl": "https://cloudinary.com/...",
    "cloudinaryId": "designs/user123/design-456",
    "aspectRatio": "16:9",
    "aiProvider": "stability",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Authentication:** Required (Bearer token)

### DELETE /api/designs/:id

Delete a design.

**Response:**
```json
{
  "message": "Design deleted successfully"
}
```

**Authentication:** Required (Bearer token)

## Environment Variables

Required environment variables in `.env`:

```env
# AI Service API Keys
STABILITY_API_KEY=your_stability_api_key
OPENAI_API_KEY=your_openai_api_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

## Database Schema

The service uses the `Design` model from Prisma:

```prisma
model Design {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  prompt      String
  imageUrl    String
  cloudinaryId String
  aspectRatio String
  aiProvider  String    // "stability" or "dalle"
  createdAt   DateTime  @default(now())
  
  orderItems  OrderItem[]
  cartItems   CartItem[]

  @@index([userId])
}
```

## Error Handling

### Validation Errors (400)
- Empty prompt
- Prompt too short (< 3 characters)
- Prompt too long (> 1000 characters)
- Invalid characters only

### Authentication Errors (401)
- Missing or invalid JWT token
- Expired session

### Authorization Errors (403)
- Accessing another user's design
- Accessing another user's job

### Not Found Errors (404)
- Job not found
- Design not found

### Server Errors (500)
- AI service failures (after all retries)
- Cloudinary upload failures
- Database errors

## Testing

### Unit Tests

Run unit tests:
```bash
npm test -- server/services/aiDesign.test.ts
```

**Test Coverage:**
- Prompt validation (valid, empty, too short, too long, invalid characters)
- Prompt sanitization (HTML tags, JavaScript, event handlers)
- Design generation with Stability AI
- Fallback to DALL-E when Stability AI fails
- Error handling when both providers fail
- Cloudinary upload integration
- Default aspect ratio handling

### Integration Testing

To test the complete flow:

1. Start Redis:
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

2. Start the API server:
```bash
npm run api
```

3. Submit a design generation job:
```bash
curl -X POST http://localhost:4000/api/v1/designs/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset over mountains", "aspectRatio": "16:9"}'
```

4. Check job status:
```bash
curl http://localhost:4000/api/v1/designs/job/JOB_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Performance Considerations

### Concurrency
- Worker processes up to 5 designs simultaneously
- Rate limit: 10 jobs per 60 seconds
- Prevents overwhelming AI providers

### Timeouts
- 30-second timeout per AI request
- Prevents hanging requests
- Allows retry with different provider

### Caching
- Generated designs stored in Cloudinary CDN
- Fast retrieval for subsequent requests
- No need to regenerate same design

### Queue Management
- Redis-backed job persistence
- Survives server restarts
- Failed jobs can be retried manually

## Monitoring and Logging

### Log Events

**Info Level:**
- Design generation job queued
- Attempting generation with provider
- Design generated and uploaded successfully
- Worker started

**Warning Level:**
- Provider generation failed (with retry)
- Job progress updates

**Error Level:**
- All retries exhausted
- Cloudinary upload failed
- Database errors
- Worker errors

### Metrics to Monitor

- Job queue length
- Job completion rate
- Job failure rate
- Average generation time
- Provider success rate (Stability vs DALL-E)
- Cloudinary upload success rate

## Troubleshooting

### Issue: Jobs stuck in "waiting" state

**Cause:** Worker not running or Redis connection issue

**Solution:**
1. Check if worker is imported in `server/index.ts`
2. Verify Redis is running: `docker ps | grep redis`
3. Check Redis connection in logs

### Issue: All jobs failing with timeout

**Cause:** AI provider API issues or network problems

**Solution:**
1. Check API key validity
2. Verify network connectivity
3. Check AI provider status pages
4. Increase timeout if needed

### Issue: Cloudinary upload failures

**Cause:** Invalid credentials or quota exceeded

**Solution:**
1. Verify Cloudinary credentials in `.env`
2. Check Cloudinary dashboard for quota
3. Verify network connectivity

### Issue: Jobs failing with "Invalid prompt"

**Cause:** Prompt validation failing

**Solution:**
1. Check prompt length (3-1000 characters)
2. Ensure prompt contains valid characters
3. Review sanitization rules

## Future Enhancements

1. **Additional AI Providers**
   - Midjourney integration
   - Stable Diffusion XL local deployment
   - Multiple provider selection

2. **Advanced Features**
   - Image-to-image generation
   - Style transfer
   - Negative prompts
   - Custom model fine-tuning

3. **Performance Optimization**
   - Result caching for similar prompts
   - Batch processing
   - Priority queue for premium users

4. **Monitoring**
   - Real-time dashboard
   - Provider performance metrics
   - Cost tracking per provider

5. **User Experience**
   - WebSocket for real-time progress
   - Design variations
   - Prompt suggestions
   - Design history and favorites
