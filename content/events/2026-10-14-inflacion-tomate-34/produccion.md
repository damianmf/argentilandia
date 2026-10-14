# Producción — 2026-10-14-inflacion-tomate-34

- **Modo:** headless **local sin key** (Etapa 2, transporte degradado): `npm run
  jornada` falló en el draft por falta de `LLM_API_KEY` (FALLO_DRAFT, 1s) y la
  sesión ZCode ejecutó los pasos LLM con los mismos contratos JSON que la API de
  GLM, según la sección "Modo sin key" de `docs/runbook-diario.md`.
- **Nota:** el 13/10 no hubo jornada (ni radar ni evento); el último juego seguía
  siendo el del 12/10 (politics + dodge). Hoy: economy (variedad de categoría) y
  whack (dodge prohibido por variedad).
- **Pitch elegido (automático, scoreChiste 9):** whack — APLASTÁ LOS PRECIOS.
  Los targets son los datos exactos del IPC de septiembre (tomate +34,1%,
  cebolla +24,6%, batata +12,5%, tarifas +2,3%) y el contrapunto es la frase del
  Gobierno ("Es el camino", La Nación). Primera aplicación de la calibración de
  picantez máxima del 12/10 en un juego de producción.
- **Candidatos:** 3 variantes whack, las 3 pasaron el checklist (umbral: ningún
  criterio < 6, promedio >= 7). Ganó la variante 1 con promedio 9. Veredictos
  en `scores.json`.
- **Duración:** 20 s (nuevo contrato del 12/10 para motores de reflejos).
- **noTouch:** "La oferta real" (−2000): el único descuento honesto no se toca;
  es un invento declarado en `outro.fiction`, sin datos sin fuente.
- **Frase del día:** "Es el camino" (el Gobierno, tras el IPC de septiembre,
  titular textual de La Nación). Trazable a `outro.sources` (barrera Zod).
- **Avatar:** paramétrico (`scripts/generar-avatar.mjs`): consumidor con gorra,
  camiseta y martillo, emoción enojado. Sin SVG a mano.
- **Selección editorial del día:** `content/radar/2026-10-14/seleccion.json`
  (3 preseleccionados con 6 criterios, 12 descartes con razón, acidez).
