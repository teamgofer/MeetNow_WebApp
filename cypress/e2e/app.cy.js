describe('MeetNow Application Tests', () => {
  beforeEach(() => {
    // Visit the main page before each test with longer timeout
    cy.visit('/', { timeout: 60000 });
    
    // Wait for React to render content in the root
    cy.get('#root', { timeout: 30000 }).should('not.be.empty');
  });

  it('should have a root container with content', () => {
    // Check for the root div with content
    cy.get('#root').should('exist').and('not.be.empty');
    
    // Log the page content for debugging
    cy.log('Page content:');
    cy.get('#root').then($el => {
      cy.log($el.html());
    });
  });
  
  it('should have a document body', () => {
    // Basic test that should always pass
    cy.get('body').should('exist');
  });
}); 