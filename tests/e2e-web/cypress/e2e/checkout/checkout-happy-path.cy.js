/// <reference types="cypress" />

describe('Etapa 1 — Checkout happy path en PrestaShop Demo', () => {
  beforeEach(() => {
    cy.openDemoShop()
  })

  it('crea cuenta, hace login, agrega dos productos y completa el checkout', () => {
    cy.fixture('user').then((user) => {
      // El demo crea una tienda temporal, por eso el correo debe ser único.
      const newUser = { ...user, email: `qa.${Date.now()}@example.com` }

      // 1. Crear una cuenta de usuario
      cy.createAccount(newUser)

      // 2. Hacer login con usuario y contraseña correctos
      cy.logout()
      cy.login(newUser.email, newUser.password)

      // 3. Adicionar un producto al carrito
      cy.goToCategory('Clothes', 'Men')
      cy.addProductToCart(0)

      // 4. Adicionar otro producto diferente al carrito
      cy.goToCategory('Clothes', 'Women')
      cy.addProductToCart(0)

      // 5. Hacer checkout: envío, método de envío y método de pago
      cy.fixture('address').then((address) => {
        cy.goToCheckout()
        cy.fillCheckoutAddress(address)
        cy.selectShipping()
        cy.payWithCard()
        cy.verifyOrderConfirmation()
      })
    })
  })
})
