/// <reference types="cypress" />

describe('Etapa 1 — Prueba negativa: checkout con carrito vacío', () => {
  beforeEach(() => {
    cy.openDemoShop()
  })

  it('no permite continuar al checkout sin productos en el carrito', () => {
    cy.shopContains('.header-top a, .blockcart a', /cart/i).first().click()
    cy.shopFind('.cart-grid, #blockcart-modal')
      .should('be.visible')
      .and('contain.text', /empty|no products/i)
    cy.shopFind('.cart-grid a')
      .then(($links) => {
        const checkoutLinks = [...$links].filter((el) =>
          /proceed to checkout/i.test(el.textContent)
        )
        expect(checkoutLinks, 'botones de checkout').to.have.length(0)
      })
  })
})
