# Plan — POC 3 y roadmap del producto

POC 2 cerró (tag `poc-2`). Este plan cubre lo que sigue, en etapas ordenadas por
dependencia: primero hostear (sin URL no hay "llegar a la gente"), después
iterar la generación (el cuello de botella real), después mejorar el juego y
recién ahí meter al usuario adentro. Los lineamientos de diseño viven en
`docs/lineamientos-del-juego.md`.

Estado de partida (09/10): 6 motores, 9 juegos, circuito viral completo,
pipeline full-auto con dos pasos todavía en sesión (draft y pasada 2).

---

## Etapa 0 — Hecho antes del 09/10

- [x] Fighter 1v1 de caricatura + sonido visible + latiguillos (SE ARMÓ LA PIÑA).
- [x] Whack con `noTouch` (PÉGUELE, SEÑORES).
- [x] Circuito viral: tarjeta COMPARTIR, récord local, PRO, attract mode,
      revancha en un tap.
- [x] Biblia de diseño + muñecos de carga pública.

---

## Etapa 1 — Hostearlo gratis y cerrar el loop público

**Objetivo:** que un link de WhatsApp abra el juego del día en cualquier
teléfono, con tarjeta rica al compartir, sin nada corriendo en tu máquina.

1. [ ] **Hosting estático**: Cloudflare Pages (gratis) — `dist/` (Vite build) +
   `content/` son 100% client-side; `npm run build` + deploy por push.
   El build ya ensambla el dist/ autocontenido (app + content jugable + chooser
   + `_redirects`); falta el alta en Cloudflare Pages (pasos en `docs/deploy.md`).
2. [x] **Tarjetas OG por juego**: `scripts/build-site.mjs` genera landings
   `/juego/<id>/` con meta tags OG (title = título, description = intro) y
   tarjetas 1200×630 en PNG (avatar rasterizado con sharp + banda del tema; los
   crawlers no renderizan SVG ni JS). COMPARTIR copia texto + link a la landing.
3. [ ] **Cron hospedado**: workflow `.github/workflows/radar-diario.yml`
   (solo manual hasta que la Etapa 2 automatice draft/generación; el schedule
   está comentado). Interin: el cron de este entorno sigue y pushea.
4. [x] **Restaurar la barrera humana pre-publicación**: desde el 09/10 el cron
   de 9:00 corta en `ESPERANDO APROBACIÓN` (runbook + PROJECT.md actualizados);
   publicado lo que sale mal se des-publica con un commit (la web es estática y
   versionada).
5. [ ] **Métricas mínimas gratis**: Cloudflare Web Analytics — el beacon se
   inyecta en el build con `CLOUDFLARE_WEB_ANALYTICS_TOKEN`; falta crear el
   sitio para obtener el token. El "COMPARTIR" queda local (clipboard) hasta
   tener un contador.

**Gate:** un contacto abre el link, elige juego, juega y lee el outro desde su
teléfono; el share produce un link con tarjeta al re-compartirlo.

---

## Etapa 2 — El loop de generación, iterado (el foco)

**Objetivo:** que generar un juego sea un proceso repetible N veces por día, con
calidad medible, sin sesión. Hoy: radar (script, automático) → draft (LLM en
sesión) → pasada 2 del GameSpec (LLM en sesión) → validate/index/commit
(scripts). El centro a iterar son los dos pasos de sesión.

1. **Generación en N intentos con autopuntaje**: en vez de un draft único, N
   candidatos (N=3) que se autoevalúan contra el checklist de la casa (¿chiste
   jugable en 4 líneas? ¿punchline en los objetos? ¿acidez correcta según el
   medidor? ¿fuente textual para la quote?) y se elige el mejor; si ninguno pasa,
   día sin juego (regla vigente).
2. **Elegibilidad de la noticia como proceso**: scores de los 6 criterios
   registrados y comparables día a día + reglas de variedad (no repetir motor ni
   categoría dos días seguidos) + segunda fuente para hechos duros + registro de
   descartes con razón (ya existe; hacerlo obligatorio y comparable).
3. **Pasada 2 automatizable**: plantillas de GameSpec por motor (el shape ya
   vive en schemas; el LLM completa el JSON) + avatares por plantillas
   paramétricas (muñeco base + atributos del cargo/evento: banda, camiseta,
   patillas — no arte nuevo por evento).
4. **Human-in-the-loop barato**: el draft del día llega como notificación con
   evento + pitch + link de preview; tu respuesta (sí/no/cambiar pitch) dispara
   la publicación. Objetivo: tu tiempo por día ≈ 2 minutos.

**Gate:** 3 jornadas consecutivas generadas sin sesión, publicadas con tu OK de
2 minutos, `validate` en 0, y un registro comparable de scores de elegibilidad.

---

## Etapa 3 — El juego mejor (juice y variantes)

1. **Cinemática de KO**: cámara lenta, zoom, lluvia de papelitos 🧻, cartelazo.
   El momentazo grabable.
2. **Onomatopeyas + hit-stop en los otros motores** (ya probado en fighter/whack).
3. **Motor `kick`**: apuntar y errar (drone de Messi pateando con la derecha).
4. **Motor `decide`** (idea del humano): juegos de decisión/elección — el jugador
   gobierna y cada opción tiene consecuencia satírica; outcome con veredicto
   ("tu gestión: vendiste el país en 3 días"). JSON-driven, sin física: barato y
   muy citable.
5. **Recalibres**: fighter d5 más amable; search estrenando evento real.

---

## Etapa 4 — El usuario dentro (ideas del humano, en orden de costo)

1. **Protagonista con nombre**: input opcional al entrar ("¿cómo te llamás?") y
   el juego/juego compartido te nombra ("Juan, Rematador Mayor del País").
   Barato y multiplica el share personal.
2. **Reacciones medibles** (entender la respuesta del usuario): luego del outro,
   reacciones (😂🤡😡🤷) + opcional una pregunta. Requiere contador mínimo
   (Workers KV gratis) — decisión de backend chico.
3. **Desafío entre amigos**: link de revancha con tu score ("me ganás?"). Sin
   backend: el desafío viaja dentro del texto compartido.
4. **La noticia con voces**: comentarios de las notas/Redes como material del
   outro ("lo que dijo la gente"). Costo medio: scraping y derechos; decidir
   outlet por outlet.
5. **Personalización por perfil (oficialista/opositor)** — recomendación
   documentada: NO voltear el chiste según el perfil (duplicaría producción,
   convierte la sátira en confirmación de bando y rompe la regla "la sátira va a
   la situación, igual para todos"). Alternativa más ácida: mismo juego para
   todos + en el outro "LAS DOS LECTURAS" (qué celebra un lado, qué lamenta el
   otro) + las reacciones del punto 2 como medición real de respuesta.

---

## Ideas sin fecha

- Fighter real (animaciones, combos) — POC original.
- Archivo histórico jugable por fecha ("¿qué pasaba el día X?").
- Multi-idioma para diáspora.
- Ligas semanales con los récords.

---

## Orden y cierre de iteraciones

Etapa 1 → Etapa 2 → Etapa 3 → Etapa 4, con los gates de arriba. Cada etapa cierra
con commit + tag y una línea en el registro de decisiones de
`docs/lineamientos-del-juego.md`. Un paso por sesión/ventana, igual que siempre.
