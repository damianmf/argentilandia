# Deploy — Etapa 1 del plan POC 3

El sitio es 100% estático: `npm run build` produce un `dist/` autocontenido
(app + `content/` jugable + chooser `web/` + landings OG por juego + tarjetas
PNG 1200×630 + `_redirects`). Sin backend: lo "dinámico" son commits.

## Qué produce el build

| Ruta | Qué es |
|---|---|
| `/` | La app (Phaser). Sin `?game=` redirige al chooser (`/web/`); los deep links siempre traen `?game=` |
| `/index.html?game=<id>` | Mismo asset: los Workers normalizan `/index.html` a `/` (307) antes de servir |
| `/juego/<id>/` | Landing del juego con meta tags OG; redirige al juego. **Esta es la URL que se comparte** |
| `/og/<id>.png` | Tarjeta 1200×630 (avatar rasterizado + banda del tema) |
| `/web/` | El chooser (índice de juegos) |

El build encadena `tsc → vite build → validate → index → site`: si un gamespec
no valida, no hay sitio.

## Variables de entorno (opcionales)

- `SITE_URL`: URL absoluta del sitio (los `og:image`/`og:url` la necesitan para
  que WhatsApp muestre tarjeta). En Workers con assets no hay variable auto
  que la dé: cargarla a mano en los build settings con la URL workers.dev.
  También la lee el draft para bajar los veredictos del último juego.
- `CLOUDFLARE_WEB_ANALYTICS_TOKEN`: beacon de Cloudflare Web Analytics inyectado
  en la app y el chooser. Crear el sitio en
  https://dash.cloudflare.com → Web Analytics y pegar el token.
- `IP_SALT` (binding del worker, solo con backend): sal del hash de IP para el
  rate limit de `/api`. Default `jornada` si no se define.

## Backend de veredictos (opcional, requiere un paso único)

Por defecto el sitio deploya **assets-only** (sin script de Worker). Para
activar comentarios + ranking: `npx wrangler login` → `npm run backend:setup` →
commit + push. El script (`scripts/configurar-backend.mjs`) crea la base D1
`juego-actualidad`, agrega a `wrangler.jsonc` el `main` (`worker/index.mjs`) y
los bindings (`ASSETS`, `DB`), y aplica `worker/schema.sql`. Desde ahí el mismo
Worker sirve los assets (todo lo que no es `/api/*` pasa por
`env.ASSETS.fetch`) y atiende:

| Ruta | Qué hace |
|---|---|
| `POST /api/juegos/<id>/partidas` | apodo + score + comentario opcional → puesto en el ranking. **Solo el juego más nuevo publicado la acepta** (403 en los anteriores: escalafón congelado como archivo). Valida el id contra `worker/juegos.json` (regenerado por el build, con fechas), caps de longitud, rate limit 6/hora por IP hasheada |
| `GET /api/juegos/<id>/resumen` | ranking top-10 por mejor puntaje por apodo, últimos 20 veredictos, totales y `abierto` (si este juego recibe partidas). Funciona para todos los juegos, también los cerrados |

La moderación es posterior (`visible = 0` vía `wrangler d1 execute`, ver
runbook). Sin backend configurado, el Outro degrada: "RANKING NO DISPONIBLE".

## Alta en Cloudflare (hecha el 10/10: Workers con assets estáticos)

El proyecto es un **Worker de solo assets** (el flujo nuevo de Cloudflare,
sucesor de Pages): el dashboard corre `npm run build` y deploya con
`npx wrangler deploy`, guiado por el `wrangler.jsonc` del repo (assets en
`dist/`, `not_found_handling: "404-page"`). Nada de configurar a mano: la
config vive commiteada y cada push a `main` deploya.

1. Repo: https://github.com/damianmf/argentilandia (público; se llamaba
   `juego-de-la-actualidad` hasta el 12/10 — GitHub redirige los links viejos).
2. Proyecto Cloudflare conectado al repo (build
   command `npm run build`, deploy command `npx wrangler deploy`).
3. Deploy URL: `https://argentilandia.<subdominio>.workers.dev`.
4. `SITE_URL`: en Workers **no** existe `CF_PAGES_URL` — cargar la URL final
   del paso 3 como variable de entorno `SITE_URL` en los build settings y
   re-deployar, para que los `og:image`/`og:url` salgan absolutos.
5. Verificar la tarjeta: https://developers.facebook.com/tools/debug/ con la
   URL `/juego/<id>/` (WhatsApp usa el crawler de Facebook). Si cacheó una
   versión sin imagen, "Scrape again" después del deploy.

Lecciones del primer deploy (10/10): el validador de la API rechaza reglas de
`_redirects` cuyo target termina en `/index.html` ("infinite loop", code
100324), y además los Workers normalizan `/index.html` a `/` (307) — cualquier
rewrite de `/` termina tragándose los deep links. Por eso no hay `_redirects`:
el chooser se elige desde la app cuando no viene `?game=`. Y el auto-setup de
wrangler para Vite asume SPA (`not_found_handling:
"single-page-application"`): no dejar que la regenere, el `wrangler.jsonc` del
repo manda.

## Chequeo del gate (Etapa 1)

- [x] Un contacto abre el link desde su teléfono, elige juego, juega y lee el
      outro. (12/10: jugado por el humano desde su teléfono.)
- [x] COMPARTIR copia el texto + link `/juego/<id>/`; al re-compartir ese link
      en WhatsApp aparece la tarjeta con avatar. (12/10: SITE_URL configurado,
      OG absoluto verificado; desafío viaja como `?revancha=` en el link.)

## Corte del cron (Etapa 2)

Mientras el draft y la generación sean pasos de sesión, la jornada corre con el
cron del entorno (runbook). Cuando la Etapa 2 los automatice: habilitar el
`schedule` de `.github/workflows/radar-diario.yml` y desactivar el cron del
entorno — nunca los dos a la vez (doble radar).

## Migración de nombre (12/10): `argentilandia`

Cloudflare **no permite renombrar un Worker**: la URL nueva se logra
deployando con otro `name` en `wrangler.jsonc` y borrando el viejo. Los
bindings (D1 + assets) viajan con la config commiteada, así que la base de
veredictos no se toca. Lo que quedó hecho desde la CLI:

- `wrangler.jsonc` `name` → `argentilandia`; deploy local con
  `SITE_URL=https://argentilandia.dami-fontenla.workers.dev npm run build &&
  npx wrangler deploy`. Verificado: juego, `/api` (misma D1) y OG absoluto.
- El worker viejo (`juego-de-la-actualidad`) siguió en pie durante la
  transición.

Pendientes del humano (dashboards):

1. GitHub: repo → Settings → General → Repository name → `argentilandia`
   (GitHub redirige los links viejos). Avisar para actualizar el remote local.
2. Cloudflare: Workers & Pages → `argentilandia` → Settings → Build →
   conectar el repo (el build quedó apuntando al worker viejo).
3. En los build settings del worker nuevo: `SITE_URL =
   https://argentilandia.dami-fontenla.workers.dev` y re-deployar.
4. Borrar el worker viejo (`juego-de-la-actualidad` → Settings → Delete)
   cuando el nuevo esté deployando solo en cada push. Los links viejos
   compartidos dejan de funcionar recién ahí.
