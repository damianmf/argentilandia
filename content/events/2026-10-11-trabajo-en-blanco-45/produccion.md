# Producción — 2026-10-11-trabajo-en-blanco-45

- **Modo:** headless **local sin key** (Etapa 2, transporte degradado): el radar,
  la validación, el índice y el commit son los scripts de siempre; los pasos LLM
  (draft y pasada 2) los ejecutó la sesión ZCode con los mismos contratos JSON
  que usará la API de GLM. Primera corrida real del pipeline nuevo.
- **Pitch elegido (automático, score 9):** search — ENCONTRÁ EL TRABAJO EN BLANCO
- **Candidatos:** 3 variantes generadas, 3 pasaron el checklist (umbral:
  ningún criterio < 6, promedio >= 7). Ganó la variante 1 con promedio 8.75.
  Veredictos en `scores.json`.
- **Nota editorial:** la mecánica de búsqueda es la literalización del dato
  (buscar lo casi inexistente). Acidez declarada: 🟡 amarillo suave. El chiste
  va contra la escasez de empleo registrado, nunca contra el trabajador
  informal; el `outro.fiction` lo explicita.
- **Frase del día:** "mejores 18 meses de la historia Argentina" (Caputo,
  abril 2026), citada textual por la nota de Perfil al contraponerla con el
  dato. Trazable a `outro.sources` (la barrera Zod la valida).
- **Avatar:** paramétrico por primera vez (`scripts/generar-avatar.mjs`):
  inspector con gorra, uniforme y silbato, emoción concentrada. Sin SVG a mano.
- **Selección editorial del día:** `content/radar/2026-10-11/seleccion.json`
  (preselección con 6 criterios, 9 descartes con razón, acidez).
