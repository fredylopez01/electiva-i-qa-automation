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
      cy.shopFind('#checkout-payment-step').should('be.visible')
      cy.shopFind('input[name="cardNumber"], #cardNumber')
        .clear()
        .type(cards.invalid.number)
      cy.shopFind('.alert-danger, .error')
        .should('be.visible')
        .and('contain.text', /invalid|not valid|error/i)
    })
  })
})
