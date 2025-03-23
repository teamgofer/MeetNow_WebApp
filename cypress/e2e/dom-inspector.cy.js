describe('DOM Structure Inspector', () => {
  beforeEach(() => {
    // Visit the main page with a long timeout to ensure full loading
    cy.visit('/', { timeout: 60000 });
    // Wait for the root to be populated
    cy.get('#root', { timeout: 30000 }).should('not.be.empty');
    // Additional wait for any async operations, animations, etc.
    cy.wait(3000);
  });

  it('should analyze DOM structure and save to fixture', () => {
    // Overall structure summary
    cy.log('=== DOM STRUCTURE ANALYSIS ===');
    
    // 1. Log the direct children of the root element
    cy.get('#root').children().then($children => {
      cy.log(`Root has ${$children.length} direct children`);
      $children.each((i, child) => {
        cy.log(`Child ${i}: ${child.tagName.toLowerCase()}${child.id ? ' #' + child.id : ''} (${child.className})`);
      });
    });
    
    // 2. Check for map-related elements
    cy.log('=== MAP RELATED ELEMENTS ===');
    cy.get('body').then($body => {
      // Common Leaflet selectors
      const leafletSelectors = [
        '.leaflet-container',
        '.leaflet-map-pane',
        '.leaflet-tile',
        '.leaflet-marker-icon',
        '.leaflet-popup',
        '.leaflet-control'
      ];
      
      leafletSelectors.forEach(selector => {
        const elements = $body.find(selector);
        cy.log(`${selector}: ${elements.length} elements found`);
        if (elements.length > 0) {
          cy.log(`First ${selector} parent structure: ${getElementPath(elements[0])}`);
        }
      });
      
      // Check for any element with 'map' in its class or id
      const mapElements = $body.find('[class*="map"], [id*="map"], [data-testid*="map"]');
      cy.log(`Elements with 'map' in class/id/data-testid: ${mapElements.length}`);
      mapElements.each((i, el) => {
        if (i < 5) { // Limit to first 5 to avoid too much output
          cy.log(`Map element ${i}: ${el.tagName} ${el.className} ${el.id || ''}`);
        }
      });
    });
    
    // 3. Look for nearby or meetup related elements
    cy.log('=== MEETUP RELATED ELEMENTS ===');
    cy.get('body').then($body => {
      const meetupSelectors = [
        '[data-testid*="meetup"]',
        '[class*="meetup"]',
        '[id*="meetup"]',
        '[class*="nearby"]',
        '[data-testid*="nearby"]'
      ];
      
      meetupSelectors.forEach(selector => {
        const elements = $body.find(selector);
        cy.log(`${selector}: ${elements.length} elements found`);
        if (elements.length > 0 && elements.length < 10) {
          elements.each((i, el) => {
            cy.log(`${selector} element ${i}: ${el.tagName} ${el.className} ${el.id || ''}`);
          });
        }
      });
    });
    
    // 4. Check for navigation controls
    cy.log('=== NAVIGATION CONTROLS ===');
    cy.get('body').then($body => {
      const navSelectors = [
        '.leaflet-control-zoom',
        '.leaflet-control-locate',
        '[class*="navigation"]',
        'button[class*="locate"]',
        '[data-testid*="navigation"]'
      ];
      
      navSelectors.forEach(selector => {
        const elements = $body.find(selector);
        cy.log(`${selector}: ${elements.length} elements found`);
      });
    });
    
    // 5. Save full DOM structure to a fixture (limited depth to avoid massive output)
    cy.document().then(doc => {
      const structure = simplifyNode(doc.body, 0, 4);
      cy.writeFile('cypress/fixtures/dom-structure.json', structure);
      cy.log('Full DOM structure saved to cypress/fixtures/dom-structure.json');
    });
    
    // 6. Take screenshot for visual reference
    cy.screenshot('full-page-structure');
  });
});

// Helper function to get a readable path to element
function getElementPath(element, maxParents = 3) {
  let path = [];
  let current = element;
  let count = 0;
  
  while (current && count < maxParents) {
    let descriptor = current.tagName.toLowerCase();
    if (current.id) descriptor += `#${current.id}`;
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(' ').filter(Boolean);
      if (classes.length) descriptor += `.${classes.join('.')}`;
    }
    path.unshift(descriptor);
    current = current.parentElement;
    count++;
  }
  
  return path.join(' > ');
}

// Helper function to simplify DOM tree for JSON output
function simplifyNode(node, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return { truncated: true };
  
  // Skip non-element nodes
  if (node.nodeType !== 1) return null;
  
  const children = Array.from(node.children || [])
    .map(child => simplifyNode(child, depth + 1, maxDepth))
    .filter(Boolean);
  
  // Get data attributes
  const dataAttrs = [];
  Array.from(node.attributes || []).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      dataAttrs.push({ name: attr.name, value: attr.value });
    }
  });
  
  return {
    tag: node.tagName?.toLowerCase(),
    id: node.id || undefined,
    classes: node.className?.split?.(' ')?.filter(Boolean) || [],
    dataAttrs: dataAttrs.length ? dataAttrs : undefined,
    children: children.length ? children : undefined
  };
} 