/// <reference types="cypress" />

// Los 5 pasos son dependientes: comparten la sesión (cookies) y el carrito.
// testIsolation: false evita que Cypress limpie ese estado entre it(), así que
// el setup (abrir la tienda y crear la cuenta) se ejecuta una sola vez y en orden.
describe(
  'Etapa 1 — Checkout happy path en PrestaShop Demo',
  { testIsolation: false },
  () => {
    let newUser
    let address

    before(() => {
      cy.openDemoShop()
      cy.fixture('user').then((user) => {
        // El demo crea una tienda temporal, por eso el correo debe ser único.
        newUser = { ...user, email: `qa.${Date.now()}@example.com` }
      })
      cy.fixture('address').then((data) => {
        address = data
      })
    })

    it('1. crear cuenta', () => {
      cy.createAccount(newUser)
    })

    it('2. hacer login', () => {
      cy.logout()
      cy.login(newUser.email, newUser.password)
    })

    it('3. adicionar producto 1', () => {
      cy.visitShop(Cypress.env('shopUrl'))
      cy.get('.product-miniature').should('have.length.greaterThan', 1)
      cy.addProductToCart(0)
    })

    it('4. adicionar producto 2', () => {
      cy.addProductToCart(1)
    })

    it('5. completar checkout', () => {
      cy.goToCheckout()
      cy.fillCheckoutAddress(address)
      cy.selectShipping()
      cy.payWithCard()
      cy.verifyOrderConfirmation()
    })
  },
)
