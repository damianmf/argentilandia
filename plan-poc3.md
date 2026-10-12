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

1. [x] **Hosting estático**: VIVO desde el 11/10 en
   https://juego-de-la-actualidad.dami-fontenla.workers.dev — Cloudflare
   **Workers con assets estáticos** (no Pages): repo GitHub público
   (damianmf/juego-de-la-actualidad), build `npm run build`, deploy
   `npx wrangler deploy` guiado por `wrangler.jsonc` (assets-only, 404-page).
   Sin `_redirects`: los Workers normalizan `/index.html` a `/`, así que el
   chooser se elige desde la app sin `?game=` (lecciones en `docs/deploy.md`).
   Juego verificado corriendo en producción (título + gameplay).
   **Cierre del gate pendiente**: variable `SITE_URL` en build settings +
   re-deploy (OG absoluto), debugger de Facebook sobre una landing
   `/juego/<id>/`, y el test de teléfono con un contacto.
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
**(CERRADO 12/10**: SITE_URL confirmado en producción (OG absoluto verificado
por curl), jugado desde teléfono por el humano. Etapa 1 cierra con tag
`etapa-1`.)

---

## Etapa 2 — El loop de generación, iterado (el foco)

**Objetivo:** que generar un juego sea un proceso repetible N veces por día, con
calidad medible, sin sesión. ~~Hoy: radar (script, automático) → draft (LLM en
sesión) → pasada 2 del GameSpec (LLM en sesión) → validate/index/commit
(scripts).~~ **Cerrado el 11/10**: los dos pasos de sesión son scripts
(`npm run jornada`, LLM vía API Z.ai/GLM); queda el gate de 3 jornadas y el
cron hospedado (Etapa 1.3).

1. [x] **Generación en N intentos con autopuntaje** (11/10):
   `scripts/generar-juego.mjs` genera N=3 candidatos del pitch elegido (el
   mejor por `scoreChiste`, respetando variedad de motor), cada uno validado
   con el schema Zod y juzgado contra el checklist de la casa (ningún criterio
   < 6 y promedio >= 7). Gana el mejor; si ninguno pasa, día sin juego.
   Veredictos en `content/events/<id>/scores.json`.
2. [x] **Elegibilidad de la noticia como proceso** (11/10):
   `scripts/generar-draft.mjs` produce `seleccion.json` comparable (preselección
   con los 6 criterios, descartes obligatorios con razón, declaración de
   acidez) + reglas de variedad (no repetir motor ni categoría del último juego,
   aplicadas por el script) + segunda fuente cuando el mismo hecho aparece en
   más de un feed.
3. [x] **Pasada 2 automatizable** (11/10): contrato de GameSpec por motor (los
   prompts de `content/prompts/` son la fuente única que los scripts leen) con
   salida JSON validada por Zod; avatares paramétricos (`generar-avatar.mjs`):
   muñeco base + atributos (banda, camiseta, patillas, gorro, emoción,
   accesorio) — no arte nuevo por evento.
4. [x] **Human-in-the-loop barato** (11/10, decisión del humano: **full-auto**):
   reemplaza el OK de 2 minutos por publicación automática con las barreras de
   arriba; la auditoría es posterior (seleccion.json + scores.json +
   produccion.md) y des-publicar es un commit. `APROBACION=on` reactiva el
   corte humano cuando se quiera, sin tocar código.
5. [x] **Draft con memoria** (12/10): la llamada A recibe los últimos 2 días de
   `seleccion.json` (preselección + descartes con scores): un descarte que
   reaparece hoy puede ganar (reincidente); si el ganador repite historia
   jugada, `segundaJornada` con giro obligatorio. Queda en `seleccion.json`
   (`memoria`) y en el encabezado de `draft.md`. Entra además la señal de los
   jugadores: veredictos del último juego desde el backend (si existe), en A y
   en B (ver Etapa 4).

**Gate:** 3 jornadas consecutivas generadas sin sesión, publicadas con tu OK de
2 minutos, `validate` en 0, y un registro comparable de scores de elegibilidad.
*(Actualizado 11/10: sin OK previo, por la decisión de full-auto. El gate queda:
3 jornadas consecutivas generadas y publicadas por el cron headless, validate en
0, y seleccion.json/scores.json acumulándose.)*
*(Actualizado 12/10, decisión del humano: **sin key por ahora** — "hasta tener
algo interesante lo corremos a mano". El modo sin key pasa de contingencia a
**modo de operación** (los contratos son los mismos; runbook). El gate queda:
3 jornadas consecutivas con validate en 0 y seleccion.json/scores.json/memoria
acumulándose — van 2. El paso headless con key + cron hospedado queda
**diferido**, no cancelado: se activa cuando la jornada a mano se vuelva el
cuello de botella.)*

---

## Etapa 3 — El juego mejor (juice y variantes)

*Estado (12/10): primera vuelta de juice compartido hecha — Catcher, Dodge y
Runner (pops de puntos, hit-stop tras cada impacto, shake + sonido
diferenciado para el malagarre, reloj rojo pulsante en los últimos 10s;
Runner agrega squash & stretch al saltar y aterrizar). Search ya traía
feedback propio de antes (labels flotantes + shake); queda alinearlo a esta
pasada en alguna vuelta. **Recalibre de duración (12/10, jugado y aprobado por
el humano)**: los motores de reflejos bajan a 20 s (catcher, dodge, runner,
whack, fighter — este último a confirmar cuando corra el próximo) y search
queda en 30–45; contrato actualizado en game-generation.md + piso del clamp en
generar-juego.mjs; los juegos ya publicados quedan en su duración original
(archivo congelado). Siguen las cinemáticas y los motores nuevos.*

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

Estado (12/10): la primera vuelta de 1, 2 y el nombre del 1 están hechas.

0. [x] **Portada del día** (12/10): el chooser ya no es un archivo — hero con
   el juego de la fecha más nueva + carrusel chico de los últimos 7 días; los
   demos quedan fuera de la portada (deep link). "Populares" = más partidas
   registradas en 7 días, activar cuando el backend acumule datos.
1. [x] **Protagonista con nombre → apodo del ranking** (12/10): input de apodo
   al terminar (recordado en localStorage); el puesto se comparte con el marco
   satírico del juego (`GameSpec.ranking`) y viaja en el texto de COMPARTIR.
2. [x] **Reacciones medibles → veredictos** (12/10): luego del outro, apodo +
   1 comentario opcional + puntaje en un solo POST (Worker + D1, gratis en el
   plan free). Ranking top-10 y últimos veredictos visibles en el juego;
   moderación posterior desde la auditoría (`visible = 0`).
   **Regla de contención**: solo el juego más nuevo publicado recibe partidas —
   los anteriores son archivo congelado (lectura), así la moderación es siempre
   "los veredictos de hoy" y el escalafón es un ritual diario (estilo Wordle).
   **Visible en el welcome** (12/10): los veredictos corren como ticker en la
   pantalla de título ("🏁 N partidas · 💬 apodo: comentario…"), prueba social
   al entrar; sin backend o sin comentarios, no aparece.
   **Pendiente el único paso de infra**: `wrangler login` + `npm run
   backend:setup` + push (crea la base D1 y cuelga el handler `/api`).
3. [x] **Desafío entre amigos** (12/10): el COMPARTIR lleva `⚔️ ¿ME GANÁS?` +
   link con `?revancha=<puntaje>`; la landing preserva la query y la pantalla de
   título del que abre el link muestra "TE DESAFIARON: N PTS — ¿PODÉS SUPERARLO?".
   Sin backend: el desafío viaja dentro del texto compartido.
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

*(Cierre 12/10: **Etapa 1 cerrada** (tag `etapa-1`); Etapa 2 en gate con 2 de 3
jornadas, modo a mano; Etapa 4 cerrada en su primera vuelta (portada, apodo,
veredictos + ranking con contención, desafío). Lo que sigue, según el humano:
**jugar e iterar de verdad** — jornadas diarias + primeras personas jugando, y
sobre esos datos recién elegir el sprint de Etapa 3 (recalibres con datos, no a
ciegas). Bolas propias del humano: dominio (punto 3, a su ritmo) y key (diferida).)*
