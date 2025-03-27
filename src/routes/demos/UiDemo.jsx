import React from 'react';
import AnimatedButton from './AnimatedButton';

/**
 * Demo component that showcases all UI POC elements
 * This can be imported into the main app when ready
 */
const UiDemo = () => {
  return (
    <div className="ui-demo-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>MeetNow UI Components</h2>
      
      <section style={{ marginBottom: '2rem' }}>
        <h3>Animated Buttons</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <AnimatedButton text="Primary Button" variant="primary" />
          <AnimatedButton text="Secondary Button" variant="secondary" />
          <AnimatedButton text="Success Button" variant="success" />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <AnimatedButton text="Small" size="small" variant="primary" />
          <AnimatedButton text="Medium" size="medium" variant="primary" />
          <AnimatedButton text="Large" size="large" variant="primary" />
        </div>
      </section>
      
      {/* Add more component showcases here */}
    </div>
  );
};

export default UiDemo; 