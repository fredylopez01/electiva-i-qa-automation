/// <reference types="cypress" />

describe('Etapa 1 — Prueba negativa: login inválido', () => {
  beforeEach(() => {
    cy.openDemoShop()
  })

  it('muestra un error al iniciar sesión con contraseña incorrecta', () => {
    cy.fixture('user').then((user) => {
      cy.loginWithInvalidPassword(user.email, 'wrong-password')
      cy.shopFind('.alert-danger')
        .should('be.visible')
        .and('contain.text', /invalid|incorrect|wrong/i)
    })
  })
})
