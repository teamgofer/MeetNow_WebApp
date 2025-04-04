import { uploadFile, getSignedFileUrl, deleteFile } from './wasabi-storage';

/**
 * Test function to verify Wasabi bucket connectivity
 * This uploads a small test file, attempts to get a URL for it, and then deletes it
 */
export const testWasabiBucket = async () => {
  console.log('⏳ Testing Wasabi bucket connection...');

  try {
    // Create a small test file
    const testBlob = new Blob(['This is a test file for MeetNow Wasabi integration'], {
      type: 'text/plain',
    });
    const testFile = new File([testBlob], 'wasabi-test.txt', { type: 'text/plain' });

    // Test path
    const testPath = `test/wasabi-test-${Date.now()}.txt`;

    console.log(`Attempting to upload test file to: ${testPath}`);

    // Try uploading the file
    const { success, url, error } = await uploadFile(testFile, testPath);

    if (!success || error) {
      console.error('❌ Wasabi upload test failed:', error);
      return { success: false, error: error?.message || 'Upload failed' };
    }

    console.log(`✅ Upload successful! File available at: ${url}`);

    // Test getting a signed URL
    console.log('Testing signed URL generation...');
    const signedUrl = await getSignedFileUrl(testPath);

    if (!signedUrl) {
      console.error('❌ Failed to generate signed URL');
    } else {
      console.log(`✅ Signed URL generated successfully: ${signedUrl}`);
    }

    // Clean up by deleting the test file
    console.log('Cleaning up test file...');
    const deleteSuccess = await deleteFile(testPath);

    if (deleteSuccess) {
      console.log('✅ Test file deleted successfully');
    } else {
      console.log('⚠️ Could not delete test file. It may need manual cleanup.');
    }

    return {
      success: true,
      message: 'Wasabi bucket test completed successfully!',
      uploadUrl: url,
      signedUrl: signedUrl,
    };
  } catch (err) {
    console.error('❌ Wasabi test error:', err);
    return {
      success: false,
      error: err.message || 'Unknown error during Wasabi test',
    };
  }
};

export default testWasabiBucket;
