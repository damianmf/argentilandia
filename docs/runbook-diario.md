# Runbook — jornada diaria (POC 2)

Pipeline: **radar → draft → aprobación → generación → validación → web**.

**Modo actual (desde el 09/10): CON APROBACIÓN.** Restaurada la barrera humana
antes de publicar (plan POC 3, Etapa 1): la automatización produce hasta el draft
y corta esperando tu OK (2 minutos: leer draft, sí/no). Lo que salga mal una vez
publicado se des-publica con un commit (la web es estática y versionada).

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
4. **Aprobación humana**: `ESTADO: ESPERANDO APROBACIÓN` — presenta el evento
   recomendado + los 3 pitches y **termina la corrida sin generar**.
5. **Generación (tras tu OK)**: respondés en la sesión con **evento + pitch**
   (o "no"); recién ahí corre la pasada 2 de `game-generation.md` →
   `content/events/<id>/` (event.json, gamespec.json con `difficulty: 5`,
   avatar, produccion.md).
6. **Validación**: `npm run validate`; si no corrige el error, borra el evento
   del día (`ESTADO: RECHAZADO POR VALIDACIÓN`) y no toca la web.
7. **Web**: `npm run index` → card nueva en `web/index.html`.
8. **Commit**: `jornada-<fecha>` (nunca toca tags ni commits anteriores).
9. **Reporte** en la sesión: evento, por qué, descartes, fuente, validate/index.

## Qué hace el humano (2 minutos por día + iteración)

- Responder la corrida de las 9:00 con el OK: **evento + pitch** (leer el draft
  es opcional; el mensaje de la corrida ya trae el resumen).
- Jugar la web del día (`npm run dev` → http://localhost:5173/web/index.html) y
  anotar qué falló: tono, fuentes, dificultad, el chiste.
- Leer los drafts (`content/radar/<fecha>/draft.md`) y los reportes de cada
  corrida; los ajustes se hacen en los **prompts** (`radar-diario.md`,
  `game-generation.md`, `linea-editorial.md`), no a mano en los JSON: lo que se
  arregla en el prompt se arregla para siempre.
- Para regenerar el radar a mano: `npm run radar [fecha]` y pedir el paso 3 del
  cron en una sesión.

## Des-publicar

La web es estática y versionada: lo que salió mal se des-publica con un commit
(quitar el evento y regenerar el índice). Sin backend que apagar.

## Reglas duras

- Regla de fuentes de PROJECT.md: todo fact/quote/momento trazable a una source
  del mismo JSON. Zod barra quote/moments huérfanos; los facts siguen siendo
  chequeo manual en la revisión de calidad.
- Nada se publica sin `npm run validate` en 0.
- Dificultad de arranque `5` para todo evento nuevo; se calibra con playtest.
- Un día sin juego (`SIN CANDIDATOS`) no se fuerza nunca.
- En FULL-AUTO, ante duda editorial, no se genera: es más barato un día vacío
  que un juego malo.
