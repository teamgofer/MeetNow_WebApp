// ***********************************************
// This example commands.js can be used to create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Custom command for testing map navigation
Cypress.Commands.add('navigateMap', (lat, lng, zoom) => {
  cy.window().then((win) => {
    // Access the map instance if available
    if (win.mapInstance) {
      win.mapInstance.setView([lat, lng], zoom);
    }
  });
});

// Custom command for verifying map position
Cypress.Commands.add('verifyMapPosition', (expectedLat, expectedLng, precisionDigits = 4) => {
  cy.window().then((win) => {
    if (win.mapInstance) {
      const center = win.mapInstance.getCenter();
      expect(center.lat.toFixed(precisionDigits)).to.equal(expectedLat.toFixed(precisionDigits));
      expect(center.lng.toFixed(precisionDigits)).to.equal(expectedLng.toFixed(precisionDigits));
    }
  });
}); 