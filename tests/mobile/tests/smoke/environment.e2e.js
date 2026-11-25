/**
 * Verificación mínima del entorno: confirma que Appium controla el emulador y que
 * la tienda carga en el navegador móvil. Sirve para diagnosticar el entorno antes
 * de gastar una corrida completa del happy path.
 */
import { expect } from '@wdio/globals';

describe('Etapa 2 — Humo del entorno móvil', () => {
  it('abre la tienda en el navegador del emulador', async () => {
    const baseUrl = process.env.BASE_URL || 'https://demo.prestashop.com/';
    await browser.url(baseUrl);

    await browser.waitUntil(
      async () => (await browser.getTitle()).length > 0,
      { timeout: 60000, timeoutMsg: 'La tienda no cargó en el navegador móvil' },
    );

    const title = await browser.getTitle();
    expect(title.length).toBeGreaterThan(0);

    const context = await browser.getContext?.();
    if (context) {
      expect(context).toContain('CHROMIUM');
    }
  });
});
