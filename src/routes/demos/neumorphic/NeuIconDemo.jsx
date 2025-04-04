import React from 'react';

import '../neumorphic/neumorphic.css';
import * as ActionIcons from './icons/ActionIcons';
import * as CategoryIcons from './icons/CategoryIcons';
import * as ChartIcons from './icons/ChartIcons';
import * as NavigationIcons from './icons/NavigationIcons';

const IconSection = ({ title, icons }) => {
  return (
    <div className="neu-section">
      <h2>{title}</h2>
      <div className="neu-icon-grid">
        {Object.entries(icons).map(([name, Icon]) => (
          <div key={name} className="neu-icon-item">
            <div className="neu-icon neu-icon-medium">
              <Icon />
            </div>
            <div className="neu-icon-label">{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NeuIconDemo = () => {
  return (
    <div className="neu-container">
      <h1 className="neu-title">MeetNow Neumorphic Icon Library</h1>
      <p className="neu-description">
        A comprehensive collection of neumorphic-styled icons for the MeetNow platform. These icons
        are built as React components for easy integration into the UI.
      </p>

      <IconSection title="Chart Icons" icons={ChartIcons} />
      <IconSection title="Category Icons" icons={CategoryIcons} />
      <IconSection title="Action Icons" icons={ActionIcons} />
      <IconSection title="Navigation Icons" icons={NavigationIcons} />

      <div className="neu-section">
        <h2>Icon Sizes</h2>
        <div className="neu-example-row">
          <div className="neu-example-item">
            <div className="neu-icon neu-icon-small">
              <NavigationIcons.Home />
            </div>
            <div className="neu-icon-label">Small</div>
          </div>
          <div className="neu-example-item">
            <div className="neu-icon neu-icon-medium">
              <NavigationIcons.Home />
            </div>
            <div className="neu-icon-label">Medium</div>
          </div>
          <div className="neu-example-item">
            <div className="neu-icon neu-icon-large">
              <NavigationIcons.Home />
            </div>
            <div className="neu-icon-label">Large</div>
          </div>
        </div>
      </div>

      <div className="neu-section">
        <h2>Icon Variants</h2>
        <div className="neu-example-row">
          <div className="neu-example-item">
            <div className="neu-icon neu-icon-medium neu-icon-primary">
              <ActionIcons.Add />
            </div>
            <div className="neu-icon-label">Primary</div>
          </div>
          <div className="neu-example-item">
            <div className="neu-icon neu-icon-medium neu-icon-success">
              <ActionIcons.Add />
            </div>
            <div className="neu-icon-label">Success</div>
          </div>
          <div className="neu-example-item">
            <div className="neu-icon neu-icon-medium neu-icon-danger">
              <ActionIcons.Add />
            </div>
            <div className="neu-icon-label">Danger</div>
          </div>
          <div className="neu-example-item">
            <div className="neu-icon neu-icon-medium neu-icon-info">
              <ActionIcons.Add />
            </div>
            <div className="neu-icon-label">Info</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuIconDemo;
