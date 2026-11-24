/// <reference types="cypress" />

/**
 * Comandos reutilizables para PrestaShop Demo.
 *
 * El sitio principal crea la tienda dentro de un iframe. Mantenerse dentro del
 * iframe provoca errores de "detached from DOM" cada vez que la tienda navega,
 * porque el `contentDocument.body` se reemplaza. Por eso `openDemoShop()` lee
 * el `src` del iframe y visita la tienda como una página normal; a partir de
 * ahí todos los selectores son `cy.get` / `cy.contains` sobre el documento.
 *
 * PrestaShop 8 usa ids `field-*` y botones con `data-link-action`. Se mantienen
 * los selectores antiguos como fallback para no depender de una sola versión.
 */

const IFRAME = 'iframe[title="Frame of demo shop"], #framelive';

const EMAIL = 'input[name="email"], #field-email, #email';
const PASSWORD =
  'input[name="password"], input[name="passwd"], #field-password, #passwd';
const FIRSTNAME = 'input[name="firstname"], #field-firstname, #firstname';
const LASTNAME = 'input[name="lastname"], #field-lastname, #lastname';
const BIRTHDAY = 'input[name="birthday"], #field-birthday';
const SIGN_IN_BUTTON =
  'button[data-link-action="sign-in"], #submit-login, #SubmitLogin';
const CREATE_BUTTON =
  'button[data-link-action="save-customer"], #submitAccount';
const ADDRESS = 'input[name="address1"], #field-address1, #address1';
const CITY = 'input[name="city"], #field-city, #city';
const POSTCODE = 'input[name="postcode"], #field-postcode, #postcode';
const PHONE = 'input[name="phone"], #field-phone, #phone';

/** Scopea a un formulario si existe; si no, usa el body completo. */
const formIn = ($body, selectors) => {
  const $form = $body.find(selectors).first();
  return $form.length ? $form : $body;
};

const isShopUnavailable = ($body) =>
  $body.find("#cf-wrapper").length > 0 ||
  /sorry, we could not load|502\s*[-–]?\s*bad gateway/i.test($body.text());

/** Visita la tienda y reintenta respuestas 502 o fallos de red transitorios. */
const visitShop = (url, attempt = 0) => {
  cy.visit(url, {
    timeout: 120000,
    failOnStatusCode: false,
    retryOnNetworkFailure: true,
    retryAttempts: 2,
  });
  cy.get("body").then(($body) => {
    const unavailable = isShopUnavailable($body);
    if (unavailable && attempt < 2) {
      cy.wait(3000);
      visitShop(url, attempt + 1);
    } else {
      expect(unavailable, "tienda demo disponible (sin 502)").to.eq(false);
    }
  });
};

const fill = ($form, selectors, value) =>
  cy.wrap($form).find(selectors).first().clear().type(value);

const clickIn = ($form, selectors) =>
  cy.wrap($form).find(selectors).first().click();

Cypress.Commands.add("openDemoShop", () => {
  cy.visit("/");
  cy.get("#loadingMessage", { timeout: 60000 }).should("not.be.visible");

  cy.get(IFRAME, { timeout: 30000 })
    .should(($iframe) => {
      const src = $iframe.attr("src");
      expect(src, "shop url").to.be.a("string").and.not.be.empty;
    })
    .invoke("attr", "src")
    .then((src) => {
      Cypress.env("shopUrl", src);
      visitShop(src);
    });

  // Vigilar los JS antes de navegar dentro de la tienda.
  cy.waitForNetworkIdlePrepare({
    method: "GET",
    pattern: "*.js",
    alias: "shopJs",
  });
});

/** Espera a que terminen los JS que registran los eventos click. */
Cypress.Commands.add("waitForShopAssets", () => {
  cy.waitForNetworkIdle("@shopJs", 40);
});

Cypress.Commands.add("shopFind", (selector, options) =>
  cy.get(selector, options),
);

Cypress.Commands.add("shopContains", (selector, text, options) =>
  cy.contains(selector, text, options),
);

/** Navega por el texto exacto del link, aunque esté dentro de un accordion. */
const goToLinkByText = (text) => {
  cy.get("body").then(($body) => {
    const $link = $body
      .find("a.category-tree__item-link, .header-top a, .header-nav a, a")
      .filter(
        (index, element) =>
          element.textContent.trim().toLowerCase() === text.toLowerCase(),
      )
      .first();
    expect($link.length, `link de ${text}`).to.be.greaterThan(0);
    const base = Cypress.env("shopUrl") || Cypress.config("baseUrl");
    visitShop(new URL($link.attr("href"), base).href);
  });
};

Cypress.Commands.add("visitShop", (url) => visitShop(url));

Cypress.Commands.add("goToCategory", (category, subcategory) => {
  goToLinkByText(category);
  if (subcategory) {
    goToLinkByText(subcategory);
  }
  cy.get(".breadcrumb").should("contain.text", subcategory || category);
});

/** Agrega el producto `index` de la lista actual al carrito. */
const PRODUCT_CARD = ".products .product, .product-miniature";

Cypress.Commands.add("addProductToCart", (index = 0) => {
  // El "quick add" del listado envía action=add y conserva los productos
  // anteriores. El formulario de la ficha de producto envía action=update y,
  // en el demo, reemplaza el carrito (el segundo producto borra el primero).
  // Por eso se agrega desde el listado sin entrar a la ficha del producto.

  // Asegurar que no haya un modal/backdrop previo tapando los botones.
  cy.document().then((doc) => {
    doc.querySelectorAll(".modal-backdrop, .blockcart-modal.show, .modal.show").forEach((el) => {
      if (el.classList.contains("modal-backdrop")) {
        el.remove();
      } else {
        el.classList.remove("show");
        el.style.display = "none";
      }
    });
    doc.body.classList.remove("modal-open");
    doc.body.style.removeProperty("overflow");
    doc.body.style.removeProperty("padding-right");
  });

  cy.url().then((listingUrl) => {
    cy.get(PRODUCT_CARD)
      .should("have.length.greaterThan", index)
      .eq(index)
      .find(
        'button[data-button-action="add-to-cart"], button.product-miniature__add',
      )
      .first()
      .should("be.visible")
      .click({ force: true });

    // Según configuración/JS del demo, agregar puede abrir modal o navegar al carrito.
    cy.get("body", { timeout: 20000 }).should(($body) => {
      const hasModal = $body.find("#blockcart-modal, .cart-preview-modal, .modal.show").length > 0;
      const onCartPage =
        $body.find(".cart-grid").length > 0 &&
        /shopping cart|carrito/i.test($body.text());
      expect(hasModal || onCartPage, "modal de carrito o página de carrito").to.eq(true);
    });

    cy.get("body").then(($body) => {
      const hasModal = $body.find("#blockcart-modal, .cart-preview-modal, .modal.show").length > 0;

      if (hasModal) {
        // Cerrar el modal para poder agregar el siguiente producto desde el listado.
        cy.contains(
          "#blockcart-modal button, #blockcart-modal a, .modal.show button, .modal.show a",
          /continue shopping/i,
        ).click({ force: true });
        cy.get("#blockcart-modal.show, .modal.show").should("not.exist");
        // Limpieza defensiva: a veces el backdrop queda huérfano tras la transición.
        cy.document().then((doc) => {
          doc.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
          doc.body.classList.remove("modal-open");
          doc.body.style.removeProperty("overflow");
          doc.body.style.removeProperty("padding-right");
        });
        cy.get(".modal-backdrop").should("not.exist");
      } else {
        // El producto se agregó pero la tienda redirigió al carrito; volver al listado.
        visitShop(listingUrl);
        cy.get(PRODUCT_CARD).should("have.length.greaterThan", index);
      }
    });
  });
});

Cypress.Commands.add("openSignIn", () => {
  const SIGN_IN_CONTROL =
    '#_desktop_ps_customersignin a, #_desktop_user_info a, .user-info a, a[href*="login"], a[href*="my-account"], button[aria-label*="sign in"]';

  // Tras el logout el header se vuelve a renderizar: esperar al control.
  cy.get("body").should(($body) => {
    const hasControl = $body.find(SIGN_IN_CONTROL).length > 0;
    const hasText = /sign in|log in|my account/i.test($body.text());
    expect(hasControl || hasText, "control de sign in").to.eq(true);
  });

  cy.get("body").then(($body) => {
    const $link = $body.find(SIGN_IN_CONTROL).first();
    const href = $link.attr("href");
    if (href && href !== "#" && !href.startsWith("javascript")) {
      // Sigue la navegación del enlace en el navegador; cy.visit() hace la
      // petición desde Node y el demo temporal puede agotarla intermitentemente.
      cy.wrap($link).click({ force: true });
    } else if ($link.length) {
      cy.wrap($link).click({ force: true });
    } else {
      cy.contains("a, button", /sign in|log in|my account/i)
        .first()
        .click({ force: true });
    }
  });

  // Asegurar que realmente llegamos al formulario de login; si no, ir directo.
  cy.get("body").then(($body) => {
    if ($body.find(EMAIL).length === 0) {
      const base = Cypress.env("shopUrl") || Cypress.config("baseUrl");
      visitShop(new URL("/login", base).href);
    }
  });

  cy.get("body").should(($body) => {
    expect($body.find(EMAIL).length, "campo de email").to.be.greaterThan(0);
  });
});

Cypress.Commands.add("createAccount", (user) => {
  cy.openSignIn();
  cy.contains("a", /create an account|no account|register/i)
    .first()
    .click();

  cy.get("body").then(($body) => {
    const $form = formIn(
      $body,
      `form:has(${CREATE_BUTTON}), #account-creation_form, form:has(#submitAccount)`,
    );
    fill($form, FIRSTNAME, user.firstName);
    fill($form, LASTNAME, user.lastName);
    fill($form, EMAIL, user.email);
    fill($form, PASSWORD, user.password);
    // No hay campo "confirmation": después del password viene el birthdate.
    fill($form, BIRTHDAY, "01/01/1990");
    // psgdpr y customer_privacy vienen con `required`; optin y newsletter no.
    cy.wrap($form)
      .find('input[type="checkbox"][required]')
      .each(($checkbox) => {
        cy.wrap($checkbox).check({ force: true });
      });
    clickIn($form, CREATE_BUTTON);
  });

  cy.get("body").should(($body) => {
    const $menu = $body.find(
      "#userMenuButton, .ps-customersignin .dropdown-toggle",
    );
    const $form = $body.find(
      '#customer-form, form:has(button[data-link-action="save-customer"])',
    );
    expect($menu.length > 0 || $form.length === 0, "cuenta creada").to.eq(true);
  });
});

const submitLogin = (email, password) =>
  cy.get("body").then(($body) => {
    const $form = formIn(
      $body,
      `form:has(${SIGN_IN_BUTTON}), #login-form, #login_form, form:has(#SubmitLogin)`,
    );
    fill($form, EMAIL, email);
    fill($form, PASSWORD, password);
    clickIn($form, SIGN_IN_BUTTON);
  });

Cypress.Commands.add("login", (email, password) => {
  cy.openSignIn();
  submitLogin(email, password);
  cy.get("body").should(($body) => {
    const $menu = $body.find("#userMenuButton");
    const loggedIn =
      $menu.length && /view my account/i.test($menu.attr("aria-label") || "");
    const $legacy = $body.find("#_desktop_user_info a, .user-info a, .account a");
    const legacyLoggedIn =
      $legacy.length && /sign out|logout|my account|hi,/i.test($legacy.text());
    expect(loggedIn || legacyLoggedIn, "usuario autenticado en el header").to.eq(
      true,
    );
  });
});

Cypress.Commands.add("loginWithInvalidPassword", (email, password) => {
  cy.openSignIn();
  submitLogin(email, password);
});

Cypress.Commands.add("logout", () => {
  const openSignOut = () =>
    cy.get("body").then(($body) => {
      const $signOut = $body
        .find('a[href*="mylogout"], a[data-link-action="sign-out"], a[href*="logout"]')
        .first();

      // En PrestaShop 8 el enlace vive dentro de un dropdown Bootstrap.
      if (!$signOut.length || !$signOut.is(":visible")) {
        const $menu = $body
          .find(
            '#userMenuButton, button[data-bs-toggle="dropdown"][aria-label*="account"]',
          )
          .first();
        if ($menu.length) {
          cy.wrap($menu).click();
        }
      }
    });

  const recoverIfUnavailable = () =>
    cy.get("body").then(($body) => {
      if (isShopUnavailable($body)) {
        visitShop(Cypress.env("shopUrl"));
      }
    });

  recoverIfUnavailable();
  openSignOut();
  recoverIfUnavailable();
  openSignOut();

  cy.contains("a", /sign out|logout/i)
    .first()
    .should("be.visible")
    .click();

  // El redirect del logout a veces cae en un 502 de Cloudflare; volvemos a
  // entrar a la misma tienda para seguir con la sesión ya cerrada.
  recoverIfUnavailable();

  // Tras el logout el dropdown del usuario debe desaparecer.
  cy.get("body").should(($body) => {
    const $menu = $body.find(
      "#userMenuButton, .ps-customersignin .dropdown-toggle",
    );
    expect($menu.length, "menú de usuario tras logout").to.eq(0);
  });
});

/** Abre la página del carrito leyendo su href real desde el header. */
Cypress.Commands.add("openCart", () => {
  cy.get("body").then(($body) => {
    const $link = $body
      .find('#_desktop_cart a, .blockcart a, a[href*="/cart"]')
      .first();
    expect($link.length, "cart link").to.be.greaterThan(0);
    const href = $link.attr("href");
    const base = Cypress.env("shopUrl") || Cypress.config("baseUrl");
    visitShop(new URL(href, base).href);
  });
});

Cypress.Commands.add("goToCheckout", () => {
  // Se navega al carrito por su href real en vez de usar el link del modal:
  // el modal ya se cerró después de agregar los productos.
  cy.openCart();
  cy.get(".cart-grid").should("be.visible");

  // Si el carrito quedó vacío el resumen muestra un botón "Checkout"
  // deshabilitado en lugar del link "Proceed to checkout".
  cy.get(".cart-grid").should(($grid) => {
    expect($grid.find(".cart__empty").length, "carrito con productos").to.eq(0);
  });
  cy.contains(
    ".cart-grid a, .cart-grid button",
    /proceed to checkout|^checkout$/i,
  )
    .should("not.be.disabled")
    .click();

  cy.get(".js-current-step, .step--current, .checkout-step.-current").should("be.visible");

  // Si el usuario ya está autenticado, el paso de información personal puede
  // mostrar solo un botón "Continue"; hay que avanzarlo para llegar a direcciones.
  cy.get("body").then(($body) => {
    const $personal = $body.find("#checkout-personal-information-step");
    if (!$personal.length) return;

    const $address = $body.find("#checkout-addresses-step, #checkout-address-step");
    const addressReady =
      $address.length &&
      ($address.is(":visible") || $address.hasClass("step--current") || $address.hasClass("js-current-step"));
    if (addressReady) return;

    const loggedIn =
      $personal.find('a[href*="logout"], a[data-link-action="sign-out"]').length > 0 ||
      (/continue/i.test($personal.text()) && $personal.find("form #login-form, form input[name=password]").length === 0);

    if (loggedIn) {
      const $continue = $personal
        .find(
          'button[data-link-action="sign-in"], button.continue, .continue.btn, button[type="submit"]',
        )
        .filter((_, el) => /continue/i.test(el.textContent || ""))
        .first();

      if ($continue.length) {
        cy.wrap($continue).click({ force: true });
      }
    }
  });
});

Cypress.Commands.add("fillCheckoutAddress", (address) => {
  const ADDRESS_STEP = "#checkout-addresses-step, #checkout-address-step";
  const DELIVERY_STEP = "#checkout-delivery-step, #checkout-shipping-step";

  // Si el paso está colapsado pero es alcanzable, abrirlo.
  cy.get("body").then(($body) => {
    const $step = $body.find(ADDRESS_STEP).first();
    if ($step.length && !$step.is(":visible")) {
      cy.wrap($step).find(".step-title, .js-edit-addresses").first().click({ force: true });
    }
  });

  cy.get(ADDRESS_STEP).should("be.visible");
  cy.get(ADDRESS_STEP).find(ADDRESS).first().clear().type(address.address1);
  cy.get(ADDRESS_STEP).find(CITY).first().clear().type(address.city);
  cy.get(ADDRESS_STEP).find(POSTCODE).first().clear().type(address.postcode);
  cy.get(ADDRESS_STEP).find(PHONE).first().clear().type(address.phone);

  cy.get(ADDRESS_STEP).then(($step) => {
    const $button = $step
      .find(
        'button[data-link-action="confirm-address"], #confirm-addresses, button[name="confirm-addresses"], button.form-control-submit, button[type="submit"]',
      )
      .filter(":visible")
      .first();
    const $fallback = $step.find('button[type="submit"], button.form-control-submit').first();
    const $target = $button.length ? $button : $fallback;
    expect($target.length, "botón continuar de dirección").to.be.greaterThan(0);
    cy.wrap($target).click({ force: true });
  });

  cy.get(DELIVERY_STEP, { timeout: 20000 }).should("be.visible");
});

Cypress.Commands.add("selectShipping", () => {
  const DELIVERY_STEP = "#checkout-delivery-step, #checkout-shipping-step";
  cy.get(DELIVERY_STEP).should("be.visible");
  cy.get(DELIVERY_STEP)
    .find('input[type="radio"]')
    .first()
    .check({ force: true });

  cy.get(DELIVERY_STEP).then(($step) => {
    const $button = $step
      .find(
        'button[name="confirmDeliveryOption"], button[data-link-action="confirm-delivery"], #confirmDeliveryOption, button.form-control-submit, button[type="submit"]',
      )
      .filter(":visible")
      .first();
    const $fallback = $step.find('button[type="submit"], button.form-control-submit').first();
    const $target = $button.length ? $button : $fallback;
    expect($target.length, "botón continuar de envío").to.be.greaterThan(0);
    cy.wrap($target).click({ force: true });
  });
  cy.get("#checkout-payment-step", { timeout: 20000 }).should("be.visible");
});

/** Selecciona el primer método de pago disponible y confirma el pedido. */
Cypress.Commands.add("payWithCard", () => {
  cy.get("#checkout-payment-step").should("be.visible");
  cy.get('#checkout-payment-step input[type="radio"]')
    .first()
    .check({ force: true });

  cy.get("body").then(($body) => {
    const $conditions = $body.find(
      '#conditions-to-approve input[type="checkbox"], input[name="conditions-to-approve"]',
    );
    if ($conditions.length) {
      cy.wrap($conditions.first()).check({ force: true });
    }
  });

  cy.get(
    'button[data-link-action="pay"], #payment-confirmation button[type="submit"], button.form-control-submit',
  )
    .last()
    .click();
});

Cypress.Commands.add("verifyOrderConfirmation", () => {
  cy.get(
    "#checkout-confirmation-step, .order-confirmation, #order-confirmation",
  ).should("exist");
});
