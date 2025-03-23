describe('Debug Console Inspector', () => {
  beforeEach(() => {
    // Visit the main page
    cy.visit('/', { timeout: 60000 });
    cy.wait(3000); // Wait for scripts to load and execute
  });

  it('should find and interact with the debug console if it exists', () => {
    cy.log('=== DEBUG CONSOLE ANALYSIS ===');
    
    // Check for various possible debug console selectors
    cy.get('body').then($body => {
      const debugSelectors = [
        '.debug-console',
        '[data-testid*="debug"]',
        '.debug-panel',
        '[id*="debug"]',
        '[class*="debug"]',
        '.logger-console',
        '[data-testid*="logger"]'
      ];
      
      let debugConsoleFound = false;
      
      debugSelectors.forEach(selector => {
        const elements = $body.find(selector);
        cy.log(`${selector}: ${elements.length} elements found`);
        
        if (elements.length > 0 && !debugConsoleFound) {
          debugConsoleFound = true;
          cy.log(`Potential debug console found: ${selector}`);
          
          // Try to log debug console content
          cy.get(selector).then($debug => {
            cy.log(`Debug console content: ${$debug.text().substring(0, 200)}...`);
            
            // Look for any log entries
            const logEntries = $debug.find('[class*="log"], [class*="entry"], li, .message');
            if (logEntries.length) {
              cy.log(`Found ${logEntries.length} log entries`);
              // Log first 5 entries
              for (let i = 0; i < Math.min(5, logEntries.length); i++) {
                cy.log(`Log entry ${i+1}: ${logEntries.eq(i).text()}`);
              }
            }
          });
        }
      });
      
      // Look for debug console toggle button
      const toggleButtonSelectors = [
        'button[class*="debug"]',
        '[data-testid*="toggle-debug"]',
        'button[class*="logger"]',
        '[aria-label*="debug"]',
        '[aria-label*="console"]'
      ];
      
      let toggleFound = false;
      
      toggleButtonSelectors.forEach(selector => {
        const buttons = $body.find(selector);
        if (buttons.length && !toggleFound) {
          toggleFound = true;
          cy.log(`Potential debug console toggle found: ${selector}`);
          
          // Try to click it to open debug console if not already open
          if (!debugConsoleFound) {
            cy.get(selector).first().click({force: true});
            cy.wait(1000);
            cy.log('Clicked potential debug toggle button');
            
            // Check again for debug console
            debugSelectors.forEach(debugSelector => {
              cy.get('body').then($updatedBody => {
                const elements = $updatedBody.find(debugSelector);
                if (elements.length) {
                  cy.log(`Debug console appeared after clicking toggle: ${debugSelector}`);
                }
              });
            });
          }
        }
      });
      
      if (!debugConsoleFound && !toggleFound) {
        cy.log('No visible debug console or toggle button found');
        
        // Check JavaScript for debug console in window
        cy.window().then(win => {
          const possibleConsoleNames = [
            'debugConsole', 
            'logger', 
            'Logger', 
            'debug', 
            'Debug', 
            'console', 
            'loggerInstance'
          ];
          
          possibleConsoleNames.forEach(name => {
            if (win[name]) {
              cy.log(`Found potential logger in window: ${name}`);
              
              // Try to inspect its methods
              try {
                const methods = Object.getOwnPropertyNames(win[name]);
                cy.log(`Methods available on ${name}: ${methods.join(', ')}`);
                
                // Try common logger methods
                if (typeof win[name].getLogs === 'function') {
                  const logs = win[name].getLogs();
                  cy.log(`Retrieved ${logs?.length || 0} logs from ${name}.getLogs()`);
                  if (logs && logs.length) {
                    cy.log(`Latest log: ${JSON.stringify(logs[logs.length - 1])}`);
                  }
                }
                
                if (typeof win[name].getHistory === 'function') {
                  const history = win[name].getHistory();
                  cy.log(`Retrieved ${history?.length || 0} entries from ${name}.getHistory()`);
                }
              } catch (e) {
                cy.log(`Error inspecting ${name}: ${e.message}`);
              }
            }
          });
        });
      }
    });
  });
  
  it('should attempt to generate logs for the debug console', () => {
    cy.log('=== ATTEMPTING TO GENERATE DEBUG LOGS ===');
    
    // Try to find the debug console or initialize it
    cy.window().then(win => {
      // Log that we're attempting to generate logs
      cy.log('Attempting to generate debug entries...');
      
      // Try different approaches to log messages
      if (win.logger && typeof win.logger.log === 'function') {
        win.logger.log('Cypress test debug message');
        cy.log('Added log using win.logger.log()');
      }
      
      if (win.Logger && typeof win.Logger.log === 'function') {
        win.Logger.log('Cypress test debug message');
        cy.log('Added log using win.Logger.log()');
      }
      
      if (win.debug && typeof win.debug.log === 'function') {
        win.debug.log('Cypress test debug message');
        cy.log('Added log using win.debug.log()');
      }
      
      if (win.debugConsole && typeof win.debugConsole.log === 'function') {
        win.debugConsole.log('Cypress test debug message');
        cy.log('Added log using win.debugConsole.log()');
      }
      
      // Try to invoke map navigation to generate logs
      if (win.mapNavigationController) {
        cy.log('Attempting to use mapNavigationController to generate logs');
        try {
          // Common methods that might exist
          const methods = [
            'navigateTo',
            'setView',
            'flyTo',
            'panTo',
            'gotoLocation'
          ];
          
          // Try each method with dummy coordinates
          methods.forEach(method => {
            if (typeof win.mapNavigationController[method] === 'function') {
              try {
                win.mapNavigationController[method](37.7749, -122.4194);
                cy.log(`Successfully called mapNavigationController.${method}`);
              } catch (e) {
                cy.log(`Error calling mapNavigationController.${method}: ${e.message}`);
                
                // Try with an object parameter instead
                try {
                  win.mapNavigationController[method]({ lat: 37.7749, lng: -122.4194 });
                  cy.log(`Successfully called mapNavigationController.${method} with object param`);
                } catch (e2) {
                  cy.log(`Error calling with object param: ${e2.message}`);
                }
              }
            }
          });
        } catch (e) {
          cy.log(`General error with mapNavigationController: ${e.message}`);
        }
      }
    });
    
    // Wait a moment for logs to appear
    cy.wait(2000);
    
    // Check if we can see the logs we generated
    cy.get('body').then($body => {
      const debugElements = $body.find('[class*="debug"], [class*="log"], [class*="console"]');
      if (debugElements.length) {
        cy.log(`Found ${debugElements.length} possible debug elements after generating logs`);
        const newText = debugElements.text();
        if (newText.includes('Cypress test')) {
          cy.log('Successfully found our test message in the debug output!');
        }
      }
    });
  });
}); 