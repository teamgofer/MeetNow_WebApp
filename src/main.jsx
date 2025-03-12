import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import MeetNowApp from './MeetNowApp';
import Loading from '@/components/ui/loading';
import { ErrorBoundary } from 'react-error-boundary';
import './global.css';
import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';

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