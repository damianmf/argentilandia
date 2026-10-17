# Producción — 2026-10-16-veron-tres-meses-afa

- **Modo:** headless **local sin key** (Etapa 2, transporte degradado): el
  `LLM_API_KEY` cargado en GitHub aún no tiene saldo (corrida hospedada del
  16/10 falló en el draft con `LLM HTTP 429` code 1113 "Insufficient balance"),
  así que la sesión ZCode ejecutó los pasos LLM con los mismos contratos JSON
  que la API de GLM, según la sección "Modo sin key" de `docs/runbook-diario.md`.
- **Variedad:** ayer fue politics + catcher (quórum 121 de 129); hoy sports +
  decide, ambos permitidos. Último sports: 08/10 (Talleres–Tucumán).
- **Pitch elegido (scoreChiste 9):** decide — TRIBUNAL EXPRÉS. Sos el Tribunal
  de Disciplina de la AFA: el expediente de la Supercopa maduró en el cajón y
  lo resolvés entre la ida y el Maracaná. Cuatro decisiones (el cuándo, el
  descargo y su franqueza, la moneda de la multa, el alcance del castigo);
  la multa cotizada en 500 entradas y el "van a la cancha de hinchas" son los
  datos reales convertidos en opciones.
- **Debut en producción del motor `decide`** (estrenado en la iteración del
  15/10 para la segunda jornada candidateada del 21/10): primer juego real con
  `encuentros`/`veredictos`. El 21/10, si la historia del DNU sigue, tendría
  su segundo uso con giro ("EL TOMA Y DACA").
- **Candidatos:** 3 variantes (decide 9, dodge 7.25, whack 7), las 3 pasaron el
  checklist (umbral: ningún criterio < 6, promedio >= 7). Ganó la variante 1
  con promedio 9. Veredictos en `scores.json`.
- **Duración:** 60 s nominal (contrato del decide: no corre contra reloj, lo
  marca la cantidad de decisiones). Dificultad 5.
- **Frase del día:** "Toda tuya, ladrón" — Juan Sebastián Verón, en su descargo
  ante el Tribunal, admitiendo lo que le dijo al árbitro Darío Herrera
  (Ámbito, textual, trazable a `outro.sources` por la barrera Zod).
- **Fuentes:** la nota del fallo se bajó completa de Ámbito (informe arbitral,
  descargo, antecedente del "pasillo de espaldas", alcance de la sanción) más
  la nota de la semifinal (ida empatada, revancha en el Maracaná). Nada
  inferido fuera de las notas.
- **Línea editorial:** el blanco es la justicia deportiva de dos velocidades y
  el timing institucional — la silla y el expediente, no las personas. El
  "Tribunal" es un muñeco genérico de institución (traje + silbato), no
  retrata a sus miembros; la frase del descargo es cita textual con dueño
  real, presentada como la admitió él. Los incidentes y el árbitro apuntado
  solo como "autoridad arbitral", sin ensañamiento. Declarado en
  `outro.fiction`.
- **Avatar:** paramétrico (`scripts/generar-avatar.mjs`): tribunal de traje,
  canoso con barba, cara concentrada y silbato de autoridad. Sin SVG a mano.
- **Selección editorial del día:** `content/radar/2026-10-16/seleccion.json`
  (4 preseleccionados con 6 criterios, 27 descartes con razón, acidez 🟡 alta).
- **Señal de los jugadores:** el backend respondió con 0 partidas en el juego
  de ayer (recién publicado): el draft corrió con la señal vacía, como
  contempla el contrato.
