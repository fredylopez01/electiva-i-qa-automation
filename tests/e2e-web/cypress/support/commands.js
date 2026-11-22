/// <reference types="cypress" />

/**
 * Comandos reutilizables para PrestaShop Demo.
 *
 * La tienda se renderiza dentro de un iframe del mismo dominio, por lo que
 * todas las interacciones pasan por `cy.shopBody()`.
 * Referencia: https://glebbahmutov.com/blog/flaky-iframe-test/
 */

const IFRAME = 'iframe[title="Frame of demo shop"]'

Cypress.Commands.add('shopBody', () =>
  cy
    .get(IFRAME, { timeout: 30000 })
    .its('0.contentDocument.body', { timeout: 30000 })
    .should('not.be.empty')
)

Cypress.Commands.add('shopFind', (selector, options) =>
  cy.shopBody().find(selector, options)
)

Cypress.Commands.add('shopContains', (selector, text, options) =>
  // Envolver el body en jQuery permite usar `contains`, que no se puede
  // encadenar directamente sobre un elemento BODY.
  cy.shopBody().then(cy.wrap).contains(selector, text, options)
)

/** Abre el demo, espera a que desaparezca el loader y a que exista la tienda. */
Cypress.Commands.add('openDemoShop', () => {
  cy.visit('/')
  cy.get('#loadingMessage', { timeout: 60000 }).should('not.be.visible')
  cy.shopFind('.header-top').should('be.visible')
  // Empezamos a vigilar los scripts antes de navegar dentro de la tienda.
  cy.waitForNetworkIdlePrepare({ method: 'GET', pattern: '*.js', alias: 'shopJs' })
})

/** Espera a que terminen de cargarse los JS que registran los eventos click. */
Cypress.Commands.add('waitForShopAssets', () => {
  cy.waitForNetworkIdle('@shopJs', 40)
})

Cypress.Commands.add('goToCategory', (category, subcategory) => {
  cy.shopFind('.header-top').should('be.visible').contains('a', category).click()
  cy.shopFind('.breadcrumb').should('include.text', category)
  if (subcategory) {
    cy.shopContains('.category-sub-menu a', subcategory).click()
    cy.shopFind('.breadcrumb').should('include.text', subcategory)
  }
})

/** Agrega el producto `index` de la lista actual al carrito. */
Cypress.Commands.add('addProductToCart', (index = 0) => {
  cy.shopFind('.products .product')
    .should('have.length.greaterThan', index)
    .eq(index)
    .click()

  cy.shopFind('#main .product-container').should('be.visible')
  cy.waitForShopAssets()
  cy.shopFind('#main .product-container').within(() => {
    cy.contains('button', /add to cart/i).should('be.visible').click()
  })
  cy.shopFind('#blockcart-modal').should('be.visible')
})

Cypress.Commands.add('openSignIn', () => {
  cy.shopContains('.header-top a, .user-info a', /sign in|my account/i).click()
  cy.shopFind('#login_form').should('be.visible')
})

Cypress.Commands.add('createAccount', (user) => {
  cy.openSignIn()
  cy.shopContains('a', /create an account|no account/i).click()
  cy.shopFind('#account-creation_form').should('be.visible')
  cy.shopFind('#firstname').clear().type(user.firstName)
  cy.shopFind('#lastname').clear().type(user.lastName)
  cy.shopFind('#email').clear().type(user.email)
  cy.shopFind('#passwd').clear().type(user.password)
  cy.shopFind('#confirmation').clear().type(user.password)
  cy.shopFind('#submitAccount').click()
  cy.shopFind('.account, #center_column').should('contain.text', user.firstName)
})

Cypress.Commands.add('login', (email, password) => {
  cy.openSignIn()
  cy.shopFind('#email').clear().type(email)
  cy.shopFind('#passwd').clear().type(password)
  cy.shopFind('#SubmitLogin').click()
  cy.shopFind('.header-top').should('contain.text', email.split('@')[0])
})

Cypress.Commands.add('loginWithInvalidPassword', (email, password) => {
  cy.openSignIn()
  cy.shopFind('#email').clear().type(email)
  cy.shopFind('#passwd').clear().type(password)
  cy.shopFind('#SubmitLogin').click()
})

Cypress.Commands.add('logout', () => {
  cy.shopContains('.header-top a, .user-info a', /sign out|logout/i).click()
  cy.shopContains('.header-top a', /sign in/i).should('be.visible')
})

Cypress.Commands.add('goToCheckout', () => {
  cy.shopContains('#blockcart-modal a', /proceed to checkout/i).click()
  cy.shopFind('.cart-grid').should('be.visible')
  cy.shopContains('.cart-grid a', /proceed to checkout/i).click()
  cy.shopFind('#checkout-personal-information-step').should('be.visible')
})

Cypress.Commands.add('fillCheckoutAddress', (address) => {
  cy.shopFind('#checkout-address-step').should('be.visible')
  cy.shopFind('#address1').clear().type(address.address1)
  cy.shopFind('#city').clear().type(address.city)
  cy.shopFind('#postcode').clear().type(address.postcode)
  cy.shopFind('#phone').clear().type(address.phone)
  cy.shopFind('#confirm-addresses').click()
  cy.shopFind('#checkout-shipping-step').should('be.visible')
})

Cypress.Commands.add('selectShipping', () => {
  cy.shopFind('#checkout-shipping-step').should('be.visible')
  cy.shopFind('input[name="id_delivery_option"]').first().check({ force: true })
  cy.shopFind('#confirmDeliveryOption').click()
  cy.shopFind('#checkout-payment-step').should('be.visible')
})

/** Selecciona el pago con tarjeta, acepta condiciones y confirma el pedido. */
Cypress.Commands.add('payWithCard', () => {
  cy.shopFind('#checkout-payment-step').should('be.visible')
  cy.shopFind('input[name="payment-option"][data-module-name="ps_checkout"]').check({ force: true })
  cy.shopFind('#conditions-to-approve input[type="checkbox"]').check({ force: true })
  cy.shopFind('#payment-confirmation button[type="submit"]').click()
})

Cypress.Commands.add('verifyOrderConfirmation', () => {
  cy.shopFind('#checkout-confirmation-step, .order-confirmation').should('be.visible')
})
