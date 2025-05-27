describe('child view', () => {
  it('loads child profile', () => {
    cy.visit('/children/test-child');
    cy.contains('Child View');
  });
});
