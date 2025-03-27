describe('Performance Dashboard', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
    
    // Wait for application to load
    cy.get('[data-testid="app-container"]', { timeout: 10000 }).should('be.visible');
    
    // Enable debug mode
    cy.window().then(win => {
      win.localStorage.setItem('feature_DEBUG_MODE', 'true');
      win.localStorage.setItem('feature_ENABLE_PERFORMANCE_TRACKING', 'true');
    });
    
    // Reload to apply changes
    cy.reload();
    
    // Open debug menu
    cy.get('.debug-menu-toggle').click();
  });
  
  it('should navigate to performance dashboard', () => {
    // Click on Performance Dashboard button in debug menu
    cy.contains('Performance Dashboard').click();
    
    // Verify navigation to dashboard page
    cy.url().should('include', '/performance');
    
    // Dashboard should be visible
    cy.get('.performance-page').should('be.visible');
    cy.contains('MeetNow Performance Dashboard').should('be.visible');
  });
  
  it('should display component render times', () => {
    // Navigate to dashboard
    cy.contains('Performance Dashboard').click();
    
    // Component metrics section should be visible
    cy.get('[data-testid="component-metrics"]').should('be.visible');
    
    // Should contain data for at least one component
    cy.get('[data-testid="component-metric-row"]').should('have.length.at.least', 1);
  });
  
  it('should allow filtering metrics by component', () => {
    // Navigate to dashboard
    cy.contains('Performance Dashboard').click();
    
    // Find filter input
    cy.get('[data-testid="component-filter"]').type('MeetupCard');
    
    // Filtered results should only show MeetupCard data
    cy.get('[data-testid="component-metric-row"]').each($row => {
      cy.wrap($row).should('contain', 'MeetupCard');
    });
  });
  
  it('should display performance over time chart', () => {
    // Navigate to dashboard
    cy.contains('Performance Dashboard').click();
    
    // Time-series chart should be visible
    cy.get('[data-testid="performance-chart"]').should('be.visible');
    
    // Chart controls should be present
    cy.get('[data-testid="chart-timeframe-selector"]').should('be.visible');
    
    // Change timeframe
    cy.get('[data-testid="chart-timeframe-selector"]').select('Last hour');
    
    // Chart should update
    cy.get('[data-testid="performance-chart"]').should('be.visible');
  });
  
  it('should allow exporting performance data', () => {
    // Navigate to dashboard
    cy.contains('Performance Dashboard').click();
    
    // Export button should be visible
    cy.get('[data-testid="export-data"]').should('be.visible');
    
    // Click export (we can't test the download itself in Cypress easily,
    // but we can verify the button triggers an action)
    cy.get('[data-testid="export-data"]').click();
    
    // Success message should appear
    cy.contains('Data exported successfully').should('be.visible');
  });
  
  it('should refresh data automatically', () => {
    // Navigate to dashboard
    cy.contains('Performance Dashboard').click();
    
    // Get initial update time
    cy.get('[data-testid="last-updated"]').invoke('text').as('initialTime');
    
    // Force automatic refresh (speed up the test)
    cy.get('[data-testid="refresh-data"]').click();
    
    // Verify time has changed
    cy.get('@initialTime').then(initialTime => {
      cy.get('[data-testid="last-updated"]').should('not.have.text', initialTime);
    });
  });
  
  it('should highlight performance issues', () => {
    // Navigate to dashboard
    cy.contains('Performance Dashboard').click();
    
    // Simulate slow component by injecting data
    cy.window().then(win => {
      if (win.performanceMonitor) {
        // Add a slow component render to the performance data
        win.performanceMonitor.trackOperationTiming(
          'component', 
          'SlowComponent:render', 
          150, // Very slow render time
          { renderCount: 1 }
        );
      }
    });
    
    // Refresh data
    cy.get('[data-testid="refresh-data"]').click();
    
    // Issues section should highlight the slow component
    cy.get('[data-testid="performance-issues"]').should('contain', 'SlowComponent');
  });
}); 