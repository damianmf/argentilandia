# Producción — 2026-10-12-billetera-corrida-125

- **Modo:** headless **local sin key** (Etapa 2, transporte degradado): `npm run
  jornada` falló en el draft por falta de `LLM_API_KEY` (FALLO_DRAFT, 5s) y la
  sesión ZCode ejecutó los pasos LLM con los mismos contratos JSON que la API de
  GLM, según la sección "Modo sin key" de `docs/runbook-diario.md`.
- **Pitch elegido (automático, scoreChiste 9 + regla de catálogo):** dodge —
  LA BILLETERA vs LA CORRIDA. Dodge es el motor que hace más tiempo no sale
  (26/09); search quedó prohibida por variedad (juego de ayer) y la categoría
  economía también (politics hoy).
- **Candidatos:** 3 variantes dodge generadas, 3 pasaron el checklist (umbral:
  ningún criterio < 6, promedio >= 7). Ganó la variante 1 con promedio 8.75;
  la variante 2 ("¿DÓNDE ESTÁN LOS BILLETES?", el dato incómodo de que los
  125.000 no son reservas netas) quedó segunda con 8.5. Veredictos en
  `scores.json`.
- **Acidez declarada:** 🟡 amarillo — muñeco de cargo público (presidente en
  ejercicio) por atributos (banda + patillas, regla del 09/10), sátira a la
  situación (billetera vs corrida) con dato verificable, nunca a la persona.
- **Frase del día:** "Tengo USD 125.000 millones para enfrentar una corrida el
  año que viene" (Milei, Radio Mitre con Eduardo Feinmann), textual en el cuerpo
  de la nota. Trazable a `outro.sources` (barrera Zod).
- **Avatar:** paramétrico (`scripts/generar-avatar.mjs`): muñeco de cargo con
  patillas, traje, banda presidencial y emoción pánico. Sin SVG a mano.
- **Selección editorial del día:** `content/radar/2026-10-12/seleccion.json`
  (3 preseleccionados con 6 criterios, 12 descartes con razón, acidez).
