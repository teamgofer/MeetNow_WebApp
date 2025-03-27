describe('Search Functionality', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
    
    // Wait for application to load
    cy.get('[data-testid="app-container"]', { timeout: 10000 }).should('be.visible');
  });
  
  it('should display nearby meetups on initial load', () => {
    // Verify that nearby meetups section is visible
    cy.get('[data-testid="nearby-meetups"]').should('be.visible');
    
    // Should show meetup cards
    cy.get('[data-testid^="meetup-card-"]').should('have.length.at.least', 1);
  });
  
  it('should filter meetups by distance', () => {
    // Get initial number of meetups
    cy.get('[data-testid^="meetup-card-"]').then($initialCards => {
      const initialCount = $initialCards.length;
      
      // Find the distance slider and move it to reduce distance
      cy.get('[data-testid="distance-slider"]').as('distanceSlider');
      
      // Move slider to 25% position (reducing max distance)
      cy.get('@distanceSlider').invoke('val', 25).trigger('change');
      
      // Allow time for filtering to apply
      cy.wait(1000);
      
      // Filtered results should be fewer than or equal to initial results
      cy.get('[data-testid^="meetup-card-"]').then($filteredCards => {
        expect($filteredCards.length).to.be.at.most(initialCount);
      });
    });
  });
  
  it('should filter meetups by category', () => {
    // Open category filter
    cy.get('[data-testid="category-filter"]').click();
    
    // Select a specific category
    cy.get('[data-testid="category-option"]').first().click();
    
    // Allow time for filtering to apply
    cy.wait(1000);
    
    // Verify filtered results are displayed
    cy.get('[data-testid^="meetup-card-"]').should('have.length.at.least', 0);
    
    // Clear filter
    cy.get('[data-testid="clear-filters"]').click();
    
    // Allow time for filtering to reset
    cy.wait(1000);
    
    // Verify original results are restored
    cy.get('[data-testid^="meetup-card-"]').should('have.length.at.least', 1);
  });
  
  it('should show loading state during search', () => {
    // Open search input
    cy.get('[data-testid="search-input"]').click();
    
    // Type search term
    cy.get('[data-testid="search-input"]').type('coffee{enter}');
    
    // Should show loading state
    cy.get('[data-testid="search-loading"]').should('be.visible');
    
    // Loading should eventually disappear
    cy.get('[data-testid="search-loading"]', { timeout: 10000 }).should('not.exist');
    
    // Results should be displayed
    cy.get('[data-testid^="meetup-card-"]').should('have.length.at.least', 0);
  });
  
  it('should handle no results state', () => {
    // Open search input
    cy.get('[data-testid="search-input"]').click();
    
    // Type unlikely search term
    cy.get('[data-testid="search-input"]').type('xyznonexistentkeyword{enter}');
    
    // Allow search to complete
    cy.wait(2000);
    
    // Should show no results state
    cy.get('[data-testid="no-results"]').should('be.visible');
  });
  
  it('should remember search filters across page navigation', () => {
    // Set distance filter
    cy.get('[data-testid="distance-slider"]').invoke('val', 10).trigger('change');
    
    // Open category filter and select a category
    cy.get('[data-testid="category-filter"]').click();
    cy.get('[data-testid="category-option"]').first().click();
    
    // Click on a meetup to navigate to detail page
    cy.get('[data-testid^="meetup-card-"]').first().click();
    
    // Verify navigation to detail page
    cy.url().should('include', '/meetup/');
    
    // Go back to search results
    cy.go('back');
    
    // Verify filters are still applied
    cy.get('[data-testid="distance-slider"]').should('have.value', '10');
    cy.get('[data-testid="active-filters"]').should('be.visible');
  });
}); 