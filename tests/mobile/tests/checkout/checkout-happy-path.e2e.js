/**
 * Etapa 2 — Happy path de checkout sobre la tienda en Chrome para Android.
 *
 * Reproduce en el dispositivo móvil la secuencia exigida en la Etapa 1:
 *   1. Crear una cuenta de usuario
 *   2. Login con usuario y contraseña correctos
 *   3. Agregar un producto al carrito
 *   4. Agregar otro producto diferente al carrito
 *   5. Checkout (dirección, método de envío y método de pago)
 *
 * Las verificaciones se hacen sobre la página del carrito y no sobre el contador de
 * la cabecera: en el viewport móvil ese contador está oculto y se actualiza por AJAX.
 */
import { expect } from '@wdio/globals';
import {
  AuthPage,
  CartPage,
  CatalogPage,
  CheckoutPage,
  HeaderPage,
} from '../../page-objects/index.js';

const PASSWORD = 'Reto2026!qa';
const uniqueEmail = () => `qa.mobile.${Date.now()}@example.com`;

describe('Etapa 2 — Checkout happy path en móvil (PrestaShop PWA)', () => {
  const customer = {
    firstName: 'Ana',
    lastName: 'Torres',
    email: uniqueEmail(),
    password: PASSWORD,
  };
  const header = new HeaderPage();
  const auth = new AuthPage();
  const catalog = new CatalogPage();
  const cart = new CartPage();
  const checkout = new CheckoutPage();
  const added = [];

  it('1. crea una cuenta de usuario nueva', async () => {
    await auth.register(customer);
    await auth.waitLoggedIn();
    expect(await header.isLoggedIn()).toBe(true);
  });

  it('2. inicia sesión con las credenciales correctas', async () => {
    // Tras registrarse la sesión ya está abierta; se cierra para probar el login.
    await header.logout();
    await auth.login({ email: customer.email, password: customer.password });
    await auth.waitLoggedIn();
    expect(await header.isLoggedIn()).toBe(true);
  });

  it('3. agrega el primer producto al carrito', async () => {
    added.push(await catalog.addNthProductToCart(0));

    await cart.open();
    await cart.waitLines(1);
    expect(added[0].length).toBeGreaterThan(0);
  });

  it('4. agrega un segundo producto diferente al carrito', async () => {
    added.push(await catalog.addNthProductToCart(1));

    await cart.open();
    await cart.waitLines(2);

    const names = await cart.productNames();
    expect(names.length).toBeGreaterThanOrEqual(2);
  });

  it('5. completa el checkout con envío y pago', async () => {
    await cart.proceedToCheckout();
    await checkout.confirmAddress();
    await checkout.confirmShipping();
    await checkout.payWithFirstOption();

    const reference = await checkout.waitForConfirmation();
    expect(reference.length).toBeGreaterThan(0);
  });
});
