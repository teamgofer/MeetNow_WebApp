import { testWasabiBucket } from '../src/utils/wasabi-test.js';

// Run the test when the page loads
window.addEventListener('DOMContentLoaded', async () => {
  const resultElement = document.getElementById('test-result');
  
  if (!resultElement) {
    console.error('Could not find result element');
    return;
  }
  
  resultElement.innerHTML = '<p>Testing Wasabi bucket connection...</p>';
  
  try {
    const result = await testWasabiBucket();
    
    if (result.success) {
      resultElement.innerHTML = `
        <div class="success">
          <h3>✅ Test Successful!</h3>
          <p>${result.message}</p>
          ${result.uploadUrl ? `
            <p class="mt-2">
              <strong>Upload URL:</strong><br>
              <a href="${result.uploadUrl}" target="_blank">${result.uploadUrl}</a>
            </p>
          ` : ''}
          ${result.signedUrl ? `
            <p class="mt-2">
              <strong>Signed URL:</strong><br>
              <a href="${result.signedUrl}" target="_blank">${result.signedUrl}</a>
            </p>
          ` : ''}
        </div>
      `;
    } else {
      resultElement.innerHTML = `
        <div class="error">
          <h3>❌ Test Failed</h3>
          <p>${result.error || 'Unknown error'}</p>
        </div>
      `;
    }
  } catch (error) {
    resultElement.innerHTML = `
      <div class="error">
        <h3>❌ Error During Test</h3>
        <p>${error.message || 'Unknown error occurred'}</p>
      </div>
    `;
  }
}); 
 
 