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
- `CLOUDFLARE_WEB_ANALYTICS_TOKEN`: beacon de Cloudflare Web Analytics inyectado
  en la app y el chooser. Crear el sitio en
  https://dash.cloudflare.com → Web Analytics y pegar el token.

## Alta en Cloudflare (hecha el 10/10: Workers con assets estáticos)

El proyecto es un **Worker de solo assets** (el flujo nuevo de Cloudflare,
sucesor de Pages): el dashboard corre `npm run build` y deploya con
`npx wrangler deploy`, guiado por el `wrangler.jsonc` del repo (assets en
`dist/`, `not_found_handling: "404-page"`). Nada de configurar a mano: la
config vive commiteada y cada push a `main` deploya.

1. Repo: https://github.com/damianmf/juego-de-la-actualidad (público, creado
   el 10/10 desde el CLI; remote `origin` configurado).
2. Proyecto Cloudflare `juego-de-la-actualidad` conectado al repo (build
   command `npm run build`, deploy command `npx wrangler deploy`).
3. Deploy URL: `https://juego-de-la-actualidad.<subdominio>.workers.dev`.
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

- [ ] Un contacto abre el link desde su teléfono, elige juego, juega y lee el
      outro.
- [ ] COMPARTIR copia el texto + link `/juego/<id>/`; al re-compartir ese link
      en WhatsApp aparece la tarjeta con avatar.

## Corte del cron (Etapa 2)

Mientras el draft y la generación sean pasos de sesión, la jornada corre con el
cron del entorno (runbook). Cuando la Etapa 2 los automatice: habilitar el
`schedule` de `.github/workflows/radar-diario.yml` y desactivar el cron del
entorno — nunca los dos a la vez (doble radar).
