# Runbook — jornada diaria (POC 3, Etapa 2)

Pipeline: **radar → draft → generación (N candidatos + juez) → validación → web → commit+push**.

**Modo actual (desde el 11/10): FULL-AUTO headless.** Los dos pasos que hacía el
agente en sesión (draft y pasada 2) son scripts: `npm run jornada` corre todo y
publica solo, con las barreras de la casa (umbral de elegibilidad, regla de
variedad, N candidatos autopuntuados contra el checklist, Zod, validate en 0).
La persona audita después; des-publicar es un commit. Con `APROBACION=on`
(.env) el pipeline vuelve a cortar en el draft esperando el OK humano.

## Qué corre solo (todos los días, dos crons con red de seguridad)

Dos automatizaciones corren la jornada; la idempotencia del paso 1 hace que si
las dos llegan a producir el mismo día, la segunda encuentra la jornada hecha y
es un no-op:

- **9:00 Argentina — automatización de ZCode** ("Jornada automática — todos
  los días a las 9:00", en la máquina local): corre `npm run jornada`; sin
  `.env` con key, cae al modo sin key de más abajo (la sesión hace de LLM con
  los mismos contratos). Depende de que la máquina esté prendida y despierta a
  esa hora: si no lo estaba, esa corrida se pierde.
- **10:30 Argentina — GitHub Actions** (`radar-diario.yml`, hospedada, no
  depende de ninguna máquina): con el secret `LLM_API_KEY` corre
  `npm run jornada` completo; sin secret degrada a `npm run radar` (commitea
  solo los candidatos crudos del día). Sale una hora después de la de ZCode a
  propósito: si la de las 9:00 publicó, acá no hace nada.

En ambos casos `npm run jornada` hace, en orden y cortando ante cualquier bloqueo:

1. **Chequeo**: si ya existe evento con la fecha de hoy en `content/events/`,
   la jornada se considera producida y termina (idempotente).
2. **Radar**: `scripts/radar.mjs` → `content/radar/<fecha>/candidatos.md`
   (5 feeds argentinos; si ninguno responde, día sin juego).
3. **Draft headless**: `scripts/generar-draft.mjs` — llamada A: preselección
   (hasta 5 titulares, 6 criterios 1–10, descartes obligatorios) → llamada B:
   del ganador, `Event` completo + declaración de acidez + 3 pitches. Salida:
   `content/radar/<fecha>/seleccion.json` (registro comparable) +
   `draft.md` renderizado. Nada pasa el umbral (`gameability >= 7`) →
   `SIN_CANDIDATOS`: día sin juego, resultado válido.
4. **Generación headless**: `scripts/generar-juego.mjs` — N=3 candidatos del
   pitch elegido (el mejor por `scoreChiste`, respetando variedad de motor),
   cada uno validado con el schema Zod y juzgado contra el checklist de la casa
   (ningún criterio < 6 y promedio >= 7). Gana el mejor; si ninguno pasa, día
   sin juego. Salida: `content/events/<id>/` (event.json, gamespec.json
   difficulty 5, avatar.svg paramétrico, scores.json, produccion.md).
5. **Validación**: `npm run validate`; si falla, el evento del día se borra,
   la web no se toca (`RECHAZADO_POR_VALIDACION`).
6. **Web**: `npm run index` → card nueva en `web/index.html`.
7. **Commit + push**: `jornada-<fecha>`; el push a main deploya (Cloudflare
   Workers Builds). Nunca toca tags ni commits anteriores.

La línea `RESUMEN: {...}` del final es el contrato de reporte del cron.

## Qué hace el humano (auditar, ~2 minutos por día)

- Leer el reporte de las 9:00 y, si querés, jugar la web del día.
- **Auditar**: `content/radar/<fecha>/seleccion.json` (por qué esa noticia y no
  otra, scores de los 6 criterios, acidez declarada) y
  `content/events/<id>/scores.json` (los N candidatos y sus veredictos).
- Lo que salga mal: **des-publicar con un commit** (ver abajo) y anotar el
  ajuste en los **prompts** (`content/prompts/`): lo que se arregla en el
  prompt se arregla para siempre. Nunca a mano en los JSON del día.
- Para regenerar a mano: `npm run radar -- <fecha>`, `node scripts/generar-draft.mjs <fecha>`,
  `node scripts/generar-juego.mjs <fecha>`, o todo junto con `npm run jornada --
  <fecha>` (agregar `--seco` para no commitear).
- Probar el pipeline sin key ni gastar llamadas: `node scripts/mock-llm.mjs` +
  `LLM_BASE_URL=http://127.0.0.1:8787/v4 LLM_API_KEY=test npm run jornada -- <fecha> --seco`.

## Config

- `.env` (gitignoreado, copiar de `.env.example`): `LLM_API_KEY` (Z.ai),
  `LLM_BASE_URL`, `LLM_MODEL`. Sin key, los pasos LLM fallan con error claro.
- `LLM_API_KEY` como secret de GitHub (Settings → Secrets and variables →
  Actions): es lo que habilita la corrida hospedada completa de las 10:30.
  Sin secret, ese cron degrada a radar. Desde el 16/10 la key del secret es
  del **Coding Plan** de Z.ai (cuota de la suscripción, no pay-per-token) y el
  workflow fija `LLM_BASE_URL` al endpoint coding
  (`api.z.ai/api/coding/paas/v4`): la facturación la define el tipo de key.
  En CI la config va toda por env (`llm.mjs` lee env antes que `.env`);
  `SITE_URL` la fija el workflow.
- `APROBACION=on`: el pipeline corta tras el draft (`ESPERANDO_APROBACION`,
  exit 2) y la jornada continúa cuando alguien complete la generación a mano.
- `N_CANDIDATOS`: candidatos por jornada (default 3).
- `SITE_URL`: URL pública del sitio (default: la workers.dev). La usa el draft
  para bajar los veredictos del último juego; si no responde, sigue sin ellos.

## Backend de veredictos (comentarios + ranking)

Configuración única: `npx wrangler login` → `npm run backend:setup` → commit +
push. El script crea la base D1 `juego-actualidad`, cuelga el worker
(`main` + bindings `ASSETS`/`DB` en wrangler.jsonc) y aplica `worker/schema.sql`.
Hasta ese paso el sitio sigue deployando como assets-only y el `/api` no existe
(el Outro lo maneja: "RANKING NO DISPONIBLE ACÁ").

Endpoints: `POST /api/juegos/<id>/partidas` (apodo + score + comentario
opcional; rate limit 6 por IP y juego por hora) y
`GET /api/juegos/<id>/resumen` (ranking top-10 + últimos veredictos + totales).
Los ids válidos salen de `worker/juegos.json`, que regenera cada build.

Auditoría de veredictos (sumarla a la de todos los días; **solo hace falta
mirar el juego de hoy**: es el único que recibe partidas, los anteriores quedan
como archivo congelado de solo lectura):

```sh
npx wrangler d1 execute juego-actualidad --remote \
  --command "SELECT id, game_id, apodo, score, comentario FROM partidas WHERE visible = 1 ORDER BY id DESC LIMIT 30"
# ocultar lo que no salga:
npx wrangler d1 execute juego-actualidad --remote \
  --command "UPDATE partidas SET visible = 0 WHERE id = <id>"
```

Los veredictos visibles del último juego entran solos al draft del día
siguiente (señal editorial, no orden: lo define radar-diario.md).

Probar el backend sin deployar: `wrangler dev` con una config temporal que
tenga `main`, `assets.binding` y una D1 local (cualquier `database_id` sirve en
`--local`) + `--no-live-reload` (el live-reload de dev navega la página sola y
parece un bug del juego).

## Modo sin key (local): la sesión hace de LLM

Sin `LLM_API_KEY`, `npm run jornada` falla en el draft — y ahí el agente de la
sesión (o el cron del entorno) toma los dos pasos creativos ejecutándolos a mano
con **los mismos contratos** que usa la API. **Desde el 12/10 este es el modo de
operación vigente** (decisión del humano: "hasta tener algo interesante lo
corremos a mano"), no una contingencia: el gate de Etapa 2 corre sobre este modo.
La secuencia, paso a paso:

1. `npm run radar -- <fecha>` (script).
2. **Draft**: seguir `content/prompts/radar-diario.md` (llamada A y B) y escribir
   `content/radar/<fecha>/seleccion.json` + `draft.md` con el mismo shape.
3. **Generación**: seguir `content/prompts/game-generation.md` (contrato de
   candidato + juez): 3 variantes del pitch elegido, veredictos en
   `content/events/<id>/scores.json`, `gamespec.json` validado con
   `npm run validate`, avatar con `scripts/generar-avatar.mjs` (config JSON →
   `avatar.svg`), y `produccion.md`.
4. `npm run index` + commit `jornada-<fecha>` (+ push para publicar).

Es el modo con el que se produjo la jornada 2026-10-11 (ver su `produccion.md`).
El día que haya key en `.env`, `npm run jornada` solo hace todo sin sesión.

## Des-publicar

La web es estática y versionada: quitar el evento del día, `npm run index`,
commit. Sin backend que apagar.

## Reglas duras

- Regla de fuentes de PROJECT.md: todo fact/quote/momento trazable a una source
  del mismo JSON. Zod barra quote/moments huérfanos; los facts los mira el juez
  (criterio `fuentes`) más la alerta mecánica de solapamiento con los facts del
  Event.
- Nada se publica sin `npm run validate` en 0 (el orquestador lo garantiza).
- Dificultad de arranque `5` (el script la fuerza); se calibra con playtest.
- Un día sin juego (`SIN_CANDIDATOS` / `SIN_JUEGO`) no se fuerza nunca.
- Variedad: no repetir motor ni categoría dos días seguidos (la aplica el
  script; el draft la recibe como restricción).
- Ante duda editorial, no se genera: es más barato un día vacío que un juego
  malo (el juez del checklist la aplica con su umbral).

## Probar el loop social en local (tribuna, ranking, veredictos)

1. `npx wrangler d1 execute juego-actualidad --local --file=worker/schema.sql`
   (una vez por máquina; la base local vive en `.wrangler/state`).
2. `npx wrangler dev --port 8787` en otra terminal (misma Worker que
   producción, con D1 local).
3. `npm run dev` solo: el `vite.config.ts` ya proxifica `/api` a 8787.
4. Sembrar partidas de prueba: `curl -X POST
   http://127.0.0.1:8787/api/juegos/<id>/partidas -H 'content-type:
   application/json' -d '{"apodo":"...","score":123,"comentario":"..."}'`
   (rate limit 6/hora por IP también aplica en local).

Sin wrangler corriendo, la tribuna y el ranking fallan en silencio: las
pantallas quedan como siempre (comportamiento esperado, no es un error).
