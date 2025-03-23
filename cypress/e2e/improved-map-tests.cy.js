describe('Improved Map Navigation Tests', () => {
  beforeEach(() => {
    cy.visit('/', { timeout: 60000 });
    cy.wait(2000); // Give time for the map to initialize
  });

  it('should locate and interact with the map container', () => {
    // Target the specific map container we found in our DOM inspection
    cy.get('#map-container').should('exist')
      .should('be.visible')
      .then($map => {
        cy.log(`Found map container with dimensions: ${$map.width()}x${$map.height()}`);
      });
  });

  it('should search for map controller functionality', () => {
    cy.window().then(win => {
      cy.log('Searching for map controller functionality...');
      
      // Check for any properties that might contain "map" or "navigation"
      const mapRelatedKeys = Object.keys(win).filter(key => 
        key.toLowerCase().includes('map') || 
        key.toLowerCase().includes('nav')
      );
      
      cy.log(`Found ${mapRelatedKeys.length} map-related global properties:`);
      mapRelatedKeys.forEach(key => cy.log(`- ${key}`));
      
      // Also look for React related objects that might help us find components
      const reactKeys = Object.keys(win).filter(key => 
        key.toLowerCase().includes('react') || 
        key.toLowerCase().includes('component') ||
        key.toLowerCase().includes('app')
      );
      
      if (reactKeys.length) {
        cy.log(`Found ${reactKeys.length} React-related keys`);
      }
      
      // Try to find map in the DOM
      cy.get('#map-container').then($container => {
        // Click the map to see if we can trigger any navigation events
        cy.wrap($container).click('center', {force: true});
        cy.log('Clicked on map container');
        cy.wait(1000);
      });
    });
  });
  
  it('should search for Logger functionality', () => {
    cy.window().then(win => {
      cy.log('Searching for Logger functionality...');
      
      // Check for any properties that might contain "log" in the name
      const loggerRelatedKeys = Object.keys(win).filter(key => 
        key.toLowerCase().includes('log')
      );
      
      cy.log(`Found ${loggerRelatedKeys.length} logger-related global properties:`);
      loggerRelatedKeys.forEach(key => cy.log(`- ${key}`));
      
      // Try to find console.log and replace it temporarily to monitor logging
      const originalConsoleLog = win.console.log;
      let loggedMessages = [];
      
      win.console.log = function(...args) {
        loggedMessages.push(args.join(' '));
        originalConsoleLog.apply(console, args);
      };
      
      // Generate some activity to trigger logging
      cy.get('body').click(10, 10, {force: true});
      cy.wait(1000);
      
      // Restore console.log
      win.console.log = originalConsoleLog;
      
      // Log what we captured
      cy.log(`Captured ${loggedMessages.length} console logs during activity`);
      loggedMessages.slice(0, 5).forEach(msg => {
        cy.log(`Captured log: ${msg.substring(0, 100)}`);
      });
    });
  });
  
  it('should find and interact with the debug console toggle', () => {
    // Use a more general selector to find the debug toggle button
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons on the page`);
      
      // Look for the button that might be our debug toggle
      let debugToggleIndex = -1;
      $buttons.each((i, btn) => {
        const $btn = Cypress.$(btn);
        const classes = $btn.attr('class') || '';
        const text = $btn.text().toLowerCase();
        
        // Log each button for debugging
        cy.log(`Button ${i+1}: text="${text}" classes="${classes}"`);
        
        // Check if it matches debug-related criteria
        if (
          classes.includes('fixed') || 
          classes.includes('debug') || 
          text.includes('debug') ||
          text.includes('log') ||
          text.includes('console')
        ) {
          debugToggleIndex = i;
          cy.log(`Potential debug toggle found: Button ${i+1}`);
        }
      });
      
      // Store the index for subsequent use
      cy.wrap(debugToggleIndex).as('debugBtnIndex');
    });
    
    // Now use the stored index to click the button
    cy.get('@debugBtnIndex').then(index => {
      if (index >= 0) {
        cy.get('button').eq(index).click();
        cy.log('Clicked potential debug toggle');
        cy.wait(500);
        
        // Check for debug elements in a separate command
        cy.get('body').then($body => {
          const debugElements = $body.find('[class*="debug"]');
          cy.log(`Found ${debugElements.length} debug elements after clicking toggle`);
        });
      } else {
        cy.log('No obvious debug toggle button found');
      }
    });
  });
  
  it('should check for debug elements when toggle is clicked', () => {
    // Find and store debug button index
    let debugBtnIndex = -1;
    cy.get('button').then($buttons => {
      $buttons.each((i, btn) => {
        const $btn = Cypress.$(btn);
        const classes = $btn.attr('class') || '';
        const text = $btn.text().toLowerCase();
        if (classes.includes('fixed') || 
           classes.includes('debug') || 
           text.includes('debug')) {
          debugBtnIndex = i;
          cy.log(`Found potential debug button at index ${i}`);
        }
      });
      cy.wrap(debugBtnIndex).as('checkDebugBtn');
    });
    
    // Click the button if found
    cy.get('@checkDebugBtn').then(index => {
      if (index >= 0) {
        cy.get('button').eq(index).click();
        cy.wait(500);
        cy.log('Clicked potential debug toggle');
      }
    });
    
    // Check for any debug-related elements
    cy.get('body').then($body => {
      // Look for any debug or console related elements
      const debugElements = $body.find(
        '[class*="debug"], [class*="console"], [class*="logger"], pre, [class*="log"]'
      );
      
      cy.log(`Found ${debugElements.length} potential debug elements`);
      
      if (debugElements.length > 0) {
        // Log the first few for inspection
        debugElements.each((i, el) => {
          if (i < 3) {
            cy.log(`Debug element ${i+1}: ${el.tagName} ${el.className}`);
          }
        });
      }
      
      // Try to trigger console to add a message using console.log
      cy.window().then(win => {
        win.console.log('[DEBUG] Test message for debug console from Cypress');
        cy.wait(500);
        
        // Check if our message appears in any elements
        debugElements.each((i, el) => {
          if (Cypress.$(el).text().includes('Test message for debug console')) {
            cy.log(`Found our test message in element: ${el.tagName} ${el.className}`);
          }
        });
      });
    });
  });
  
  it('should test map interactions', () => {
    // Wait for map to be fully loaded
    cy.get('#map-container').should('exist');
    cy.wait(1000);
    
    // Click the center of the map
    cy.get('#map-container').click('center', {force: true});
    cy.log('Clicked center of map');
    cy.wait(1000);
    
    // Look for any map controls (zoom buttons, etc)
    cy.get('body').then($body => {
      const mapControls = $body.find(
        '.leaflet-control-zoom, [class*="control"], button[class*="map"]'
      );
      
      cy.log(`Found ${mapControls.length} potential map controls`);
      
      if (mapControls.length) {
        // Click the first control to see what happens
        cy.wrap(mapControls[0]).click({force: true});
        cy.log('Clicked a map control');
        cy.wait(1000);
      }
    });
    
    // Try to capture any navigation events by monitoring DOM changes
    cy.window().then(win => {
      // Set up a mutation observer to track changes
      const observer = new win.MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            cy.log(`DOM updated: ${mutation.addedNodes.length} nodes added`);
          }
        });
      });
      
      // Start observing the map container
      const mapContainer = win.document.getElementById('map-container');
      if (mapContainer) {
        observer.observe(mapContainer, { childList: true, subtree: true });
        
        // Click map again
        cy.get('#map-container').click(100, 100, {force: true});
        cy.wait(1000);
        
        // Disconnect observer
        observer.disconnect();
      }
    });
  });
}); 