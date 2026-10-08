# Runbook — jornada diaria (POC 2)

Pipeline: **radar → draft → aprobación → generación → validación → web**.

**Modo actual (desde el 08/10): FULL-AUTO.** Por decisión de iteración
(ver PROJECT.md), la automatización produce la jornada completa sin aprobación
humana. El humano itera sobre lo producido. La aprobación obligatoria se
reintroduce antes de cualquier deploy.

## Qué corre solo (9:00, todos los días)

La automatización **"Jornada automática — todos los días a las 9:00"** (cron del
entorno, ajustable desde la página Automations) hace, en orden y cortando ante
cualquier bloqueo:

1. **Chequeo**: si ya existe evento con la fecha de hoy en `content/events/`,
   la jornada se considera producida y termina.
2. **Radar**: `npm run radar` → `content/radar/<fecha>/candidatos.md` (5 feeds
   argentinos; si ninguno responde, termina sin escribir nada).
3. **Draft**: `content/prompts/radar-diario.md` →
   `content/radar/<fecha>/draft.md`. Si nada pasa el umbral, `ESTADO: SIN
   CANDIDATOS` y termina: día sin juego es un resultado válido.
4. **Auto-aprobación**: `ESTADO: APROBADO (AUTO)` y elige el mejor pitch.
5. **Generación**: pasada 2 de `game-generation.md` → `content/events/<id>/`
   (event.json, gamespec.json con `difficulty: 5`, avatar, produccion.md).
6. **Validación**: `npm run validate`; si no corrige el error, borra el evento
   del día (`ESTADO: RECHAZADO POR VALIDACIÓN`) y no toca la web.
7. **Web**: `npm run index` → card nueva en `web/index.html`.
8. **Commit**: `jornada-<fecha>` (nunca toca tags ni commits anteriores).
9. **Reporte** en la sesión: evento, por qué, descartes, fuente, validate/index.

## Qué hace el humano (iteración)

- Jugar la web del día (`npm run dev` → http://localhost:5173/web/index.html) y
  anotar qué falló: tono, fuentes, dificultad, el chiste.
- Leer los drafts (`content/radar/<fecha>/draft.md`) y los reportes de cada
  corrida; los ajustes se hacen en los **prompts** (`radar-diario.md`,
  `game-generation.md`, `linea-editorial.md`), no a mano en los JSON: lo que se
  arregla en el prompt se arregla para siempre.
- Para regenerar el radar a mano: `npm run radar [fecha]` y pedir el paso 3 del
  cron en una sesión.

## Antes del deploy: volver a modo con aprobación

Cuando se decida publicar (fase opcional), restaurar la barrera humana:

1. Editar el paso 4 del cron: `ESTADO: ESPERANDO APROBACIÓN`, presentar el draft
   y terminar (no generar).
2. La aprobación humana responde con **evento + pitch**; recién ahí se genera
   (pasos 5–9 idénticos).

## Reglas duras

- Regla de fuentes de PROJECT.md: todo fact/quote/momento trazable a una source
  del mismo JSON. Zod barra quote/moments huérfanos; los facts siguen siendo
  chequeo manual en la revisión de calidad.
- Nada se publica sin `npm run validate` en 0.
- Dificultad de arranque `5` para todo evento nuevo; se calibra con playtest.
- Un día sin juego (`SIN CANDIDATOS`) no se fuerza nunca.
- En FULL-AUTO, ante duda editorial, no se genera: es más barato un día vacío
  que un juego malo.
