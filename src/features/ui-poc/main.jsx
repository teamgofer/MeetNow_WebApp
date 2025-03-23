import React from 'react';
import ReactDOM from 'react-dom/client';
import UiDemo from './UiDemo';
import './animated-button.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #4a90e2 0%, #357ae8 100%)', 
        color: 'white', 
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0' }}>MeetNow UI Component Library</h1>
        <p style={{ margin: '0' }}>Design and test components in isolation</p>
      </header>
      
      <UiDemo />
      
      <footer style={{ 
        marginTop: '40px', 
        textAlign: 'center', 
        padding: '20px', 
        borderTop: '1px solid #eee',
        color: '#666'
      }}>
        MeetNow &copy; {new Date().getFullYear()} - UI Component Playground
      </footer>
    </div>
  </React.StrictMode>
); 