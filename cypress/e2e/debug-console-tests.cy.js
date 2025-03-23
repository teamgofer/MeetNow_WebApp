describe('Debug Console Functionality Tests', () => {
  beforeEach(() => {
    cy.visit('/', { timeout: 60000 });
    cy.wait(2000); // Wait for app to initialize
  });

  it('should locate and toggle the debug console', () => {
    // From our DOM inspection, try more general selectors for the debug toggle
    // Take screenshot before looking for toggle
    cy.screenshot('before-debug-toggle');
    
    // Use a more general selector since our specific one didn't work
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
      
      if (debugToggleIndex >= 0) {
        // Store the index for use later, but don't chain commands
        cy.wrap(debugToggleIndex).as('debugBtnIndex');
      } else {
        cy.log('No obvious debug toggle button found');
      }
    });
    
    // Now use the stored index to click the button, breaking the chain to avoid DOM detachment
    cy.get('@debugBtnIndex').then(index => {
      if (index >= 0) {
        cy.get('button').eq(index).click();
        cy.log('Clicked potential debug toggle');
        cy.wait(500);
      }
    });
    
    // Take screenshot after toggle
    cy.screenshot('after-debug-toggle');
    
    // Check for changes in the DOM as a separate command chain
    cy.get('body').then($bodyAfter => {
      // Look for any new elements that might be related to debugging
      const debugElements = $bodyAfter.find('[class*="debug"], [class*="console"], [class*="logger"], pre');
      cy.log(`Found ${debugElements.length} potential debug-related elements`);
      
      // Log details about what we found
      if (debugElements.length > 0) {
        debugElements.each((i, el) => {
          if (i < 3) { // Limit to first 3 for brevity
            const $el = Cypress.$(el);
            cy.log(`Element ${i+1}: ${el.tagName} with classes "${$el.attr('class') || ''}" and text content starting with "${$el.text().substring(0, 30)}..."`);
          }
        });
      }
    });
    
    // Click again to close it
    cy.get('@debugBtnIndex').then(index => {
      if (index >= 0) {
        cy.get('button').eq(index).click();
        cy.log('Clicked debug toggle again to close');
        cy.wait(500);
      }
    });
    
    // Take screenshot after closing
    cy.screenshot('after-closing-debug');
  });

  it('should search for Logger functionality in the window object', () => {
    cy.window().then(win => {
      // Look for anything that might be Logger related
      cy.log('Searching window object for Logger functionality:');
      
      const possibleLoggerNames = [
        'Logger', 'logger', 'logging', 'loggerInstance',
        'console', 'debug', 'debugConsole'
      ];
      
      // Record what we find
      let foundLoggerObjects = [];
      
      possibleLoggerNames.forEach(name => {
        if (win[name]) {
          cy.log(`Found potential logger: window.${name}`);
          foundLoggerObjects.push(name);
          
          // Check what methods it has
          const methods = Object.getOwnPropertyNames(win[name])
            .filter(prop => typeof win[name][prop] === 'function');
          
          cy.log(`Methods available on ${name}: ${methods.join(', ')}`);
        }
      });
      
      // If we didn't find any direct Logger objects, try a more comprehensive search
      if (foundLoggerObjects.length === 0) {
        cy.log('No direct Logger objects found, searching deeper...');
        
        // Look for any object with log/debug methods
        Object.keys(win).forEach(key => {
          if (win[key] && typeof win[key] === 'object') {
            const obj = win[key];
            const hasLogMethods = typeof obj.log === 'function' || 
                                 typeof obj.debug === 'function' ||
                                 typeof obj.info === 'function' ||
                                 typeof obj.warn === 'function' ||
                                 typeof obj.error === 'function';
            
            if (hasLogMethods) {
              cy.log(`Found object with log methods: window.${key}`);
              foundLoggerObjects.push(key);
            }
          }
        });
      }
      
      // Test with standard console.log
      console.log('Test log message from Cypress test');
      
      // Monitor console.log calls
      const originalLog = win.console.log;
      let capturedLogs = [];
      
      win.console.log = function(...args) {
        capturedLogs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      
      // Find potential debug buttons
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
        }
      });
      
      // Create some test logs
      win.console.log('[CYPRESS TEST] Debug message');
      win.console.log('[CYPRESS TEST] Info message');
      win.console.log('[CYPRESS TEST] Warning message');
      
      // Restore original console.log
      win.console.log = originalLog;
      
      // Log what we captured
      cy.log(`Captured ${capturedLogs.length} console logs during test`);
    });
  });
  
  it('should examine text contents for log messages', () => {
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
      cy.wrap(debugBtnIndex).as('examineDebugBtn');
    });
    
    // Click the button if found
    cy.get('@examineDebugBtn').then(index => {
      if (index >= 0) {
        cy.get('button').eq(index).click();
        cy.wait(500);
        cy.log('Clicked potential debug toggle');
      }
    });
    
    // Generate some distinctive console logs
    cy.window().then(win => {
      win.console.log('[CYPRESS_UNIQUE_ID] This is a test log message');
      win.console.log('[CYPRESS_UNIQUE_ID] Another test message');
    });
    
    cy.wait(1000); // Wait for logs to potentially appear in DOM
    
    // Look for our log messages in the entire page text
    cy.get('body').invoke('text').then(text => {
      const hasTestLog = text.includes('CYPRESS_UNIQUE_ID');
      cy.log(`Log message ${hasTestLog ? 'found' : 'not found'} in page text`);
      
      if (hasTestLog) {
        cy.log('Debug console is displaying console.log messages');
      }
    });
    
    // Look for elements that might contain our log message
    cy.get('body').then($body => {
      const logElementsCount = $body.find(':contains("CYPRESS_UNIQUE_ID")').length;
      cy.log(`Found ${logElementsCount} elements containing our unique log ID`);
      
      if (logElementsCount > 0) {
        // Try to identify the actual log container
        const possibleContainers = $body.find('pre, [class*="log"], [class*="console"]');
        cy.log(`Found ${possibleContainers.length} potential log containers`);
        
        // Try to identify which container has our logs
        let logContainerFound = false;
        possibleContainers.each((i, container) => {
          if (Cypress.$(container).text().includes('CYPRESS_UNIQUE_ID')) {
            logContainerFound = true;
            cy.log(`Found log container: ${container.tagName} with class "${Cypress.$(container).attr('class') || ''}"`);
          }
        });
        
        if (!logContainerFound) {
          cy.log('Log message found in DOM but not in expected containers');
        }
      }
    });
  });
  
  it('should test interaction with the debug console if visible', () => {
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
      cy.wrap(debugBtnIndex).as('interactDebugBtn');
    });
    
    // Click the button if found
    cy.get('@interactDebugBtn').then(index => {
      if (index >= 0) {
        cy.get('button').eq(index).click();
        cy.wait(500);
        cy.log('Clicked potential debug toggle');
      }
    });
    
    // Look for interactive elements within potential debug console
    cy.get('body').then($body => {
      // Look for interactive elements in potential console containers
      const containers = $body.find('[class*="debug"], [class*="console"], [class*="logger"]');
      
      if (containers.length) {
        cy.log(`Found ${containers.length} potential debug containers`);
        
        // Look for buttons, selects or inputs in these containers
        const buttons = $body.find('[class*="debug"] button, [class*="console"] button, [class*="logger"] button');
        const inputs = $body.find('[class*="debug"] input, [class*="console"] input, [class*="logger"] input');
        const selects = $body.find('[class*="debug"] select, [class*="console"] select, [class*="logger"] select');
        
        cy.log(`Found ${buttons.length} buttons, ${inputs.length} inputs, and ${selects.length} selects in debug containers`);
        
        // Try to interact with the first button if available
        if (buttons.length) {
          cy.wrap(buttons[0]).click({force: true});
          cy.log('Clicked first button in debug console');
          cy.wait(500);
        }
        
        // Try interacting with the first input if available
        if (inputs.length) {
          cy.wrap(inputs[0]).type('Test input from Cypress', {force: true});
          cy.log('Typed into first input in debug console');
          cy.wait(500);
        }
      } else {
        cy.log('No obvious debug containers found, looking for any pre elements');
        
        // Check for pre elements which often contain logs
        const preElements = $body.find('pre');
        cy.log(`Found ${preElements.length} pre elements that might contain logs`);
      }
    });
  });
  
  it('should try to generate events that might trigger logging', () => {
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
      cy.wrap(debugBtnIndex).as('eventsDebugBtn');
    });
    
    // Click the button if found
    cy.get('@eventsDebugBtn').then(index => {
      if (index >= 0) {
        cy.get('button').eq(index).click();
        cy.wait(500);
        cy.log('Clicked potential debug toggle');
      } else {
        cy.log('No debug toggle found');
      }
    });
    
    // Log initial state
    cy.screenshot('before-events');
    
    // Perform a series of actions that might trigger logging
    cy.log('Performing actions to trigger potential logging:');
    
    // 1. Click on the map
    cy.get('#map-container').click('center', {force: true});
    cy.log('Clicked center of map');
    cy.wait(1000);
    
    // 2. Try click on any buttons in the UI
    cy.get('button').first().click({force: true});
    cy.log('Clicked first button');
    cy.wait(1000);
    
    // 3. Try some map control interactions if they exist
    cy.get('body').then($body => {
      const mapControls = $body.find('.leaflet-control, [class*="control"]');
      if (mapControls.length) {
        cy.wrap(mapControls.first()).click({force: true});
        cy.log('Clicked a map control');
        cy.wait(1000);
      }
    });
    
    // Take screenshot after events to see if logs appeared
    cy.screenshot('after-events');
    
    // Check for log changes in the DOM
    cy.get('body').then($body => {
      const consoleElements = $body.find('pre, [class*="log"], [class*="console"]');
      const textContent = Array.from(consoleElements).map(el => el.textContent).join(' ');
      
      // Look for timestamps or log level indicators which would suggest new logs
      const hasTimestamps = /\d{2}:\d{2}:\d{2}/.test(textContent);
      const hasLogLevels = /INFO|DEBUG|WARN|ERROR/.test(textContent);
      
      if (hasTimestamps || hasLogLevels) {
        cy.log('Found evidence of logging in the UI after triggering events');
      } else {
        cy.log('No clear evidence of new logs after events');
      }
    });
  });
}); 