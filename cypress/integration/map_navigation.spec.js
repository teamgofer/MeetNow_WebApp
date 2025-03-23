/**
 * End-to-end tests for map navigation functionality
 * Tests user interactions with the map and various navigation methods
 */

describe('Map Navigation', () => {
  beforeEach(() => {
    // Visit the main page and wait for map to load
    cy.visit('/');
    cy.get('#map-container', { timeout: 10000 }).should('be.visible');
    
    // Wait for initial loading to complete
    cy.get('[data-testid="loading-indicator"]', { timeout: 15000 }).should('not.exist');
  });
  
  it('should center map on location when clicked', () => {
    // Spy on map's setView method
    cy.window().then((win) => {
      cy.spy(win.mapRef.current, 'setView').as('setView');
    });
    
    // Click on a point on the map
    cy.get('#map-container').click(300, 300);
    
    // Verify setView was called
    cy.get('@setView').should('have.been.called');
  });
  
  it('should navigate to a meetup when clicked in nearby panel', () => {
    // Wait for nearby meetups to load
    cy.get('.nearby-meetups-container', { timeout: 10000 }).should('be.visible');
    
    // Spy on map's setView method
    cy.window().then((win) => {
      cy.spy(win.mapRef.current, 'setView').as('setView');
    });
    
    // Click on the first meetup in the nearby panel
    cy.get('.nearby-meetups-container .meetup-card').first().click();
    
    // Verify setView was called
    cy.get('@setView').should('have.been.called');
  });
  
  it('switches between navigation modes correctly', () => {
    // Click on Bird's Eye View mode
    cy.get('[data-testid="birds-eye-button"]').click();
    
    // Verify map mode has changed
    cy.window().then((win) => {
      expect(win.currentNavigationMode).to.equal(2);
    });
    
    // There should be a visible flight path
    cy.get('.birds-eye-path').should('exist');
    
    // Click on Vicinity mode
    cy.get('[data-testid="vicinity-button"]').click();
    
    // Verify map mode has changed
    cy.window().then((win) => {
      expect(win.currentNavigationMode).to.equal(3);
    });
    
    // There should be a vicinity indicator
    cy.get('.vicinity-indicator').should('exist');
    
    // Click on Free Navigation mode
    cy.get('[data-testid="free-navigation-button"]').click();
    
    // Verify map mode has changed back to free navigation
    cy.window().then((win) => {
      expect(win.currentNavigationMode).to.equal(1);
    });
  });
  
  it('minimap click navigates to the selected location', () => {
    // Enable minimap if it's not visible
    cy.get('[data-testid="layers-button"]').click();
    cy.get('[data-testid="toggle-minimap"]').click();
    
    // Wait for minimap to be visible
    cy.get('.minimap-container', { timeout: 5000 }).should('be.visible');
    
    // Spy on map's setView method
    cy.window().then((win) => {
      cy.spy(win.mapRef.current, 'setView').as('setView');
    });
    
    // Click on minimap
    cy.get('.minimap-container').click();
    
    // Verify setView was called
    cy.get('@setView').should('have.been.called');
  });
  
  it('handles location search properly', () => {
    // Type location in search box
    cy.get('[data-testid="location-search"]').type('Los Angeles');
    
    // Wait for search results to appear
    cy.get('.search-results', { timeout: 5000 }).should('be.visible');
    
    // Spy on map's setView method
    cy.window().then((win) => {
      cy.spy(win.mapRef.current, 'setView').as('setView');
    });
    
    // Click on first search result
    cy.get('.search-results .search-result').first().click();
    
    // Verify setView was called
    cy.get('@setView').should('have.been.called');
  });
  
  it('debug console properly tracks navigation events', () => {
    // Open debug console
    cy.get('.debug-console-button').click();
    
    // Debug console should be visible
    cy.get('.debug-console').should('be.visible');
    
    // Clear logs
    cy.get('[data-testid="clear-logs-button"]').click();
    
    // Spy on map's setView method
    cy.window().then((win) => {
      cy.spy(win.mapRef.current, 'setView').as('setView');
    });
    
    // Perform navigation by clicking map
    cy.get('#map-container').click(300, 300);
    
    // Verify navigation was logged
    cy.get('.debug-console-logs').should('contain.text', 'Navigation successful');
    
    // Close debug console
    cy.get('[data-testid="close-console-button"]').click();
  });
}); 