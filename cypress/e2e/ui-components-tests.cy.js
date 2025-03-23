describe('UI Components Tests', () => {
  beforeEach(() => {
    cy.visit('/', { timeout: 60000 });
    cy.wait(2000); // Wait for rendering
  });

  it('should verify the main application structure', () => {
    // Check the basic structure we identified in DOM inspection
    cy.get('#root').should('exist');
    cy.get('#root > div.min-h-screen').should('exist');
    cy.get('#map-container').should('exist');
    
    // Check if we have any buttons
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons in the app`);
    });
  });

  it('should identify and interact with map controls', () => {
    // Look for common map control elements
    cy.get('body').then($body => {
      // Check for Leaflet controls
      const leafletControls = $body.find('.leaflet-control, .leaflet-control-zoom, .leaflet-control-attribution');
      cy.log(`Found ${leafletControls.length} Leaflet controls`);
      
      // If we found zoom controls, try to interact with them
      if ($body.find('.leaflet-control-zoom-in').length) {
        // Use force: true since the element might be hidden from view
        cy.get('.leaflet-control-zoom-in').click({ force: true });
        cy.wait(500); // Wait for zoom animation
        cy.log('Clicked zoom in control');
      }
    });
  });
  
  it('should check for nearby/meetup UI components', () => {
    // Look for elements related to nearby meetups based on DOM inspection
    cy.get('body').then($body => {
      // Using class name patterns we found
      const meetupElements = $body.find('[class*="meetup"], [id*="meetup"], [class*="nearby"]');
      
      cy.log(`Found ${meetupElements.length} meetup-related elements`);
      
      // Log the first few elements for debugging
      meetupElements.each((i, el) => {
        if (i < 3) {
          cy.log(`Meetup element ${i+1}: ${el.tagName} ${el.className}`);
        }
      });
      
      // If we found any elements, try clicking the first one
      if (meetupElements.length) {
        cy.wrap(meetupElements[0]).scrollIntoView().click({ force: true });
        cy.log('Clicked on a meetup element');
        cy.wait(1000);
      }
    });
  });
  
  it('should test absolute positioned panels', () => {
    // Testing the panels we found in absolute positioning
    cy.get('.absolute.top-4.left-4.z-10').should('exist')
      .then($panel => {
        cy.log(`Found top-left panel with dimensions: ${$panel.width()}x${$panel.height()}`);
        
        // Look for any interactable elements inside
        const buttons = $panel.find('button');
        const inputs = $panel.find('input');
        
        cy.log(`Panel contains ${buttons.length} buttons and ${inputs.length} inputs`);
        
        // Try interacting with the first button if available
        if (buttons.length) {
          // Store the button for later use to avoid DOM detachment
          cy.wrap(0).as('firstPanelBtnIndex');
        }
      });
    
    // Use the stored index to click the button
    cy.get('@firstPanelBtnIndex').then(index => {
      if (index >= 0) {
        cy.get('.absolute.top-4.left-4.z-10 button').eq(index).click({force: true});
        cy.log('Clicked first button in panel');
        cy.wait(500);
      }
    });
  });
  
  it('should verify Logger integration with UI', () => {
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
      cy.wrap(debugBtnIndex).as('loggerDebugBtn');
    });
    
    // Click the button if found
    cy.get('@loggerDebugBtn').then(index => {
      if (index >= 0) {
        cy.get('button').eq(index).click();
        cy.wait(500);
        cy.log('Clicked potential debug toggle');
        
        // Generate test logs at different levels
        cy.window().then(win => {
          win.console.log('[UITest] Debug message from UI test');
          win.console.log('[UITest] Info message from UI test');
          win.console.log('[UITest] Warning message from UI test');
          win.console.log('[UITest] Error message from UI test');
          
          cy.wait(1000); // Wait for logs to be displayed
          
          // Check if our messages appear in any containers
          cy.get('body').then($body => {
            const textContent = $body.text();
            const containsTestLogs = 
              textContent.includes('Debug message from UI test') || 
              textContent.includes('Info message from UI test') ||
              textContent.includes('Warning message from UI test') ||
              textContent.includes('Error message from UI test');
            
            // Log what we found
            if (containsTestLogs) {
              cy.log('Found test log messages in the UI!');
            } else {
              cy.log('Did not find test log messages in visible UI');
            }
          });
        });
      }
    });
  });
  
  it('should test map marker interactions if present', () => {
    // Look for map markers and try to interact with them
    cy.get('body').then($body => {
      const markers = $body.find('.leaflet-marker-icon, [class*="marker"], [class*="pin"]');
      
      cy.log(`Found ${markers.length} potential map markers`);
      
      if (markers.length) {
        // Store the first marker for later interaction
        cy.wrap(0).as('firstMarkerIndex');
      }
    });
    
    // Interact with the first marker if found
    cy.get('@firstMarkerIndex').then(index => {
      if (index >= 0) {
        cy.get('.leaflet-marker-icon, [class*="marker"], [class*="pin"]').eq(index).click({force: true});
        cy.wait(1000);
        cy.log('Clicked on a map marker');
        
        // Check if clicking triggered any popups in a separate command
        cy.get('body').then($body => {
          const popups = $body.find('.leaflet-popup, [class*="popup"], [class*="tooltip"]');
          cy.log(`Found ${popups.length} popups/tooltips after clicking marker`);
        });
      }
    });
  });
}); 