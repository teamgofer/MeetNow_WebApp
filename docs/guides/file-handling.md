# File Handling Best Practices

## Overview

MeetNow supports image uploads for meetups. This document outlines best practices for handling files within the application, with a focus on security, performance, and user experience.

## Supported File Types

### Images

The application currently supports the following image formats:

| Format | MIME Type | Support Level |
|--------|-----------|---------------|
| JPEG   | image/jpeg | Full |
| PNG    | image/png  | Full |
| WebP   | image/webp | Full |
| GIF    | image/gif  | Static only |
| SVG    | image/svg+xml | Limited (security restrictions) |

### File Size Limits

- **Maximum file size**: 5MB
- **Recommended size**: 1-2MB for optimal performance

## Frontend Validation

### Client-Side Checks

Implement these validations in the file upload component:

```javascript
function validateFile(file) {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload JPEG, PNG, WebP or GIF.'
    };
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB.'
    };
  }
  
  return { valid: true };
}
```

### Image Optimization

Consider implementing client-side image optimization:

1. **Resize large images** before upload
2. **Strip EXIF data** for privacy
3. **Convert to efficient formats** (e.g., WebP) if supported

Example implementation using the browser's canvas API:

```javascript
async function optimizeImage(file, maxWidth = 1200, maxHeight = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85); // 85% quality
    };
    
    img.src = URL.createObjectURL(file);
  });
}
```

## Backend Validation

Even with client-side validation, always implement server-side validation as well:

1. **Validate MIME type** using content inspection
2. **Check file size** limits
3. **Scan for malware** if possible
4. **Generate safe filenames** with UUID

## Storage Best Practices

### File Naming

Use this pattern for uploaded files:

```
meetups/meetup_<user_type>_<uuid>.<extension>
```

Where:
- `user_type` is either `user` or `anonymous`
- `uuid` is a generated UUID
- `extension` is derived from the validated MIME type

### MIME Type Handling

Always set the correct Content-Type when uploading to Wasabi:

```javascript
const contentType = file.type || 'application/octet-stream';

// When uploading to S3/Wasabi
const uploadParams = {
  Bucket: bucketName,
  Key: filePath,
  Body: fileData,
  ContentType: contentType
};
```

### Security Considerations

1. **Never trust the client**: Always validate files on the server
2. **Use pre-signed URLs**: Limit upload permissions
3. **Set appropriate CORS**: Restrict which domains can upload
4. **Implement rate limiting**: Prevent abuse

## File Access Control

### Public vs Private Files

MeetNow uses a private bucket with pre-signed URLs:

1. **Upload**: Generate pre-signed PUT URL for client upload
2. **Storage**: Store only the path, not the full URL
3. **Retrieval**: Generate pre-signed GET URL when displaying images

### URL Expiration

Set appropriate expiration times:

- **Upload URLs**: Short expiration (5-15 minutes)
- **View URLs**: Medium expiration (1 hour)

## Error Handling

Implement robust error handling for file operations:

```javascript
async function uploadFile(file) {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Get pre-signed URL
    const { uploadUrl, path } = await getUploadPresignedUrl(file.name);
    if (!uploadUrl) {
      throw new Error('Failed to get upload URL');
    }
    
    // Upload file
    const uploadResult = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
    
    if (!uploadResult.ok) {
      throw new Error(`Upload failed with status: ${uploadResult.status}`);
    }
    
    return { success: true, path };
  } catch (error) {
    console.error('File upload error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to upload file' 
    };
  }
}
```

## Testing File Uploads

### Manual Testing

Test these scenarios:

1. Happy path: Upload valid image
2. File too large: Attempt to upload >5MB file
3. Wrong file type: Attempt to upload non-image
4. Network interruption: Simulate connection loss
5. Server error: Test error recovery

### Automated Testing

Implement automated tests for file handling:

```javascript
describe('File validation', () => {
  test('Should accept valid image files', () => {
    const file = new File(['file content'], 'test.jpg', { type: 'image/jpeg' });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });
  
  test('Should reject oversized files', () => {
    // Create mock file that exceeds size limit
    const largeBlobContent = new ArrayBuffer(6 * 1024 * 1024); // 6MB
    const file = new File([largeBlobContent], 'large.jpg', { type: 'image/jpeg' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });
});
```

## Improving User Experience

### Upload Feedback

Provide clear feedback during uploads:

1. **Progress indicators**: Show upload percentage
2. **Preview images**: Display image preview before upload
3. **Error messages**: Show specific error messages
4. **Retry mechanisms**: Allow retrying failed uploads

### Handling Different Devices

Consider device-specific optimizations:

1. **Mobile**: Optimize for lower bandwidth
2. **Tablets**: Handle orientation changes during upload
3. **Desktop**: Support drag-and-drop

## Fallback Strategies

Implement fallbacks for when uploads fail:

1. **Placeholder images**: Show generic images when upload fails
2. **Text alternatives**: Allow text descriptions as backups
3. **Local storage**: Consider temporary local storage for retry

## Advanced Features

Consider implementing these advanced features:

1. **Image cropping**: Allow users to crop images before upload
2. **Filters and effects**: Basic image editing capabilities
3. **Multi-file upload**: Support uploading multiple images
4. **Image compression**: Offer quality/size options

## References

- [Wasabi Documentation](https://wasabi.com/api)
- [Image Storage System](./IMAGE_STORAGE.md)
- [Wasabi Troubleshooting](./WASABI_TROUBLESHOOTING.md) 