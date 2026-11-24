/// <reference types="cypress" />

describe('Etapa 1 — Prueba negativa: checkout con carrito vacío', () => {
  beforeEach(() => {
    cy.openDemoShop()
  })

  it('no permite continuar al checkout sin productos en el carrito', () => {
    cy.openCart()
    cy.get('.cart-grid, #cart')
      .should('contain.text', /empty|no products/i)

    cy.get('body').then(($body) => {
      const checkoutLinks = [...$body.find('a')].filter((el) =>
        /proceed to checkout/i.test(el.textContent)
      )
      expect(checkoutLinks, 'botones de checkout').to.have.length(0)
    })
  })
})
