# Design API Endpoints

This document describes the design generation API endpoints for the PrintAI platform.

## Base URL

All endpoints are prefixed with `/api/v1/designs`

## Authentication

All design endpoints require authentication. Include a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Generate Design

Queue a new AI design generation job.

**Endpoint:** `POST /api/v1/designs/generate`

**Request Body:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "aspectRatio": "16:9"
}
```

**Parameters:**
- `prompt` (string, required): Text description of the design to generate (3-1000 characters)
- `aspectRatio` (string, optional): Aspect ratio for the generated image. Default: "1:1"
  - Supported values: "1:1", "16:9", "9:16", "4:3", "3:4"

**Response:** `202 Accepted`
```json
{
  "message": "Design generation started",
  "jobId": "job-abc123"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or missing prompt
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Failed to queue job

**Example:**
```bash
curl -X POST https://api.printai.com/api/v1/designs/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A majestic lion in the savanna",
    "aspectRatio": "1:1"
  }'
```

---

### 2. Get Pre-Prompt Gallery

Get curated example prompts to inspire customer designs. This is a public endpoint that does not require authentication.

**Endpoint:** `GET /api/v1/designs/pre-prompts`

**Query Parameters:**
- `category` (string, optional): Filter pre-prompts by category

**Response:** `200 OK`
```json
{
  "prePrompts": [
    {
      "id": "preprompt-001",
      "title": "Cosmic Adventure",
      "prompt": "A vibrant space scene with planets, stars, and a rocket ship exploring the galaxy",
      "category": "Space",
      "previewUrl": "https://res.cloudinary.com/printai/image/upload/v1234567890/pre-prompts/cosmic-adventure.png",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "preprompt-002",
      "title": "Mountain Sunset",
      "prompt": "Beautiful mountain landscape at sunset with orange and purple sky, peaceful and serene",
      "category": "Nature",
      "previewUrl": "https://res.cloudinary.com/printai/image/upload/v1234567890/pre-prompts/mountain-sunset.png",
      "isActive": true,
      "sortOrder": 2,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "categories": [
    "Space",
    "Nature",
    "Abstract",
    "Animals",
    "Fantasy",
    "Urban",
    "Retro",
    "Minimalist",
    "Sci-Fi"
  ]
}
```

**Notes:**
- This endpoint is public and does not require authentication
- Only returns active pre-prompts (`isActive: true`)
- Pre-prompts are sorted by `sortOrder` (ascending)
- Categories list contains all unique categories from active pre-prompts

**Filter by Category:**
```bash
curl https://api.printai.com/api/v1/designs/pre-prompts?category=Nature
```

**Error Responses:**
- `500 Internal Server Error`: Failed to fetch pre-prompts

**Example:**
```bash
# Get all pre-prompts
curl https://api.printai.com/api/v1/designs/pre-prompts

# Get pre-prompts in Space category
curl https://api.printai.com/api/v1/designs/pre-prompts?category=Space
```

**Usage Flow:**
1. Display pre-prompt gallery to user
2. User selects a pre-prompt
3. Pre-fill the prompt input with the selected prompt text
4. User can modify the prompt or use it as-is
5. Submit to the generate endpoint

---

### 3. Get Job Status

Check the status of a design generation job.

**Endpoint:** `GET /api/v1/designs/job/:jobId`

**URL Parameters:**
- `jobId` (string, required): The job ID returned from the generate endpoint

**Response:** `200 OK`

**For Active/Waiting Job:**
```json
{
  "jobId": "job-abc123",
  "state": "active",
  "progress": 50,
  "result": null,
  "error": null
}
```

**For Completed Job:**
```json
{
  "jobId": "job-abc123",
  "state": "completed",
  "progress": 100,
  "result": {
    "designId": "design-xyz789",
    "imageUrl": "https://res.cloudinary.com/printai/image/upload/v1234567890/designs/user123/design-xyz789.png",
    "cloudinaryId": "designs/user123/design-xyz789",
    "aiProvider": "stability"
  },
  "error": null
}
```

**For Failed Job:**
```json
{
  "jobId": "job-abc123",
  "state": "failed",
  "progress": 30,
  "result": null,
  "error": "AI service timeout"
}
```

**Job States:**
- `waiting`: Job is queued and waiting to be processed
- `active`: Job is currently being processed
- `completed`: Job completed successfully
- `failed`: Job failed with an error

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Job belongs to a different user
- `404 Not Found`: Job not found
- `500 Internal Server Error`: Failed to retrieve job status

**Example:**
```bash
curl https://api.printai.com/api/v1/designs/job/job-abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. List Designs

Get all designs for the authenticated user.

**Endpoint:** `GET /api/v1/designs`

**Response:** `200 OK`
```json
{
  "designs": [
    {
      "id": "design-xyz789",
      "userId": "user-123",
      "prompt": "A beautiful sunset over mountains",
      "imageUrl": "https://res.cloudinary.com/printai/image/upload/v1234567890/designs/user123/design-xyz789.png",
      "cloudinaryId": "designs/user123/design-xyz789",
      "aspectRatio": "16:9",
      "aiProvider": "stability",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "design-abc456",
      "userId": "user-123",
      "prompt": "A majestic lion in the savanna",
      "imageUrl": "https://res.cloudinary.com/printai/image/upload/v1234567890/designs/user123/design-abc456.png",
      "cloudinaryId": "designs/user123/design-abc456",
      "aspectRatio": "1:1",
      "aiProvider": "dalle",
      "createdAt": "2024-01-14T15:20:00.000Z"
    }
  ]
}
```

**Notes:**
- Returns up to 50 most recent designs
- Designs are ordered by creation date (newest first)
- Only returns designs belonging to the authenticated user

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Failed to fetch designs

**Example:**
```bash
curl https://api.printai.com/api/v1/designs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Get Design Details

Retrieve details for a specific design.

**Endpoint:** `GET /api/v1/designs/:id`

**URL Parameters:**
- `id` (string, required): The design ID

**Response:** `200 OK`
```json
{
  "design": {
    "id": "design-xyz789",
    "userId": "user-123",
    "prompt": "A beautiful sunset over mountains",
    "imageUrl": "https://res.cloudinary.com/printai/image/upload/v1234567890/designs/user123/design-xyz789.png",
    "cloudinaryId": "designs/user123/design-xyz789",
    "aspectRatio": "16:9",
    "aiProvider": "stability",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Design belongs to a different user
- `404 Not Found`: Design not found
- `500 Internal Server Error`: Failed to fetch design

**Example:**
```bash
curl https://api.printai.com/api/v1/designs/design-xyz789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Delete Design

Delete a design from the user's collection.

**Endpoint:** `DELETE /api/v1/designs/:id`

**URL Parameters:**
- `id` (string, required): The design ID

**Response:** `200 OK`
```json
{
  "message": "Design deleted successfully"
}
```

**Notes:**
- This only deletes the database record
- The image remains in Cloudinary and will be cleaned up by the scheduled cleanup job
- Designs that are part of existing orders cannot be deleted (enforced by database constraints)

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Design belongs to a different user
- `404 Not Found`: Design not found
- `500 Internal Server Error`: Failed to delete design

**Example:**
```bash
curl -X DELETE https://api.printai.com/api/v1/designs/design-xyz789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Polling for Job Completion

Since design generation is asynchronous, you need to poll the job status endpoint to check when the design is ready.

**Recommended Polling Strategy:**

1. After receiving the `jobId` from the generate endpoint, wait 2 seconds
2. Poll the job status endpoint every 2-3 seconds
3. Stop polling when the job state is `completed` or `failed`
4. Implement a maximum timeout (e.g., 60 seconds) to prevent infinite polling

**Example Polling Implementation (JavaScript):**

```javascript
async function waitForDesign(jobId, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/v1/designs/job/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.state === 'completed') {
      return data.result;
    }
    
    if (data.state === 'failed') {
      throw new Error(data.error || 'Design generation failed');
    }
    
    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Design generation timeout');
}

// Usage
try {
  const generateResponse = await fetch('/api/v1/designs/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'A beautiful sunset',
      aspectRatio: '16:9'
    })
  });
  
  const { jobId } = await generateResponse.json();
  const design = await waitForDesign(jobId);
  
  console.log('Design ready:', design);
} catch (error) {
  console.error('Design generation failed:', error);
}
```

---

## WebSocket Support (Future Enhancement)

Currently, the API uses polling for job status updates. A future enhancement will add WebSocket support for real-time notifications when designs are ready.

**Planned WebSocket Events:**
- `design:queued` - Design generation job queued
- `design:progress` - Progress update (with percentage)
- `design:completed` - Design generation completed
- `design:failed` - Design generation failed

---

## Rate Limits

Design generation is rate-limited to prevent abuse:

- **Per User:** 10 concurrent jobs maximum
- **Global:** 10 jobs per minute across all users

When rate limits are exceeded, the generate endpoint will return:

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Request succeeded
- `202 Accepted`: Request accepted for processing (async operation)
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but not authorized for this resource
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Design Generation Process

Understanding the design generation workflow:

1. **Client submits prompt** → `POST /api/v1/designs/generate`
2. **Server validates prompt** → Checks length, sanitizes input
3. **Job queued** → Returns `jobId` immediately (202 Accepted)
4. **Worker processes job** → Calls AI service (Stability AI or DALL-E)
5. **Image uploaded** → Uploads to Cloudinary
6. **Design saved** → Creates database record
7. **Job completed** → Client can retrieve design via `GET /api/v1/designs/job/:jobId`

**Typical Timeline:**
- Queue time: < 1 second
- AI generation: 5-20 seconds
- Cloudinary upload: 1-3 seconds
- **Total:** 6-24 seconds

---

## Best Practices

1. **Always validate prompts client-side** before sending to reduce failed requests
2. **Implement exponential backoff** for polling to reduce server load
3. **Cache design lists** on the client to minimize API calls
4. **Handle all error states** gracefully in your UI
5. **Show progress indicators** during generation to improve UX
6. **Store jobId** in case the user navigates away during generation

---

## Related Documentation

- [AI Design Service](./AI_DESIGN_SERVICE.md) - Technical details of the AI design generation service
- [Authentication](./AUTHENTICATION.md) - How to obtain and use JWT tokens
- [Cloudinary Integration](./CLOUDINARY_INTEGRATION.md) - Image storage and delivery

---

## Support

For API support or to report issues:
- Email: api-support@printai.com
- Documentation: https://docs.printai.com
