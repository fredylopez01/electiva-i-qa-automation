# Informe final — Reto Final Electiva I

> Plantilla para consignar los resultados de las 4 etapas. Se entrega el día anterior a la sustentación final.

## Datos generales

- Equipo: ______________________
- Integrantes: ______________________
- Fecha de entrega: ______________________
- Sitio web evaluado: https://practicesoftwaretesting.com/ (Practice Software Testing / Toolshop). Alternativa usada por inestabilidad del demo de PrestaShop; la suite PrestaShop se conserva en el repositorio.
- API(s) evaluadas: ______________________

## 1. Etapa 1 — Pruebas E2E (Cypress)

- Herramienta y versión: Cypress 13.17.0 (Electron 118, Node.js 22.22.0).
- Sitio evaluado: <https://practicesoftwaretesting.com/> (Toolshop). La suite PrestaShop se conserva como alternativa en `tests/e2e-web/cypress/e2e/checkout/` y `tests/e2e-web/cypress/e2e/negative/`.
- Casos happy path ejecutados (crear cuenta, login, agregar 2 productos, checkout): 5 pasos en `tests/e2e-web/cypress/e2e/toolshop/checkout-happy-path.cy.js` — crear cuenta, iniciar sesión, agregar `Combination Pliers`, agregar `Pliers`, completar checkout con dirección y pago Cash on Delivery.
- Pruebas negativas ejecutadas (mínimo 3): 3 casos en `tests/e2e-web/cypress/e2e/toolshop/negative/negative-checkout.cy.js` — credenciales incorrectas, checkout con carrito vacío, tarjeta inválida.
- Resultados (ejecutadas / pasadas / fallidas): 8 ejecutadas / 8 pasadas / 0 fallidas.
- Reporte: `results/e2e-web/toolshop-e2e-report.md`
- Evidencias: `tests/e2e-web/cypress/videos/checkout-happy-path.cy.js.mp4`, `tests/e2e-web/cypress/videos/negative-checkout.cy.js.mp4`
- Hallazgos:
  - El demo renovó IDs de productos; se actualizaron a los IDs vigentes del catálogo.
  - La UI puede aparecer en español; las pruebas usan `data-test` y aceptan mensajes en ambos idiomas.
  - El checkout de Toolshop no expone un selector separado de método de envío; se documentó la adaptación en el reporte.

## 2. Etapa 2 — Pruebas móviles (Appium)

- Herramienta, emulador y versión:
- Happy path de checkout ejecutado:
- Resultados (ejecutadas / pasadas / fallidas):
- Reporte: `results/mobile/`
- Evidencias: `evidences/mobile/`
- Hallazgos:

## 3. Etapa 3 — API Testing (Postman/Newman)

- APIs evaluadas:
- Número de pruebas automatizadas (mínimo 20):
- Resultados (ejecutadas / pasadas / fallidas):
- Reporte: `results/api/`
- Evidencias: `evidences/api/`
- Hallazgos:

## 4. Etapa 4 — Pruebas de rendimiento

### 4.1 Pruebas de carga (10, 20 y 50 usuarios concurrentes)

- Herramienta y configuración: Apache JMeter 5.x. Planes en `tests/performance/load/plans/` contra `https://practicesoftwaretesting.com/` (GET `/`, 1 iteración por usuario, ramp-up igual al número de usuarios, Cookie/Header Manager, Summary Report).
- Ejecución:

  ```bash
  bash tests/performance/load/run-all.sh
  ```

- Resultados por nivel de concurrencia (tiempo de respuesta, throughput, errores):

  | Usuarios | Ramp-up | Promedio (ms) | P95 (ms) | Throughput | Error % | Estado |
  | ---: | ---: | ---: | ---: | ---: | ---: | --- |
  | 10 | 10 s | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ | Pendiente de ejecución |
  | 20 | 20 s | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ | Pendiente de ejecución |
  | 50 | 50 s | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ | Pendiente de ejecución |

- Reporte: `results/performance/load-10/`, `results/performance/load-20/`, `results/performance/load-50/`
- Informe de las 3 pruebas: consolidar los `Summary Report`/HTML de JMeter tras la ejecución y actualizar esta tabla. Las evidencias deben copiarse a `evidences/performance/`.

### 4.2 Pruebas de estrés (2 pruebas, recursos máximos)

- Configuración de la máquina de prueba:
- Comportamiento ante el agotamiento de recursos:
- Reporte: `results/performance/`

### 4.3 Prueba de desempeño (2 horas, 20–50 usuarios)

- Usuarios concurrentes seleccionados:
- Duración efectiva:
- Tendencias de tiempo de respuesta y consumo de recursos:
- Reporte: `results/performance/`

## 5. Conclusiones

- Estado general de la plataforma:
- Riesgos encontrados:
- Recomendaciones:

## 6. Anexos

- Demo o video breve de la ejecución: `evidences/`
- Capturas representativas: `evidences/<tipo-de-prueba>/`
- Logs de ejecución: `evidences/<tipo-de-prueba>/`

## Checklist de sustentación

- [ ] Suite de las 4 etapas ejecutada sin errores de configuración.
- [ ] Informe con resultados de las 4 etapas.
- [ ] Reportes en `results/`.
- [ ] Evidencias en `evidences/`.
- [ ] Demo o video breve listo para la sustentación.
