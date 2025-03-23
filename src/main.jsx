import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

// Import Leaflet and its styles first
import 'leaflet/dist/leaflet.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';

// Import our components and utilities
import MeetNowApp from './MeetNowApp';
import Loading from './components/ui/loading.jsx';
import { setupLeaflet } from './lib/leaflet-setup';
import { cleanupSupabase } from './lib/supabase';
import './global.css';
import './index.css';

// Initialize Leaflet with plugins
setupLeaflet();

// Handle hot module replacement
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupSupabase();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<div className="p-4 max-w-md mx-auto mt-8 bg-red-50 rounded-lg border border-red-200">
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
    </div>}>
      <Suspense fallback={<Loading />}>
        <MeetNowApp />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);