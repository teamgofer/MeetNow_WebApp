import React from 'react';

import withMobileResponsive from '../../hocs/withMobileResponsive';

const ExampleComponent = ({
  isMobile,
  isTablet,
  isDesktop,
  orientation,
  isTouchDevice,
  currentBreakpoint,
}) => {
  // Responsive styles based on device type
  const containerStyles = {
    padding: isMobile ? '1rem' : '2rem',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '1rem' : '2rem',
  };

  // Responsive text sizes
  const textStyles = {
    fontSize: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem',
    lineHeight: isMobile ? '1.5' : '1.75',
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Device Information</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>Device Type:</div>
          <div>{isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</div>
          <div>Orientation:</div>
          <div>{orientation}</div>
          <div>Breakpoint:</div>
          <div>{currentBreakpoint}</div>
          <div>Touch Device:</div>
          <div>{isTouchDevice ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg p-4"
        style={containerStyles}
      >
        <div
          className="bg-white p-4 rounded shadow"
          style={{
            width: isMobile ? '100%' : isTablet ? '50%' : '33.33%',
            ...textStyles,
          }}
        >
          <h3 className="font-semibold mb-2">Responsive Card</h3>
          <p>
            This card adjusts its width and text size based on the device type. On mobile, it takes
            full width, on tablet 50%, and on desktop 33.33%.
          </p>
        </div>

        <div
          className="bg-white p-4 rounded shadow"
          style={{
            width: isMobile ? '100%' : isTablet ? '50%' : '33.33%',
            ...textStyles,
          }}
        >
          <h3 className="font-semibold mb-2">Another Card</h3>
          <p>The layout and spacing also adjust automatically based on the screen size.</p>
        </div>

        {!isMobile && (
          <div
            className="bg-white p-4 rounded shadow"
            style={{
              width: isTablet ? '50%' : '33.33%',
              ...textStyles,
            }}
          >
            <h3 className="font-semibold mb-2">Desktop Only Card</h3>
            <p>This card is only visible on tablet and desktop devices.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap the component with mobile responsiveness
const ExampleWithMobileResponsive = withMobileResponsive(ExampleComponent, {
  responsiveProps: {
    default: {
      className: 'default-class',
    },
    sm: {
      className: 'sm-class',
    },
    md: {
      className: 'md-class',
    },
    lg: {
      className: 'lg-class',
    },
  },
});

export default ExampleWithMobileResponsive;
