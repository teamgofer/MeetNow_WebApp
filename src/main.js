import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';
import Loading from './components/ui/loading';
import { ComponentRegistryProvider } from './components/ui/ComponentRegistry';
import { setupLeaflet } from './lib/leaflet-setup';
import { cleanupSupabase } from './lib/supabase';
import { printEnvironmentVerification } from './utils/verify-env';
import MeetNowApp from './components/MeetNowApp';
import ImageUploadTest from './routes/demos/ImageUploadTest';
import './global.css';
import './index.css';
setupLeaflet();
let supabaseInitCount = 0;
let wasabiInitCount = 0;
const originalConsoleLog = console.log;
console.log = function (...args) {
    if (typeof args[0] === 'string') {
        if (args[0].includes('Supabase') || args[0].includes('supabase')) {
            supabaseInitCount++;
        }
        if (args[0].includes('Wasabi') || args[0].includes('wasabi')) {
            wasabiInitCount++;
        }
    }
    originalConsoleLog.apply(console, args);
};
if (import.meta.env.DEV) {
    printEnvironmentVerification();
}
setInterval(() => {
    originalConsoleLog(`[Monitoring] Supabase init count: ${supabaseInitCount}, Wasabi init count: ${wasabiInitCount}`);
}, 5000);
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        cleanupSupabase();
    });
}
const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('Root element not found');
}
else {
    ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(ErrorBoundary, { fallback: _jsxs("div", { className: "p-4 max-w-md mx-auto mt-8 bg-red-50 rounded-lg border border-red-200", children: [_jsx("h3", { className: "text-lg font-semibold text-red-600 mb-2", children: "Map Loading Issue" }), _jsx("p", { className: "text-red-500 mb-4", children: "Please check:" }), _jsxs("ul", { className: "list-disc pl-6 space-y-2", children: [_jsx("li", { children: "Location permissions in browser settings" }), _jsx("li", { children: "Internet connection" }), _jsx("li", { children: "Ad-blockers or security software" })] }), _jsx("button", { className: "mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700", onClick: () => window.location.reload(), children: "Reload Application" })] }), children: _jsx(Suspense, { fallback: _jsx(Loading, {}), children: _jsx(ComponentRegistryProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(MeetNowApp, {}) }), _jsx(Route, { path: "/image-upload-test", element: _jsx(ImageUploadTest, {}) })] }) }) }) }) }) }));
}
//# sourceMappingURL=main.js.map