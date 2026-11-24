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

  | Usuarios | Ramp-up | Promedio (ms) | P95 (ms) | Mín (ms) | Máx (ms) | Throughput (req/s) | Error % | Duración (s) |
  | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
  | 10 | 10 s | 829.00 | 1141.75 | 679 | 1144 | 0.99 | 0.00% | 10.14 |
  | 20 | 20 s | 762.70 | 1131.25 | 680 | 1155 | 1.01 | 0.00% | 19.73 |
  | 50 | 50 s | 726.54 | 1124.10 | 671 | 1217 | 1.01 | 0.00% | 49.66 |

- Reporte: `results/performance/load-report.html` (resumen consolidado generado desde los JTL).
- Archivos JTL: `results/performance/load-10-users.jtl`, `results/performance/load-20-users.jtl`, `results/performance/load-50-users.jtl`.
- Informe de las 3 pruebas: las tres ejecuciones completaron sin errores. El throughput se mantuvo ~1 req/s, coherente con 1 iteración por usuario y ramp-up igual a la concurrencia. El P95 se mantuvo estable (~1124–1142 ms) al aumentar de 10 a 50 usuarios; no se observaron fallos HTTP en estas muestras. Nota: Toolshop es SPA, por lo que JMeter midió la respuesta HTTP inicial, no el render completo del navegador.

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
