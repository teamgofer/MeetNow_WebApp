import React, { Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Leaflet and its styles first
import 'leaflet/dist/leaflet.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';

// Import our components and utilities
import Loading from './components/ui/loading';
import { ComponentRegistryProvider } from './components/ui/ComponentRegistry';
import { setupLeaflet } from './lib/leaflet-setup';
import { cleanupSupabase } from './lib/supabase';
import { printEnvironmentVerification } from './utils/verify-env';
import MeetNowApp from './components/MeetNowApp';
import ImageUploadTest from './routes/demos/ImageUploadTest';
import './global.css';
import './index.css';

// Initialize Leaflet with plugins
setupLeaflet();

// Add counters to monitor initialization
let supabaseInitCount = 0;
let wasabiInitCount = 0;

// Create wrappers to intercept and count initializations
const originalConsoleLog = console.log;
console.log = function (...args) {
  if (typeof args[0] === 'string') {
    // Check for Supabase initialization logs
    if (args[0].includes('Supabase') || args[0].includes('supabase')) {
      supabaseInitCount++;
    }

    // Check for Wasabi initialization logs
    if (args[0].includes('Wasabi') || args[0].includes('wasabi')) {
      wasabiInitCount++;
    }
  }
  originalConsoleLog.apply(console, args);
};

// In development mode, verify environment variables on startup
if (import.meta.env.DEV) {
  printEnvironmentVerification();
}

// Log the counts every 5 seconds
setInterval(() => {
  originalConsoleLog(
    `[Monitoring] Supabase init count: ${supabaseInitCount}, Wasabi init count: ${wasabiInitCount}`
  );
}, 5000);

// Handle hot module replacement
// @ts-ignore
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.dispose(() => {
    cleanupSupabase();
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <ErrorBoundary
          fallback={
            <div className="p-4 max-w-md mx-auto mt-8 bg-red-50 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Map Loading Issue</h3>
              <p className="text-red-500 mb-4">Please check:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Location permissions in browser settings</li>
                <li>Internet connection</li>
                <li>Ad-blockers or security software</li>
              </ul>
              <button
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={() => window.location.reload()}
              >
                Reload Application
              </button>
            </div>
          }
        >
          <Suspense fallback={<Loading />}>
            <ComponentRegistryProvider>
              <Routes>
                <Route path="/" element={<MeetNowApp />} />
                <Route path="/image-upload-test" element={<ImageUploadTest />} />
              </Routes>
            </ComponentRegistryProvider>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </React.StrictMode>
  );
}
