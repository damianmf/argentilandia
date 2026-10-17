# Producción — 2026-10-17-andis-5-palos-arriba

- **Modo:** headless **local sin key** (Etapa 2, transporte degradado): `npm run
  jornada` falló en el draft por falta de `LLM_API_KEY` en el `.env` local
  (FALLO_DRAFT, 2s; la key del plan está en el deploy pero no acá) y la sesión
  ZCode ejecutó los pasos LLM con los mismos contratos JSON que la API, según la
  sección "Modo sin key" de `docs/runbook-diario.md`.
- **Variedad:** el 16/10 fue TRIBUNAL EXPRÉS (sports + decide) → hoy politics +
  search. search sin salir desde el 11/10; decide prohibido.
- **Pitch elegido (automático, scoreChiste 9):** search — ENCONTRÁ LOS CHATS.
  La causa ANDIS nació de chats encontrados en un celular: el jugador hace de
  perito informático buscando los chats de la causa ('5 palos arriba', 'Si o si')
  entre el ruido inocente del teléfono. Los montos del fallo (silla postural
  $18M vs $945.000; Artrobone +$512M de diferencia) quedan como trap de lujo en
  la variante 2 y como moments del outro.
- **Editorial (picantez máxima 12/10):** el blanco es la corruptela y su prueba,
  no las personas con discapacidad: la silla de ruedas nunca aparece como
  trap/target y el `outro.fiction` lo explicita, junto con la presunción de
  inocencia (procesados sin preventiva, causa en instrucción). Precedente:
  PÉGUELE, SEÑORES (silla como noTouch).
- **Candidatos:** 3 variantes search, las 3 pasaron el checklist (umbral:
  ningún criterio < 6, promedio >= 7). Ganó la variante 1 con promedio 9.
  Veredictos en `scores.json`.
- **Frase del día:** "En las amputaciones anda en todas 5 palos arriba" (chat
  atribuido a Calvete, citado en el procesamiento; versión textual del cuerpo de
  la nota de Ámbito). Trazable a `outro.sources` (barrera Zod).
- **Avatar:** paramétrico (`scripts/generar-avatar.mjs`): perito con gorra y
  traje, emoción concentrada. Sin SVG a mano.
- **Selección editorial del día:** `content/radar/2026-10-17/seleccion.json`
  (3 preseleccionados con 6 criterios, 12 descartes con razón, acidez).
