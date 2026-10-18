# Producción — 2026-10-18-remate-bienes-delito

- **Modo:** headless **local sin key** (Etapa 2, transporte degradado): sin
  `LLM_API_KEY` en el `.env` local, la sesión ZCode ejecutó los pasos LLM con
  los mismos contratos JSON que la API, según la sección "Modo sin key" de
  `docs/runbook-diario.md`. Corrida manual de domingo: el cron ZCode de 9:00
  ni disparó (máquina apagada) y la corrida hospedada de GHA falló (pendiente
  de diagnóstico con la key en el .env).
- **Variedad:** el 17/10 fue ENCONTRÁ LOS CHATS (politics + search) → hoy
  police (primera vez en el proyecto) + whack. search prohibida.
- **Pitch elegido (automático, scoreChiste 9):** whack — REMATA LO DEL CHORRO.
  La subasta es literalmente un whack con martillo de remate: los targets son
  los bienes reales del remate (arcades del narco, la casa de Rosario, la
  lancha Bermuda, motos) y el noTouch tiene base fáctica ("lo de las víctimas"
  — el dinero real del remate las indemniza).
- **Candidatos:** 3 variantes whack, las 3 pasaron el checklist (umbral:
  ningún criterio < 6, promedio >= 7). Ganó la variante 1 con promedio 8.75.
  Veredictos en `scores.json`.
- **Acidez declarada:** 🟢 verde — el blanco es el crimen y su botín; la frase
  del gobernador ("la impunidad se acabó") queda como veredicto compartible con
  dientes.
- **Frase del día:** "En la invencible provincia de Santa Fe, la impunidad se
  acabó" (Pullaro, en el remate), textual en la nota de Perfil. Trazable a
  `outro.sources` (barrera Zod).
- **Avatar:** paramétrico (`scripts/generar-avatar.mjs`): rematador de traje con
  martillo, emoción euforia. Sin SVG a mano.
- **Selección editorial del día:** `content/radar/2026-10-18/seleccion.json`
  (3 preseleccionados con 6 criterios, 12 descartes con razón, acidez).
