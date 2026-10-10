# Deploy — Etapa 1 del plan POC 3

El sitio es 100% estático: `npm run build` produce un `dist/` autocontenido
(app + `content/` jugable + chooser `web/` + landings OG por juego + tarjetas
PNG 1200×630 + `_redirects`). Sin backend: lo "dinámico" son commits.

## Qué produce el build

| Ruta | Qué es |
|---|---|
| `/` | El chooser (rewritten a `/web/index.html` por `_redirects`) |
| `/index.html?game=<id>` | El juego (Phaser), carga `content/events/<id>/` |
| `/juego/<id>/` | Landing del juego con meta tags OG; redirige al juego. **Esta es la URL que se comparte** |
| `/og/<id>.png` | Tarjeta 1200×630 (avatar rasterizado + banda del tema) |
| `/web/` | Chooser sin rewrite (fallback) |

El build encadena `tsc → vite build → validate → index → site`: si un gamespec
no valida, no hay sitio.

## Variables de entorno (opcionales)

- `SITE_URL` (o `CF_PAGES_URL`, que Cloudflare Pages setea solo): URL absoluta
  del sitio. Sin ella los `og:image`/`og:url` salen relativos y WhatsApp no
  muestra tarjeta.
- `CLOUDFLARE_WEB_ANALYTICS_TOKEN`: beacon de Cloudflare Web Analytics inyectado
  en la app y el chooser. Crear el sitio en
  https://dash.cloudflare.com → Web Analytics y pegar el token.

## Alta en Cloudflare Pages (gratis)

1. Crear el repo en GitHub y pushear este proyecto (repo **público**: Actions
   gratis y sin límite).
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git →
   elegir el repo.
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Variables: `NODE_VERSION=24` (y las de arriba, si ya hay token).
3. Cada push a `main` deploya. El primer deploy da la URL
   `https://<proyecto>.pages.dev`.
4. Verificar la tarjeta: https://developers.facebook.com/tools/debug/ con la
   URL `/juego/<id>/` (WhatsApp usa el crawler de Facebook). Si cacheó una
   versión sin imagen, "Scrape again" después del deploy.

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
