describe('Streaming chat', () => {
  it('sends a message and receives streaming tokens', () => {
    cy.visit('http://localhost:5173');
    cy.get('input[placeholder="Type a message..."]').type('Hello{enter}');
    cy.contains('Thinking...');
    cy.contains('Hello').should('be.visible');
  });
});
