/// <reference types="cypress" />

const SHOP_URL = "https://practicesoftwaretesting.com";
const PRODUCTS = [
  { id: "01M85MGVETVKW1WJ2TVRZZWJAW", name: "Combination Pliers" },
  { id: "01M85MGVEZAKD2GXTM68PQ9V70", name: "Pliers" },
];

describe(
  "Happy path de checkout en Practice Software Testing",
  { retries: 0 },
  () => {
    it("registra una cuenta, inicia sesión y completa una compra", () => {
      const user = {
        firstName: "QA",
        lastName: "Automation",
        email: `qa.${Date.now()}@example.com`,
        password: "QaPractice2026!",
      };
      let firstProductName;
      let secondProductName;

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

      cy.visit(`${SHOP_URL}/product/${PRODUCTS[0].id}`);
      cy.get("h1").should(($heading) => {
        expect($heading.text().trim()).to.eq(PRODUCTS[0].name);
      });
      cy.get('[data-test="add-to-cart"]').click();
      cy.get('[role="alert"]').should("be.visible");
      firstProductName = PRODUCTS[0].name;

      cy.visit(`${SHOP_URL}/product/${PRODUCTS[1].id}`);
      cy.get("h1").should(($heading) => {
        expect($heading.text().trim()).to.eq(PRODUCTS[1].name);
      });
      expect(PRODUCTS[1].name).not.to.eq(PRODUCTS[0].name);
      secondProductName = PRODUCTS[1].name;
      cy.get('[data-test="add-to-cart"]').click();
      cy.get('[role="alert"]').should("be.visible");

      cy.visit(`${SHOP_URL}/checkout`);
      cy.get("body")
        .should("contain.text", firstProductName)
        .and("contain.text", secondProductName);
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
        expect($input.val(), "calle de facturación autocompletada").not.to.be
          .empty;
      });
      cy.get('[data-test="proceed-3"]').click();

      cy.get("#payment-method")
        .should("be.visible")
        .select("cash-on-delivery");
      cy.get('[data-test="finish"]').click();
      cy.contains("button", /confirm|confirmar/i).click();
      cy.get("body", { timeout: 20000 }).should(($body) => {
        expect(
          /order (?:number|confirmation|placed|confirmed)|thank you|pedido (?:número|confirmado|realizado)|gracias/i.test(
            $body.text(),
          ),
          "confirmación del pedido",
        ).to.eq(true);
      });
    });
  },
);
