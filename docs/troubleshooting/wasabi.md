# Wasabi Image Storage Troubleshooting

## Common Issues and Solutions

### Images Not Displaying

1. **Issue**: Images uploaded successfully but don't appear in the UI
   
   **Solutions**:
   - Check network requests for 403 errors (Access Denied)
   - Verify the image path stored in the database is correct
   - Ensure signed URLs are being generated properly
   - Check that the URL hasn't expired (default expiry is 1 hour)

2. **Issue**: Image URLs showing as broken links
   
   **Solutions**:
   - Check browser console for CORS errors
   - Verify Wasabi bucket CORS settings are correctly configured
   - Ensure the image URL is using HTTPS

### Upload Failures

1. **Issue**: Unable to upload images
   
   **Solutions**:
   - Check browser console for network errors
   - Verify file size is under 5MB limit
   - Ensure environment variables for Wasabi credentials are set correctly
   - Test network connectivity to Wasabi endpoint

2. **Issue**: Upload progress stalls at 0% or 100%
   
   **Solutions**:
   - Check for browser console errors
   - Verify proper CORS configuration
   - Try a different browser to isolate client-side issues

### Access Denied Errors

1. **Issue**: 403 Forbidden errors when accessing images
   
   **Solutions**:
   - Verify bucket policy allows access to the specific path
   - Check if the pre-signed URL has expired
   - Ensure the correct region is specified in the environment variables
   - Verify credentials have proper permissions

## Debugging Steps

### Verify Environment Variables

Check that these environment variables are set correctly:

```
VITE_WASABI_REGION
VITE_WASABI_ENDPOINT
VITE_WASABI_BUCKET_NAME
VITE_WASABI_ACCESS_KEY_ID
VITE_WASABI_SECRET_ACCESS_KEY
```

### Test Wasabi Connectivity

Use the test page at `/wasabi-test` to verify connectivity to Wasabi:

1. Navigate to `/wasabi-test` in your development environment
2. Click "Test Connection" to verify API access
3. Upload a test image to verify the upload flow

### Inspect Network Requests

1. Open browser developer tools (F12)
2. Go to Network tab
3. Filter for image requests
4. Look for:
   - Failed requests (red)
   - Status codes (403, 404, etc.)
   - Response headers (for CORS issues)

### Check Signed URL Generation

Verify signed URLs are being generated correctly:

```javascript
// In browser console
async function testSignedUrl() {
  const path = 'meetups/test-image.jpg';
  const response = await fetch('/api/get-signed-url?path=' + encodeURIComponent(path));
  const data = await response.json();
  console.log('Signed URL:', data.signedUrl);
  return data.signedUrl;
}

const signedUrl = await testSignedUrl();
```

## Advanced Troubleshooting

### Verify Wasabi Bucket Settings

1. Log into Wasabi Console at https://console.wasabisys.com/
2. Navigate to your bucket
3. Check:
   - Bucket policy
   - CORS configuration
   - Access logs (if enabled)

### Test Direct S3 Access

Use AWS CLI with Wasabi endpoint:

```bash
# List objects in bucket
aws s3 ls s3://your-bucket-name/meetups/ --endpoint-url=https://s3.us-west-1.wasabisys.com

# Check specific object
aws s3api head-object --bucket your-bucket-name --key meetups/test-image.jpg --endpoint-url=https://s3.us-west-1.wasabisys.com
```

### Regenerate Credentials

If you suspect credential issues:

1. Create new access keys in Wasabi Console
2. Update your environment variables
3. Restart the development server

## Getting Help

If you continue to experience issues:

1. Check the complete [Image Storage documentation](./IMAGE_STORAGE.md)
2. Review Wasabi's [S3 API documentation](https://wasabi.com/s3-compatibility/)
3. Contact the development team with:
   - Browser console logs
   - Network request/response details
   - Environment details (browser, OS, network) 