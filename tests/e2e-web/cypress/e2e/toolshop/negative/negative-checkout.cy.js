/// <reference types="cypress" />

const SHOP_URL = "https://practicesoftwaretesting.com";
const PRODUCT_ID = "01M85QYN1Q1591YDXYM601X6B3";

describe(
  "Pruebas negativas de checkout en Practice Software Testing",
  { retries: 0 },
  () => {
    it("rechaza el inicio de sesión con credenciales inválidas", () => {
      cy.visit(`${SHOP_URL}/auth/login`);
      cy.get('[data-test="email"]').type(
        `no-existe.${Date.now()}@example.com`,
      );
      cy.get('[data-test="password"]').type("WrongPassword2026!");
      cy.get('[data-test="login-submit"]').click();

      cy.get(".alert-danger, [role='alert']")
        .should("be.visible")
        .should(($alert) => {
          expect($alert.text()).to.match(
            /invalid|incorrect|wrong|inválid|incorrecta|incorrectos/i,
          );
        });
      cy.location("pathname").should("eq", "/auth/login");
    });

    it("no permite continuar el checkout con el carrito vacío", () => {
      cy.visit(`${SHOP_URL}/checkout`);

      cy.get('[data-test="proceed-1"]').should("not.exist");
      cy.get('[data-test="proceed-2"]').should("not.exist");
      cy.get('[data-test="proceed-3"]').should("not.exist");
      cy.get('[data-test="finish"]').should("not.exist");
    });

    it("rechaza una tarjeta de crédito inválida", () => {
      const user = {
        firstName: "QA",
        lastName: "Negative",
        email: `qa.negative.${Date.now()}@example.com`,
        password: "QaPractice2026!",
      };

      cy.visit(`${SHOP_URL}/auth/register`);
      cy.get('[data-test="first-name"]').type(user.firstName);
      cy.get('[data-test="last-name"]').type(user.lastName);
      cy.get('[data-test="dob"]').type("1990-01-01");
      cy.get('[data-test="country"]').select("United States of America (the)");
      cy.get('[data-test="postal_code"]').type("10001");
      cy.get('[data-test="house_number"]').type("42");
      cy.get('[data-test="street"]').should(($input) => {
        expect($input.val(), "calle autocompletada").not.to.be.empty;
      });
      cy.get('[data-test="phone"]').type("2025550100");
      cy.get('[data-test="email"]').type(user.email);
      cy.get('[data-test="password"]').type(user.password);
      cy.get('[data-test="register-submit"]').click();
      cy.location("pathname").should("not.eq", "/auth/register");

      cy.visit(`${SHOP_URL}/auth/login`);
      cy.get('[data-test="email"]').type(user.email);
      cy.get('[data-test="password"]').type(user.password);
      cy.get('[data-test="login-submit"]').click();
      cy.location("pathname").should("not.eq", "/auth/login");

      cy.visit(`${SHOP_URL}/product/${PRODUCT_ID}`);
      cy.get('[data-test="add-to-cart"]').click();
      cy.get('[role="alert"]').should("be.visible");
      cy.visit(`${SHOP_URL}/checkout`);
      cy.get('[data-test="proceed-1"]').click();
      cy.get("body").then(($body) => {
        if ($body.find('[data-test="login-submit"]').length) {
          cy.get('[data-test="email"]').type(user.email);
          cy.get('[data-test="password"]').type(user.password);
          cy.get('[data-test="login-submit"]').click();
        }
      });
      cy.get('[data-test="proceed-2"]').should("be.visible").click();
      cy.get('[data-test="country"]', { timeout: 20000 })
        .should("be.visible")
        .select("US");
      cy.get('[data-test="postal_code"]').clear().type("10001");
      cy.get('[data-test="house_number"]').clear().type("42");
      cy.get('[data-test="street"]').should(($input) => {
        expect($input.val(), "calle de envío autocompletada").not.to.be.empty;
      });
      cy.get('[data-test="proceed-3"]').click();

      cy.get("#payment-method").should("be.visible").select("credit-card");
      cy.get("input").filter((_, input) =>
        /credit.card.number|número de tarjeta de crédito/i.test(
          `${input.placeholder} ${input.name} ${input.id}`,
        ),
      )
        .should("be.visible")
        .type("4111111111111112");
      cy.get("input").filter((_, input) =>
        /expiry|expiration|fecha de vencimiento/i.test(
          `${input.placeholder} ${input.name} ${input.id}`,
        ),
      )
        .first()
        .type("12/2030");
      cy.get("input").filter((_, input) =>
        /\bcvv\b/i.test(`${input.placeholder} ${input.name} ${input.id}`),
      )
        .first()
        .type("123");
      cy.get("input").filter((_, input) =>
        /cardholder|card holder|titular de la tarjeta/i.test(
          `${input.placeholder} ${input.name} ${input.id}`,
        ),
      )
        .first()
        .type("QA Negative");

      cy.get('[data-test="finish"]').should("be.disabled");
      cy.get("body").should(($body) => {
        expect(
          /invalid|incorrect|not valid|declined|inválid|no válido|incorrecta|rechazad/i.test(
            $body.text(),
          ),
          "mensaje de rechazo de tarjeta",
        ).to.eq(true);
        expect(
          /order (?:number|confirmation|placed|confirmed)|thank you|pedido (?:número|confirmado|realizado)|gracias/i.test(
            $body.text(),
          ),
          "no se confirma el pedido",
        ).to.eq(false);
      });
    });
  },
);
