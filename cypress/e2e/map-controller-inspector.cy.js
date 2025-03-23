describe('Map Navigation Controller Inspector', () => {
  beforeEach(() => {
    // Visit the main page
    cy.visit('/', { timeout: 60000 });
    cy.wait(3000); // Wait for scripts to load and execute
  });

  it('should analyze the map navigation controller in window object', () => {
    cy.log('=== MAP NAVIGATION CONTROLLER ANALYSIS ===');
    
    // Check if MapNavigationController exists in window
    cy.window().then(win => {
      cy.log('Available global objects with "map" or "navigation" in name:');
      Object.keys(win).forEach(key => {
        if (key.toLowerCase().includes('map') || key.toLowerCase().includes('navigation')) {
          cy.log(`Found global: ${key}`);
        }
      });
      
      // Check for common controller instances
      [
        'mapNavigationController', 
        'MapNavigationController', 
        'mapController', 
        'navigationController'
      ].forEach(propName => {
        if (win[propName]) {
          cy.log(`Found object: ${propName}`);
          try {
            // Try to log the structure of the controller
            const controller = win[propName];
            cy.log(`Properties of ${propName}:`);
            Object.getOwnPropertyNames(controller).forEach(prop => {
              if (typeof controller[prop] === 'function') {
                cy.log(`  Function: ${prop}`);
              } else {
                cy.log(`  Property: ${prop} = ${JSON.stringify(controller[prop])}`);
              }
            });
          } catch (e) {
            cy.log(`Error inspecting ${propName}: ${e.message}`);
          }
        }
      });
      
      // Check React devtools global hook to find component instances
      if (win.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        cy.log('React DevTools hook found - React is running on the page');
      }
    });
  });

  it('should attempt to detect map navigation interactions', () => {
    cy.log('=== ATTEMPTING TO DETECT NAVIGATION INTERACTIONS ===');
    
    // Try to spy on navigation methods using the window object
    cy.window().then(win => {
      // Define methods we might want to spy on
      const methodsToSpy = [
        'setView', 'flyTo', 'panTo', 'setZoom',
        'navigateTo', 'navigate', 'moveMap'
      ];
      
      // Look for map or leaflet instance
      let mapInstance = null;
      if (win.map) mapInstance = win.map;
      else if (win.leafletMap) mapInstance = win.leafletMap;
      
      if (mapInstance) {
        cy.log('Found map instance in window object');
        methodsToSpy.forEach(method => {
          if (typeof mapInstance[method] === 'function') {
            cy.log(`Found method ${method} on map instance`);
          }
        });
      } else {
        cy.log('No direct map instance found in window object');
      }
      
      // Try to find map element in the DOM
      cy.get('body').then($body => {
        const mapContainer = $body.find('.leaflet-container, [id="map"], [class*="mapContainer"]').first();
        if (mapContainer.length) {
          cy.log(`Found potential map container: ${mapContainer.prop('tagName')} ${mapContainer.attr('class') || ''}`);
          
          // Try interacting with the map if we found it
          cy.get(mapContainer).then($map => {
            cy.log('Attempting to click on the map to trigger navigation');
            cy.wrap($map).click('center', {force: true});
            cy.wait(1000);
            
            // Check if any navigation occurred by looking for changes
            cy.log('Check the console for any navigation events that might have occurred');
          });
        } else {
          cy.log('No map container element found in the DOM');
        }
      });
    });
  });
  
  it('should check for navigation related events', () => {
    cy.log('=== LISTENING FOR NAVIGATION EVENTS ===');
    
    // Create a listener for relevant events
    cy.window().then(win => {
      // List of events we want to monitor
      const eventsToMonitor = [
        'mapnavigate', 'navigate', 'locationchange', 'viewchange',
        'movestart', 'move', 'moveend', 'zoomstart', 'zoom', 'zoomend'
      ];
      
      // Log that we're setting up listeners
      cy.log(`Setting up listeners for events: ${eventsToMonitor.join(', ')}`);
      
      // Helper to record events
      win._navigationEvents = [];
      
      // Set up event listeners on window
      eventsToMonitor.forEach(eventName => {
        win.addEventListener(eventName, e => {
          win._navigationEvents.push({
            name: eventName,
            time: new Date().toISOString(),
            detail: e.detail ? JSON.stringify(e.detail) : 'no details'
          });
          console.log(`Navigation event detected: ${eventName}`, e);
        });
      });
      
      // Also listen on document
      eventsToMonitor.forEach(eventName => {
        win.document.addEventListener(eventName, e => {
          win._navigationEvents.push({
            name: `document:${eventName}`,
            time: new Date().toISOString(),
            detail: e.detail ? JSON.stringify(e.detail) : 'no details'
          });
          console.log(`Document navigation event detected: ${eventName}`, e);
        });
      });
      
      // Try to find map container to listen for events there too
      const mapContainer = win.document.querySelector('.leaflet-container, [id="map"], [class*="mapContainer"]');
      if (mapContainer) {
        eventsToMonitor.forEach(eventName => {
          mapContainer.addEventListener(eventName, e => {
            win._navigationEvents.push({
              name: `map:${eventName}`,
              time: new Date().toISOString(),
              detail: e.detail ? JSON.stringify(e.detail) : 'no details'
            });
            console.log(`Map navigation event detected: ${eventName}`, e);
          });
        });
      }
    });
    
    // Wait some time and interact with page to trigger events
    cy.wait(2000);
    cy.get('body').click(5, 5, {force: true});
    cy.wait(1000);
    
    // Try to click on various potential navigation elements
    cy.get('body').then($body => {
      const potentialButtons = $body.find(
        'button, [role="button"], [class*="control"], [class*="navigate"], [class*="location"]'
      );
      if (potentialButtons.length) {
        cy.log(`Found ${potentialButtons.length} potential navigation controls`);
        // Click on the first 3 if available
        for (let i = 0; i < Math.min(3, potentialButtons.length); i++) {
          cy.wrap(potentialButtons[i]).click({force: true});
          cy.wait(1000);
        }
      }
    });
    
    // Check what events we captured
    cy.window().then(win => {
      cy.log('Navigation events captured:');
      if (win._navigationEvents && win._navigationEvents.length) {
        win._navigationEvents.forEach(event => {
          cy.log(`Event: ${event.name}, Time: ${event.time}, Detail: ${event.detail}`);
        });
      } else {
        cy.log('No navigation events were captured');
      }
    });
  });
}); 