import React from 'react';
import ReactDOM from 'react-dom/client';
import UiDemo from './UiDemo';

/**
 * Demo launcher - you can use this to view components in isolation
 * Run with: npx vite --config vite.ui-demo.config.js
 * (You would need to create vite.ui-demo.config.js first)
 */

// Simple wrapper to add some global styling
const DemoWrapper = () => {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #4a90e2 0%, #357ae8 100%)', 
        color: 'white', 
        padding: '1rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1>MeetNow UI Component Library</h1>
        <p>Design and test components in isolation</p>
      </header>
      
      <UiDemo />
      
      <footer style={{ 
        marginTop: '3rem', 
        textAlign: 'center', 
        padding: '1rem', 
        borderTop: '1px solid #eee',
        color: '#666'
      }}>
        MeetNow &copy; {new Date().getFullYear()} - UI Component Playground
      </footer>
    </div>
  );
};

// Initialize the React app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DemoWrapper />
  </React.StrictMode>
);

export default DemoWrapper; 