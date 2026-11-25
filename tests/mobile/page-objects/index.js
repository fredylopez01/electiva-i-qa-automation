/**
 * Localizadores y acciones de la tienda PrestaShop en Chrome para Android.
 *
 * La Etapa 2 reproduce sobre el navegador móvil el mismo happy path de la etapa 1
 * (crear cuenta, login, agregar 2 productos, checkout). Los selectores se tomaron
 * del HTML real del tema Classic de PrestaShop 8.2 servido por el entorno local
 * (ver ADR-005); las URLs usan el controlador, no la ruta traducida, para no
 * depender del idioma de la tienda.
 */
import { $, $$, browser } from '@wdio/globals';

/** Rutas por controlador: funcionan con cualquier idioma instalado. */
export const ROUTES = {
  login: 'index.php?controller=authentication',
  register: 'index.php?controller=authentication&create_account=1',
  cart: 'index.php?controller=cart&action=show',
};

const SELECTORS = {
  // Cabecera
  userMenu: '#_desktop_user_info .user-info',
  signInLink: '#_desktop_user_info a[href*="controller=authentication"], #_desktop_user_info a[title*="sesión"], .user-info a',
  logoutLink: 'a[href*="mylogout"], .user-info a.logout',
  cartCount: '#_desktop_cart .cart-products-count',
  cartLink: '#_desktop_cart a',

  // Registro
  createAccountLink: '.no-account a, a[data-link-action="display-register-form"]',
  genderRadio: 'input[name="id_gender"][value="1"]',
  firstName: '#field-firstname',
  lastName: '#field-lastname',
  email: '#field-email',
  password: '#field-password',
  birthday: '#field-birthday',
  privacyCheckbox: 'input[name="customer_privacy"]',
  gdprCheckbox: 'input[name="psgdpr"]',
  registerSubmit: 'button[data-link-action="save-customer"], #submitCreate',
  registerForm: '#customer-form',

  // Login
  loginEmail: '#field-email',
  loginPassword: '#field-password',
  loginSubmit: '#submit-login',
  loginForm: '#login-form',

  // Catálogo
  productThumb: '.product-miniature a.product-thumbnail',
  productTitle: 'h1.h1, h1[itemprop="name"]',
  addToCartButton: 'button[data-button-action="add-to-cart"]',
  continueShopping: '.modal.show button.btn-secondary, button[data-dismiss="modal"]',

  // Carrito: cada línea es <li class="cart-item"> y el nombre está en <a class="label">.
  cartLines: '.cart-overview .cart-item',
  cartLineName: '.cart-overview .cart-item a.label',
  checkoutButton: '.cart-detailed-actions a.btn-primary, a[href*="controller=order"]',

  // Checkout
  addressContinue: 'button[name="confirm-addresses"]',
  deliveryOption: 'input[name="delivery_option"]',
  shippingContinue: 'button[name="confirmDeliveryOption"]',
  paymentOption: 'input[name="payment-option"]',
  termsCheckbox: '#conditions_to_approve\\[terms-and-conditions\\]',
  placeOrder: '#payment-confirmation button, button.ps-shown-by-js',
  orderConfirmation: '#content-hook_order_confirmation, .order-confirmation',
  orderReference: '#order-reference-value',
};

class BasePage {
  get baseUrl() {
    return (process.env.BASE_URL || 'https://demo.prestashop.com/').replace(/\/+$/, '');
  }

  async open(path = '') {
    await browser.url(`${this.baseUrl}/${path}`);
    await this.dismissOverlays();
  }

  /** En móvil PrestaShop muestra avisos y modales que tapan los botones. */
  async dismissOverlays() {
    for (const selector of ['#accept-cookie', 'button.gdpr-consent-accept', '.modal.show .btn-secondary']) {
      const el = await $(selector);
      if (await el.isExisting().catch(() => false)) {
        await el.click().catch(() => {});
      }
    }
  }

  async tap(target) {
    const el = typeof target === 'string' ? await $(target) : target;
    await el.waitForDisplayed({ timeout: 20000 });
    // En un viewport móvil los botones pueden quedar bajo el pliegue.
    await el.scrollIntoView({ block: 'center' }).catch(() => {});
    await el.click();
    return el;
  }

  async exists(selector) {
    const el = await $(selector);
    return el.isExisting().catch(() => false);
  }

  /**
   * Marca un checkbox del tema Classic.
   *
   * En este tema los checkboxes no siempre tienen `id` y el `<label>` que los activa es
   * su ANCESTRO (`.custom-checkbox > label > input`), no un `label[for=...]`. Un click
   * directo sobre el input falla porque está oculto, así que se prueban en orden:
   * etiqueta asociada, etiqueta ancestro y, por último, toggle por DOM.
   */
  async check(inputSelector) {
    const input = await $(inputSelector);
    if (!(await input.isExisting().catch(() => false))) return false;
    if (await input.isSelected()) return true;

    const id = await input.getAttribute('id');
    if (id) {
      const label = await $(`label[for="${id}"]`);
      if (await label.isExisting().catch(() => false)) {
        await label.scrollIntoView({ block: 'center' }).catch(() => {});
        await label.click().catch(() => {});
        if (await input.isSelected()) return true;
      }
    }

    // Toggle por DOM: en este tema el input está oculto a propósito y su etiqueta
    // es un ancestro, así que ni el click nativo ni label[for] lo activan.
    await browser.execute((sel) => {
      const el = document.querySelector(sel);
      if (el && !el.checked) {
        el.click();
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, inputSelector);

    return input.isSelected();
  }

  /**
   * Envía un formulario por su API nativa.
   *
   * En el viewport móvil el click sobre el botón de envío no siempre dispara el
   * submit (el botón queda bajo el pliegue y el evento se pierde). `form.submit()`
   * envía los mismos campos y evita ese fallo intermitente.
   */
  async submitForm(formSelector) {
    const form = await $(formSelector);
    if (!(await form.isExisting().catch(() => false))) {
      throw new Error(`No existe el formulario ${formSelector}`);
    }
    await browser.execute((sel) => document.querySelector(sel).submit(), formSelector);
  }
}

export class HeaderPage extends BasePage {
  async isLoggedIn() {
    // En móvil PrestaShop oculta el bloque de cuenta de escritorio; el enlace de
    // cerrar sesión (index.php?...&mylogout) es la señal fiable de sesión activa.
    return (await this.exists(SELECTORS.logoutLink))
      || (await this.exists('.user-info a[title*="cuenta"], .user-info a[title*="account"]'));
  }

  async logout() {
    if (await this.exists(SELECTORS.logoutLink)) {
      await this.open('index.php?mylogout=1');
    }
  }

  async goToSignIn() {
    await this.open(ROUTES.login);
  }

  async cartCount() {
    const el = await $(SELECTORS.cartCount);
    if (!(await el.isExisting().catch(() => false))) return 0;
    const match = (await el.getText()).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  /**
   * Cantidad de productos del carrito leída de la página del carrito.
   *
   * El contador de la cabecera se actualiza por AJAX y en el viewport móvil queda
   * oculto, así que se usa el total de líneas del carrito como fuente de verdad.
   */
  async cartItemsOnCartPage() {
    const rows = await $$('.cart-overview .product-line-grid, .cart-overview .cart-item');
    return rows.length;
  }

  /** Número de artículos según el resumen del carrito ("2 artículos"). */
  async cartSummaryCount() {
    const el = await $('.cart-summary-line .js-subtotal, #cart-subtotal-products .label');
    if (!(await el.isExisting().catch(() => false))) return 0;
    const match = (await el.getText()).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }
}

export class AuthPage extends BasePage {
  async register({ firstName, lastName, email, password }) {
    await this.open(ROUTES.login);
    if (await this.exists(SELECTORS.createAccountLink)) {
      await this.tap(SELECTORS.createAccountLink);
    }
    await (await $(SELECTORS.firstName)).waitForDisplayed({ timeout: 20000 });

    if (await this.exists(SELECTORS.genderRadio)) {
      await this.tap(SELECTORS.genderRadio);
    }

    await (await $(SELECTORS.firstName)).setValue(firstName);
    await (await $(SELECTORS.lastName)).setValue(lastName);
    await (await $(SELECTORS.email)).setValue(email);
    await (await $(SELECTORS.password)).setValue(password);

    if (await this.exists(SELECTORS.birthday)) {
      await (await $(SELECTORS.birthday)).setValue('01/01/1990');
    }

    // PrestaShop 8 exige aceptar la política de privacidad para crear la cuenta.
    const privacyOk = await this.check(SELECTORS.privacyCheckbox);
    if (!privacyOk) throw new Error('No se pudo aceptar la política de privacidad');
    await this.check(SELECTORS.gdprCheckbox);

    await this.submitForm(SELECTORS.registerForm);
  }

  async login({ email, password }) {
    await this.open(ROUTES.login);
    await (await $(SELECTORS.loginEmail)).waitForDisplayed({ timeout: 20000 });
    await (await $(SELECTORS.loginEmail)).setValue(email);
    await (await $(SELECTORS.loginPassword)).setValue(password);
    await this.submitForm(SELECTORS.loginForm);
  }

  async waitLoggedIn(timeout = 30000) {
    await browser.waitUntil(async () => new HeaderPage().isLoggedIn(), {
      timeout,
      timeoutMsg: 'La sesión no quedó iniciada (no aparece "Cerrar sesión")',
    });
  }
}

export class CatalogPage extends BasePage {
  /** Agrega el producto n-ésimo del listado y devuelve su nombre. */
  async addNthProductToCart(index = 0) {
    await this.open('');
    // Con carga concurrente en el servidor, el listado puede tardar en pintarse.
    let thumbs = await $$(SELECTORS.productThumb);
    if (thumbs.length === 0) {
      await browser.waitUntil(
        async () => (await $$(SELECTORS.productThumb)).length > 0,
        { timeout: 40000, timeoutMsg: 'El catálogo no devolvió productos' },
      );
      thumbs = await $$(SELECTORS.productThumb);
    }

    await this.tap(thumbs[Math.min(index, thumbs.length - 1)]);
    const title = await $(SELECTORS.productTitle);
    await title.waitForDisplayed({ timeout: 40000 });
    const name = (await title.getText()).trim();

    // PrestaShop intercepta el submit del botón con su propio JS (AJAX + `add=1`),
    // así que un form.submit() nativo no agrega nada. Un click por JS sí dispara
    // ese handler, y evita el problema del click por coordenadas en viewport móvil.
    const clicked = await browser.execute(() => {
      const btn = document.querySelector('button[data-button-action="add-to-cart"]');
      if (!btn) return false;
      btn.click();
      return true;
    });

    if (!clicked) throw new Error('No se encontró el botón de agregar al carrito');

    // El carrito se actualiza por AJAX: se espera a que el contador cambie.
    await browser.waitUntil(
      async () => browser.execute(() => {
        const counter = document.querySelector('.cart-products-count');
        const n = counter ? Number((counter.textContent.match(/\d+/) || [0])[0]) : 0;
        return n > 0;
      }),
      { timeout: 40000, timeoutMsg: 'El carrito no registró el producto agregado' },
    ).catch(() => {});
    return name;
  }
}

export class CartPage extends BasePage {
  async open() {
    await super.open(ROUTES.cart);
  }

  async productNames() {
    const lines = await $$(SELECTORS.cartLineName);
    const names = [];
    for (const line of lines) names.push((await line.getText()).trim());
    return names;
  }

  async lineCount() {
    // Hay dos maquetaciones del carrito (escritorio y móvil); se cuentan los nombres
    // de producto, que aparecen una vez por línea en ambas.
    return (await $$(SELECTORS.cartLineName)).length;
  }

  /** Espera a que el carrito muestre al menos `expected` líneas. */
  async waitLines(expected, timeout = 40000) {
    await browser.waitUntil(
      async () => (await this.lineCount()) >= expected,
      { timeout, timeoutMsg: `El carrito no llegó a ${expected} producto(s)` },
    );
  }

  async proceedToCheckout() {
    await this.tap(SELECTORS.checkoutButton);
  }
}

export class CheckoutPage extends BasePage {
  /**
   * Pulsa un elemento por JS dentro de la página del checkout.
   *
   * En el viewport móvil los botones del checkout quedan fuera de pantalla o tapados
   * por el resumen de la orden, y el click por coordenadas falla de forma intermitente.
   * El click nativo del navegador dispara los mismos handlers de PrestaShop.
   */
  async clickInPage(selector, timeout = 30000) {
    // Los pasos del checkout se cargan por AJAX, así que el botón puede no existir
    // todavía al entrar al paso. Se espera a que aparezca antes de pulsarlo.
    await browser.waitUntil(
      async () => browser.execute((sel) => !!document.querySelector(sel), selector),
      { timeout, timeoutMsg: `No apareció ${selector} en el checkout` },
    );
    const ok = await browser.execute((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      el.click();
      return true;
    }, selector);
    if (!ok) throw new Error(`No se pudo pulsar ${selector}`);
    await browser.pause(1500);
  }

  async confirmAddress() {
    // Si la cuenta aún no tiene dirección, el checkout la pide en este paso.
    if (await browser.execute(() => !!document.querySelector('#field-address1'))) {
      await this.fillAddress();
      // El guardado y el avance son dos acciones distintas: primero se envía el
      // formulario (crea la dirección) y solo después aparece "Continuar".
      await this.submitForm('#checkout-addresses-step form');
      await browser.waitUntil(
        async () => browser.execute(() => !document.querySelector('#field-address1')),
        { timeout: 30000, timeoutMsg: 'La dirección no se guardó en el checkout' },
      );
      await browser.pause(1500);
    }

    // Con la dirección ya creada, PrestaShop muestra un selector de direcciones:
    // si no hay ningún radio marcado, el POST sale con id_address=0 y el carrito
    // queda sin dirección de entrega (y por eso el paso de pago no ofrece métodos).
    await browser.execute(() => {
      const radio = document.querySelector('input[name="id_address_delivery"]');
      if (radio && !radio.checked) {
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await browser.pause(600);

    await this.clickInPage(SELECTORS.addressContinue);
    await browser.waitUntil(
      async () => browser.execute(() => !!document.querySelector('input[name^="delivery_option"]')),
      { timeout: 40000, timeoutMsg: 'El checkout no avanzó al paso de envío' },
    );
  }

  /**
   * Completa el formulario de dirección del checkout.
   *
   * Se asignan los valores y se disparan `input`/`change` para que la validación de
   * PrestaShop los registre; sin eventos, el formulario los considera vacíos.
   */
  async fillAddress() {
    // La tienda de prueba usa Estados Unidos: el código postal exige 5 dígitos
    // ("NNNNN") y el departamento es obligatorio. Si falta algo, el checkout
    // responde "Your address is incomplete".
    //
    // Se usan las acciones de WebDriver (no asignación por JS) porque PrestaShop
    // valida con los eventos reales del navegador: un value puesto por JS deja el
    // formulario "vacío" para el servidor.
    const textFields = {
      '#field-alias': 'Casa',
      '#field-address1': '1600 Amphitheatre Parkway',
      '#field-postcode': '94043',
      '#field-city': 'Mountain View',
      '#field-phone': '6501234567',
    };

    for (const [selector, value] of Object.entries(textFields)) {
      const el = await $(selector);
      if (!(await el.isExisting().catch(() => false))) continue;
      await el.setValue(value);
    }

    // El departamento depende del país; se elige la primera opción con id válido.
    const state = await $('#field-id_state');
    if (await state.isExisting().catch(() => false)) {
      const options = await state.$$('option');
      for (const option of options) {
        const value = await option.getAttribute('value');
        if (value && value !== '0') {
          await state.selectByAttribute('value', value);
          break;
        }
      }
    }
  }

  /** Selecciona el primer transportista y confirma el paso de envío. */
  async confirmShipping() {
    // El radio se llama `delivery_option[<id_address>]`, así que el selector debe
    // usar el prefijo, no el nombre exacto.
    await browser.execute(() => {
      const carrier = document.querySelector('input[name^="delivery_option"]');
      if (carrier && !carrier.checked) {
        carrier.click();
        carrier.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await browser.pause(800);
    await this.clickInPage(SELECTORS.shippingContinue);
  }

  async payWithFirstOption() {
    // El bloque de pago se carga por AJAX tras confirmar el envío.
    await browser.waitUntil(
      async () => browser.execute(() => !!document.querySelector('input[name="payment-option"]')),
      { timeout: 30000, timeoutMsg: 'No apareció el bloque de métodos de pago' },
    );

    const ok = await browser.execute(() => {
      const option = document.querySelector('input[name="payment-option"]');
      if (!option) return false;
      option.click();
      option.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    });
    if (!ok) throw new Error('El checkout no ofreció métodos de pago');

    // Al elegir el método aparece el botón de confirmar (y a veces las condiciones).
    await browser.waitUntil(
      async () => browser.execute(() => {
        const terms = document.querySelector('#conditions_to_approve\\[terms-and-conditions\\]');
        if (terms) {
          if (!terms.checked) {
            terms.click();
            terms.dispatchEvent(new Event('change', { bubbles: true }));
          }
          return true;
        }
        return !!document.querySelector('#payment-confirmation button');
      }),
      { timeout: 20000, timeoutMsg: 'No apareció la confirmación del pago' },
    );
    await browser.pause(800);
    await this.clickInPage(SELECTORS.placeOrder);
  }

  async waitForConfirmation(timeout = 60000) {
    await browser.waitUntil(async () => this.exists(SELECTORS.orderConfirmation), {
      timeout,
      timeoutMsg: 'No apareció la confirmación de la orden',
    });
    if (await this.exists(SELECTORS.orderReference)) {
      return (await (await $(SELECTORS.orderReference)).getText()).trim();
    }
    return 'confirmada';
  }
}

export { SELECTORS };
