# Cloudinary Integration

This document describes the Cloudinary integration for the PrintAI platform, which handles image storage for AI-generated designs and print-ready PDF files.

## Overview

The Cloudinary integration provides:
- **Image Upload Service**: Upload AI-generated designs with folder organization
- **Print File Storage**: Store print-ready PDF files for vendor access
- **Signed URL Generation**: Generate secure, time-limited URLs for file access
- **Automatic File Cleanup**: Scheduled cleanup of expired files (90+ days old)

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Getting Cloudinary Credentials

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Navigate to Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your `.env` file

## Service API

### CloudinaryService

Located at `server/services/cloudinary.ts`

#### Upload Methods

**uploadFile(file, options)**
```typescript
const result = await cloudinaryService.uploadFile('path/to/file.jpg', {
  folder: 'designs',
  publicId: 'unique-id',
  tags: ['design', 'user123'],
  resourceType: 'image'
});
```

**uploadDesignImage(userId, file, designId)**
```typescript
const result = await cloudinaryService.uploadDesignImage(
  'user123',
  'design-image.png',
  'design456'
);
// Uploads to: designs/user123/design456
```

**uploadPrintFile(orderId, file)**
```typescript
const result = await cloudinaryService.uploadPrintFile(
  'order789',
  'print-file.pdf'
);
// Uploads to: print-files/order789/print-order789
```

#### URL Generation

**generateSignedUrl(publicId, options)**
```typescript
const url = cloudinaryService.generateSignedUrl('designs/user123/design456', {
  expiresIn: 3600, // 1 hour (default)
  transformation: { width: 500, height: 500, crop: 'fill' }
});
```

#### File Management

**deleteFile(publicId, resourceType)**
```typescript
await cloudinaryService.deleteFile('designs/user123/design456', 'image');
```

**getFileDetails(publicId, resourceType)**
```typescript
const details = await cloudinaryService.getFileDetails(
  'designs/user123/design456',
  'image'
);
```

**cleanupOldFiles(folder, daysOld)**
```typescript
const deletedCount = await cloudinaryService.cleanupOldFiles('designs', 90);
```

## File Organization

### Folder Structure

```
cloudinary-root/
├── designs/
│   ├── {userId}/
│   │   ├── {designId}
│   │   └── ...
│   └── ...
└── print-files/
    ├── {orderId}/
    │   └── print-{orderId}
    └── ...
```

### Naming Conventions

- **Design Images**: `designs/{userId}/{designId}`
- **Print Files**: `print-files/{orderId}/print-{orderId}`

### Tags

- Design images: `['design', userId]`
- Print files: `['print-file', orderId]`

## Automatic File Cleanup

### Cleanup Scheduler

The file cleanup scheduler runs daily to remove old files:

- **Design files**: Cleaned up after 90 days
- **Print files**: Cleaned up after 90 days
- **Schedule**: Runs daily at 2 AM (designs) and 3 AM (print files)

### Configuration

Located at `server/workers/fileCleanup.ts`

The scheduler is automatically initialized when the server starts.

### Manual Cleanup

To manually trigger cleanup:

```typescript
import { fileCleanupQueue } from './server/workers/fileCleanup';

await fileCleanupQueue.add('manual-cleanup', {
  folder: 'designs',
  daysOld: 90
});
```

## Usage Examples

### Uploading a Design Image

```typescript
import { cloudinaryService } from './server/services/cloudinary';

// After AI generates an image
const designImage = await generateAIImage(prompt);

// Upload to Cloudinary
const uploadResult = await cloudinaryService.uploadDesignImage(
  userId,
  designImage,
  designId
);

// Save to database
await prisma.design.create({
  data: {
    id: designId,
    userId,
    prompt,
    imageUrl: uploadResult.secureUrl,
    cloudinaryId: uploadResult.publicId,
  }
});
```

### Uploading a Print File

```typescript
import { cloudinaryService } from './server/services/cloudinary';

// After generating PDF
const pdfBuffer = await generatePrintPDF(order);

// Upload to Cloudinary
const uploadResult = await cloudinaryService.uploadPrintFile(
  orderId,
  pdfBuffer
);

// Save to database
await prisma.printFile.create({
  data: {
    orderId,
    fileUrl: uploadResult.secureUrl,
    cloudinaryId: uploadResult.publicId,
    resolution: 300,
    colorSpace: 'CMYK',
  }
});
```

### Generating Secure URLs

```typescript
import { cloudinaryService } from './server/services/cloudinary';

// Get design from database
const design = await prisma.design.findUnique({
  where: { id: designId }
});

// Generate signed URL (expires in 1 hour)
const signedUrl = cloudinaryService.generateSignedUrl(
  design.cloudinaryId,
  { expiresIn: 3600 }
);

// Return to client
res.json({ url: signedUrl });
```

## Error Handling

All methods throw errors with descriptive messages:

```typescript
try {
  await cloudinaryService.uploadFile(file, options);
} catch (error) {
  // Error format: "Cloudinary upload failed: {reason}"
  logger.error('Upload failed', { error: error.message });
  throw new AppError('Failed to upload image', 500);
}
```

## Testing

### Running Tests

```bash
npm test -- server/services/cloudinary.test.ts
```

### Test Coverage

The test suite covers:
- File upload (success and failure)
- Design image upload with folder structure
- Print file upload with folder structure
- Signed URL generation
- File deletion
- Old file cleanup
- File details retrieval

## Performance Considerations

### Upload Optimization

- Use buffers instead of file paths when possible
- Upload images in background jobs for large files
- Set appropriate resource types to avoid auto-detection

### URL Generation

- Cache signed URLs on the client side
- Use appropriate expiration times (1 hour default)
- Apply transformations at URL generation time, not upload time

### Cleanup

- Cleanup runs during low-traffic hours (2-3 AM)
- Processes 500 files per batch
- Logs all deletions for audit purposes

## Security

### API Credentials

- Never expose API secret to frontend
- Store credentials in environment variables
- Use signed URLs for secure file access

### Access Control

- Generate signed URLs with expiration
- Use authenticated type for sensitive files
- Validate user permissions before generating URLs

### File Validation

- Validate file types before upload
- Check file sizes to prevent abuse
- Sanitize file names and public IDs

## Monitoring

### Logs

All operations are logged with:
- Operation type (upload, delete, cleanup)
- File identifiers (publicId, folder)
- Success/failure status
- Error messages

### Metrics

Monitor:
- Upload success rate
- Average upload time
- Storage usage
- Cleanup effectiveness

## Troubleshooting

### Upload Failures

**Issue**: Upload fails with "Invalid credentials"
**Solution**: Verify environment variables are set correctly

**Issue**: Upload fails with "Timeout"
**Solution**: Check network connectivity and file size

### Signed URL Issues

**Issue**: Signed URL returns 401
**Solution**: Check URL hasn't expired, verify signature configuration

### Cleanup Issues

**Issue**: Cleanup not running
**Solution**: Verify Redis connection, check worker logs

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 19.1**: Store all generated design images in Cloudinary ✓
- **Requirement 19.2**: Store all print-ready PDF files in Cloudinary ✓
- **Requirement 19.3**: Organize files by order ID and customer ID ✓
- **Requirement 19.4**: Generate secure, time-limited URLs for file access ✓
- **Requirement 19.6**: Implement automatic cleanup of expired files ✓

## Future Enhancements

- [ ] Add image transformation presets
- [ ] Implement CDN caching strategies
- [ ] Add webhook support for upload notifications
- [ ] Implement backup/archive strategy
- [ ] Add analytics for storage usage
