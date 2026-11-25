// Plugins y comandos compartidos por todas las especificaciones.
// https://github.com/bahmutov/cypress-network-idle
import 'cypress-network-idle'
import './commands'

// El demo genera una instancia nueva por ejecución; no reutilizamos cookies
// entre pruebas para que cada caso sea independiente.
beforeEach(() => {
  Cypress.Cookies.debug(false)
})
