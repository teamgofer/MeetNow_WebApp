# Image Storage System

## Overview

The MeetNow application uses Wasabi Cloud Storage, an S3-compatible service, for storing and serving images. This document outlines the implementation, configuration, and usage of the image storage system.

## Architecture

The image storage system consists of:

1. **Wasabi S3 Storage**: Used as the primary storage for all images
2. **Pre-signed URLs**: For secure upload and retrieval of images
3. **MeetupImageUploader Component**: Client-side component for image uploads
4. **wasabi-storage.js Utility**: Backend interface to Wasabi services

## Setup and Configuration

### Environment Variables

The following environment variables must be configured in your `.env` file:

```
# Wasabi Storage Configuration 
VITE_WASABI_REGION=us-west-1
VITE_WASABI_ENDPOINT=https://s3.us-west-1.wasabisys.com
VITE_WASABI_BUCKET_NAME=meetup-photos-west-coast
VITE_WASABI_ACCESS_KEY_ID=your-wasabi-access-key
VITE_WASABI_SECRET_ACCESS_KEY=your-wasabi-secret-key

# Public Wasabi Credentials (for anonymous uploads)
VITE_WASABI_PUBLIC_ACCESS_KEY_ID=your-public-wasabi-access-key
VITE_WASABI_PUBLIC_SECRET_KEY=your-public-wasabi-secret-key
```

### Wasabi Bucket Setup

1. **Bucket Creation**: Create a bucket in the Wasabi console
2. **CORS Configuration**: Apply the following CORS policy to allow cross-origin requests:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type", "Connection", "Date", "Last-Modified"],
    "MaxAgeSeconds": 3600
  }
]
```

3. **Bucket Policy**: Apply the following bucket policy to allow proper access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForAnonymousMeetups",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::*:user/YOUR_PUBLIC_ACCESS_KEY_ID"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/meetups/*"
    },
    {
      "Sid": "AllowPublicAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/meetups/meetup_anonymous_*"
    }
  ]
}
```

## Implementation

### wasabi-storage.js

This utility file provides the following functions:

- `getUploadPresignedUrl`: Generates a pre-signed URL for uploading images
- `getSignedViewUrl`: Generates a pre-signed URL for viewing images
- `getSignedUrlFromFullUrl`: Extracts the path from a full URL and generates a signed URL
- `uploadFile`: Uploads a file directly to Wasabi storage
- `deleteFile`: Deletes a file from Wasabi storage

### MeetupImageUploader Component

The `MeetupImageUploader` component provides a UI for uploading images with the following features:

- Drag and drop interface
- File size validation (5MB limit)
- Progress indicators
- Preview of uploaded images
- Error handling

### Flow for Anonymous vs. Authenticated Uploads

The system supports both anonymous and authenticated uploads:

1. **Anonymous Uploads**:
   - Uses public credentials defined in environment variables
   - Files are stored with path prefix `meetups/meetup_anonymous_*`
   - Accessible via pre-signed URLs

2. **Authenticated Uploads**:
   - Uses private credentials defined in environment variables
   - Files are stored with path prefix `meetups/meetup_*`
   - Only accessible via pre-signed URLs

## Storage and Retrieval Flow

1. **Image Upload Process**:
   - User selects an image in the UI
   - Client requests a pre-signed upload URL from Wasabi
   - Image is uploaded directly to Wasabi
   - Path to the image is stored in the database

2. **Image Retrieval Process**:
   - When displaying a meetup with an image, the application reads the image path
   - A pre-signed URL is generated for viewing the image
   - The signed URL is provided to the UI for displaying the image

## Security Considerations

- **Pre-signed URLs**: All access to images is through pre-signed URLs that expire after a set time (default: 1 hour)
- **Public/Private Credentials**: Separate credentials are used for anonymous vs. authenticated uploads
- **Path-Based Security**: The bucket policy restricts access based on path prefixes

## Troubleshooting

### Common Issues

1. **403 Forbidden Errors**:
   - Check bucket policy configuration
   - Verify CORS settings
   - Ensure the correct credentials are being used for the upload/view operation

2. **Upload Failures**:
   - Verify network connectivity
   - Check file size limits
   - Ensure proper content type headers

3. **Image Display Issues**:
   - Verify the pre-signed URL is being generated correctly
   - Check that the image path stored in the database is correct
   - Ensure the URL hasn't expired

### Debug Tools

The application includes debug tools for troubleshooting image uploads:

- `/wasabi-test`: Test page for Wasabi integration
- `/image-upload-test`: Test page for image uploads with detailed logging

## Testing

Run the Wasabi upload tests:

```bash
npx vitest tests/wasabi-upload.test.js
```

This tests the entire image upload and retrieval flow, including:
- Pre-signed URL generation
- File uploads
- Signed URL retrieval 