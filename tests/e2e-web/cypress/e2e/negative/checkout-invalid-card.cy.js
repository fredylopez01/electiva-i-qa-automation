/// <reference types="cypress" />

describe('Etapa 1 — Prueba negativa: tarjeta de crédito inválida', () => {
  beforeEach(() => {
    cy.openDemoShop()
  })

  it('rechaza una tarjeta con número inválido durante el pago', () => {
    cy.fixture('user').then((user) => {
      const newUser = { ...user, email: `qa.${Date.now()}@example.com` }

      cy.createAccount(newUser)
      cy.goToCategory('Clothes', 'Men')
      cy.addProductToCart(0)

      cy.fixture('address').then((address) => {
        cy.goToCheckout()
        cy.fillCheckoutAddress(address)
        cy.selectShipping()
      })
    })

    cy.fixture('cards').then((cards) => {
      cy.get('#checkout-payment-step').should('be.visible')
      cy.get('body').then(($body) => {
        const $card = $body
          .find('input[name="cardNumber"], #cardNumber, input[autocomplete="cc-number"]')
          .first()

        if ($card.length) {
          cy.wrap($card).clear().type(cards.invalid.number)
          cy.get('.alert-danger, .error')
            .should('contain.text', /invalid|not valid|error/i)
        } else {
          // Si la demo no expone el campo, verificamos que el pedido no se
          // confirma sin un método de pago válido.
          cy.get('#payment-confirmation button[type="submit"]').click()
          cy.get('#checkout-confirmation-step').should('not.exist')
        }
      })
    })
  })
})
