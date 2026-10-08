# Plan de ejecución — POC 2 (impacto + variedad + automatización)

Plan operativo por fases, para correr en ventanas/sesiones independientes, igual que
`plan.md`. El contexto (concepto, modelos, riesgos) vive en `PROJECT.md`; las lecciones
de la POC 1 viven en `docs/retrospectiva-poc1.md`. Este archivo solo define qué se
construye, en qué orden y cómo se valida.

## Cómo ejecutar las fases

Cada fase corre en una ventana/sesión independiente. Prompt sugerido:

> Leé PROJECT.md, docs/retrospectiva-poc1.md y plan-poc2.md. Ejecutá únicamente la
> Fase N de POC 2. Respetá las convenciones globales. Al terminar, corré el gate de
> la fase; si pasa, marcá los checkboxes y hacé el commit del checkpoint. No avances
> a la siguiente fase.

Reglas para toda sesión (idénticas a POC 1):

- Respuestas concisas, sin comentarios en el código.
- Leer solo: `PROJECT.md`, `plan.md`, `plan-poc2.md`, `src/`, `content/`, `docs/`, configs. Nunca `node_modules/`.
- Si algo no está definido, decidir lo más simple y anotarlo en "Notas de fase".
- Al cierre de fase: tildar checkboxes, commit `poc2-checkpoint-<N>`.

## Convenciones globales de POC 2

Heredan todo lo de `plan.md` (stack, canvas 960×600, español rioplatense, fin por
timer, puntaje sin vidas) y agregan/cambian:

| Tema | Definición |
|---|---|
| Deploy | **Diferido explícitamente** (decisión 27/09). Todo se valida en local. Existe una fase opcional final si se decide publicar |
| Personajes | Avatares caricatura generados por IA en **build-time**, guardados como archivo estático en `content/events/<id>/` y referenciados por el GameSpec. Runtime 100% client-side. Si no hay avatar, el motor usa el emoji: nunca se rompe |
| Violencia / humor | Línea editorial escrita (`content/prompts/linea-editorial.md`): violencia de caricatura (piñas, humo, trompadas, caídas) sí; sangre, tragedias con víctimas reales, o ensañarse con personas concretas, no. La sátira va a las situaciones |
| Motores | Se agregan `search` y `runner` a la unión discriminada. El motor no conoce la noticia |
| Narrativa | Outro v2: `LA FRASE DEL DÍA` (cita textual + autor, trazable a fuente) + whatHappened con momentos concretos. Vía GameSpec |
| Sonido | Beeps generados con WebAudio (sin assets), opcionales por GameSpec |
| Web diaria | `index.html` generado estáticamente desde `content/` que lista los juegos del día. Local: se abre en el browser, sin servidor |
| Automatización | Auto-draft + aprobación humana: el radar arma Event + pitches automáticamente, la elección editorial sigue siendo humana (principio del spec) |
| Dificultad | Default de arranque `5` para todo evento nuevo (lección de POC 1) |
| Git | Un commit `poc2-checkpoint-<N>` por fase |

---

## Fase 0 — Presentación que llama la atención

**Objetivo:** que el juego se vea "de otro evento" sin tocar mecánicas: escenario
themado, avatar caricatura y portada con punchline.

**Precondiciones:** ninguna (usa el contenido existente de POC 1).

**Tareas:**

1. `content/prompts/linea-editorial.md`: qué humor sí (sarcasmo, absurdo, violencia
   de caricatura), qué no (victimas reales, odio, ensañarse con personas), y reglas
   para la generación de avatares (caricatura de situación, no foto de la persona).
2. `src/types.ts` + `src/schemas.ts`: bloque `theme` opcional en el GameSpec
   (paleta de fondo, decoraciones de escenario como emojis/posiciones, colores de HUD).
   `z`-validado, opcional: sin `theme`, se usa el escenario actual.
3. Render de escenario en las 3 escenas: fondo con paleta, capa de decoración
   (público, cancha, muros, cielo de Bakú...), todo con emojis/formas — cero assets.
4. Avatar: soporte en GameSpec (`player.image?`, opcional). Script/prompt
   `content/prompts/avatar-generation.md`: cómo generar la caricatura del
   personaje de turno y dónde guardarla. El motor renderiza la imagen si existe,
   si no el emoji. Probar con un avatar real para Colapinto y para Verón.
5. Portada (Title): punchline animado — título que entra con impacto, avatar
   grande, sin cambiar el flujo.
6. Sonido mínimo: beeps WebAudio para captura/choque/fin (opt-in por GameSpec).

**Gate para pasar a Fase 1:**

- [x] Los 3 juegos existentes validan (`npm run validate` en 0) y se ven iguales que antes (theme es opcional y ausente).
- [x] Con un `theme` agregado al JSON de un evento, el escenario cambia sin tocar código.
- [x] Al menos un evento juega con avatar caricatura y otro sin él (fallback emoji) sin romperse.
- [x] Beeps audibles en captura/choque, y silencio si el GameSpec no los pide.
- [x] Commit `poc2-checkpoint-0`.

**Notas de fase 0:**

- Sin generador de imágenes IA disponible en la sesión, los avatares se escribieron
  como SVG plano a mano por la sesión (misma regla editorial, mismo resultado estático);
  el método queda documentado en `content/prompts/avatar-generation.md`.
- El avatar es del `player` del juego. En el evento Supercopa el player es Herrera
  (el árbitro), no Verón: el avatar es la caricatura del árbitro con la copa.
- `theme` en el Outro pinta solo el fondo, sin decoración: el texto largo necesita legibilidad.
- Los emojis de decoración con caja opaca (🏙️, 🏟️) se ubican fuera del título: su
  "sticker" tapa texto si van al centro.
- Sonido: mecanismo verificado (initAudio en el click de JUGAR, beeps en captura/choque/fin,
  silencio si `sound` no está); la audibilidad real queda para el primer playtest humano.

---

## Fase 1 — Motor search

**Objetivo:** tercera mecánica: grilla de búsqueda (estilo minesweeper simple) para
noticias de escándalos / "encontrá X".

**Precondiciones:** gate de Fase 0 verde.

**Tareas:**

1. `src/types.ts` + `src/schemas.ts`: branch `search` de la unión: grilla WxH,
   items a encontrar (con emoji/label/points), items trampa, tiempo, cantidad de
   toques permitidos. Espejo Zod + error legible.
2. `src/scenes/Search.ts`: grilla clicable, revelado, contador de aciertos y
   tiempo. Reuso del HUD y de la dificultad (tabla propia o anclajes search).
3. Flujo completo: Title → Search → Outro. Routing en `main.ts`/`Title.ts`.
4. Tabla de dificultad search (densidad de trampas vs premios, tamaño de grilla).
5. Convertir un evento existente (o el demo) a search para probar.

**Gate para pasar a Fase 2:**

- [x] Partida completa de search: entender qué hacer sin tutorial, terminar por timer/objetivo, outro correcto.
- [x] Dificultad 1 vs 10 notable a simple vista.
- [x] Los otros dos motores (catcher/dodge) siguen funcionando igual.
- [x] `npm run validate` en 0. Commit `poc2-checkpoint-1`.

**Notas de fase 1:**

- `maxTouches` es techo duro: al tocar la trampa número N se termina la partida
  ("TE QUEDASTE SIN TOQUES"). Encontrar todo también corta ("¡ENCONTRASTE TODO!").
  El Outro ahora recibe un `headline` opcional por scene data (default
  "SE TERMINÓ EL TIEMPO"), así los tres finales se distinguen en el outro.
- La dificultad define densidades (findRatio/trapRatio, anclajes propios en
  `difficulty.ts`); el tamaño de grilla lo define el JSON (4–14) y no escala con
  la dificultad. Grilla 8×6: d1 = 19 premios/5 trampas, d5 = 13/11, d10 = 7/17.
- El tamaño de celda se calcula para que cualquier grilla entre en el canvas
  (máx 120px por celda), sin scroll ni ajuste manual.
- La verificación visual 1 vs 10 volvió a chocar con el throttling del browser en
  background (rAF congelado: mismo límite que el bot por CDP de POC 1). Quedó
  verificada por composición resultante (HUD "0/19" vs "0/7" + tabla) y queda el
  playtest humano como gate real de dificultad.
- Evento de prueba: `demo-search` (LOS CHORIZOS DE NORDELTA), difficulty 5,
  convertido del contenido del demo catcher (mismos personajes y objetos).

---

## Fase 2 — Motor runner

**Objetivo:** cuarta mecánica: avance automático + esquivar/saltar obstáculos,
para persecuciones y huidas.

**Precondiciones:** gate de Fase 1 verde.

**Tareas:**

1. Branch `runner` en tipos/esquema: obstáculos (altos/bajos), premios,
   velocidad, salto/esquivar.
2. `src/scenes/Runner.ts`: scroll horizontal, salto (o duck) con espacio/↓,
   colisiones, puntaje por distancia + premios.
3. Tabla de dificultad runner (velocidad, frecuencia de obstáculos, gaps).
4. Convertir un evento a runner para probar punta a punta.

**Gate para pasar a Fase 3:**

- [x] Partida completa runner jugable con teclado y mouse (los dos controles).
- [x] 4 motores conviven: `?game=` carga catcher, dodge, search o runner según JSON.
- [x] `npm run validate` en 0 con los 4. Commit `poc2-checkpoint-2`.

**Notas de fase 2:**

- Controles: teclado (Espacio/↑ salta, ↓ sostenido agacha) y mouse (click izquierdo
  salta, click derecho sostenido agacha, con context menu deshabilitado en el
  canvas). Verificados los dos canales por automatización con capturas: squash
  visible con duck sostenido y salto con subida/bajada por gravedad.
- `kind` por obstáculo en el JSON: `jump` = apoyado en el piso (se salta),
  `duck` = a la altura de la cabeza (se esquiva agachándose, Clearance 38px).
- Física constante, no escala con dificultad: salto de ~121px y ~0.72s de aire.
  La dificultad escala velocidad (260→640 px/s), frecuencia de spawn (1500→600 ms)
  y proporción de premios (0.45→0.25). El gap entre obstáculos sale de
  velocidad×intervalo y queda casi plano (~390–420 px) en toda la tabla.
- Puntaje = distancia (0.1 pts/px) + bonus de premios y golpes; sin vidas: el
  golpe resta puntos y el obstáculo explota, igual que en dodge.
- Riesgo conocido en d10: el gap (384 px) es menor que lo que cubre un salto
  (458 px), así que puede haber pares de obstáculos imposibles en secuencia
  desfavorable — mismo problema que dodge en d7, se recalibra con playtest.
- Evento de prueba `demo-runner` (LA GRAN FUGA DE NORDELTA) convertido del demo
  catcher, difficulty 5 (default). La intro del evento explica los controles
  entre paréntesis; es la única línea de tutorial del runner.
- Verificación: la primera partida automatizada llegó al Outro por timer antes de
  probar controles; la segunda se jugó con los 4 controles, sufrió colisiones
  reales ("Muro del vecino -50") y terminó en Outro con puntaje 1280.

---

## Fase 3 — Narrativa v2

**Objetivo:** que el outro cuente mejor qué pasó, con ejemplos y la frase del día.

**Precondiciones:** gate de Fase 2 verde.

**Tareas:**

1. `outro v2` en tipos/esquema: `quote` opcional ({ text, who }) trazable a una
   source, y `moments` opcional (lista de momentos concretos con emoji).
2. Outro: "LA FRASE DEL DÍA" destacada tipográficamente arriba de los facts;
   momentos como línea de tiempo breve. Mantener scroll y regla de fuentes.
3. Actualizar `content/prompts/game-generation.md` para que produzca outro v2.
4. Retro-fit: agregar quote y moments a los eventos existentes (Colapinto:
   "Perdón, perdón, perdón a Pierre"; Supercopa: "Es toda tuya, sos un ladrón").

**Gate para pasar a Fase 4:**

- [x] El outro muestra frase del día + momentos + facts + fuentes, todo scrolleable y sin cortar.
- [x] Cada quote/momento es trazable a una source del mismo JSON.
- [x] `npm run validate` en 0. Commit `poc2-checkpoint-3`.

**Notas de fase 3:**

- La trazabilidad es una barrera automática, no solo editorial: `quote.source` y cada
  `moments[].source` tienen que ser una URL exacta de `outro.sources` y Zod lo valida
  (superRefine) con mensaje legible. Probado en negativo: quote/momento huérfano →
  gamespec inválido. Es la versión pequeña de la lección "checklist mecanizado" de la
  retrospectiva POC 1 (queda pendiente la versión por similitud de texto para facts).
- En el outro, la quote muestra su fuente como link clickeable justo debajo de la
  atribución; los momentos no llevan link individual (queda en el JSON, como los facts).
- demo y demo-search quedaron sin v2 a propósito: prueban el camino opcional (outro
  idéntico al de POC 1, verificado en browser). demo-runner lleva quote ficticia de Capi
  trazada a sus sources placeholder, coherente con su tono.
- Verificación visual: dos eventos desechables de `duration: 1` (runner con v2, catcher
  sin v2) permitieron llegar al Outro en ~1 s y recorrerlo con rueda; borrados después
  del chequeo. El scroll llegó al fondo sin cortar nada y el botón VOLVER A JUGAR siguió
  visible.
- `game-generation.md` quedó actualizado para cualquier motor (decía "si es otra
  mecánica se corta acá", herencia de POC 1): la pasada 2 genera el GameSpec del motor
  elegido según su branch en `src/types.ts`.

---

## Fase 4 — Radar diario + web diaria (auto-draft + aprobación)

**Objetivo:** que el sistema, solo, traiga la actualidad del día y deje todo listo
para una aprobación humana de ~2 minutos; y una web diaria local que lista los
juegos.

**Precondiciones:** gate de Fase 3 verde.

**Tareas:**

1. `content/prompts/radar-diario.md`: prompt de radar (fetch de portadas/feeds →
   candidatos crudos con fuentes).
2. Script `scripts/radar.mjs` (o flujo equivalente de la sesión): busca, arma el
   análisis por evento y produce un **draft** con Event + 3 pitches. Nunca publica.
3. Flujo de aprobación: el draft se presenta en sesión; la respuesta humana
   (evento + pitch) dispara la generación del GameSpec con los prompts existentes.
   Documentado como runbook en `docs/runbook-diario.md` (pasos exactos de una
   jornada tipo: radar → aprobar → generar → validar → agregar a la web).
4. Web diaria: `scripts/build-index.mjs` genera un `index.html` estático desde
   `content/`: cards por juego (título, emoji/avatar, duración, fecha) que enlazan
   a `?game=<id>`. Script npm: `npm run index`.
5. Automatización programada del radar (cron del entorno), con el draft esperando
   aprobación. Sin aprobación, no se genera juego.

**Gate para pasar a Fase 5:**

- [ ] Un día simulado completo: radar produce draft → humano aprueba → juego generado → aparece en la web diaria sin tocar código.
- [ ] Sin aprobación humana no se publica nada (verificar que el flujo se corta).
- [ ] La web diaria abre local y lista los juegos con sus avatares/theming.
- [ ] Commit `poc2-checkpoint-4`.

---

## Fase 5 — Cierre: dos jornadas completas + retrospectiva

**Objetivo:** validar POC 2 entera produciendo dos jornadas de verdad.

**Precondiciones:** gate de Fase 4 verde.

**Tareas:**

1. Dos jornadas punta a punta con el runbook (radar → aprobación → juego → web),
   cronometradas en `produccion.md` de cada evento. Objetivo: jornada completa
   (no un evento) en menos de 60 min de humano.
2. Un evento de la jornada en un motor nuevo (search o runner) con theme + avatar.
3. `docs/retrospectiva-poc2.md`: ¿llama la atención más que antes? (mostrar
   pantallas a alguien y comparar), ¿search/runner cubren las noticias que
   catcher/dodge no cubrían?, ¿el auto-draft ahorra de verdad?, ¿qué sigue?
4. Decisión explícita sobre deploy (la fase opcional de abajo) documentada en la
   retrospectiva.

**Gate de cierre de POC 2:**

- [ ] Dos jornadas completas producidas con el pipeline nuevo.
- [ ] Una persona externa juega la web diaria local sin explicación: elige un juego, juega, lee el outro.
- [ ] `npm run validate` + `npm run index` en 0. Commit `poc2-checkpoint-5` + tag `poc-2`.

---

## Fase opcional — Deploy (si se decide)

Única fase nueva necesaria para publicar: hosting estático de `dist/` + `content/`
(todo es client-side), tarjetas OG por juego para compartir, y `npm run index` como
paso de build. Sin backend, sin cambios en el motor. El día que se decida "llegar a
gente", es ~1 sesión.

---

## Decisiones que faltaban (defaults tomados — cambiar antes de arrancar)

1. **Sin deploy en POC 2.** Decisión explícita: se valida local; el deploy queda
   como fase opcional documentada.
2. **Avatares por IA en build-time, con fallback emoji.** El costo es una vez por
   evento; el runtime sigue siendo estático.
3. **Violencia = caricatura.** Escrita en `linea-editorial.md` para que la
   automatización la herede.
4. **Auto-draft, nunca auto-publicar.** La elección editorial sigue siendo humana
   (principio 9 del spec): el radar prepara, la persona decide.
5. **Search y runner antes que fighter.** Fighter es la más atractiva pero la más
   cara (animaciones, IA enemiga, balance); entra en una POC 3 si search/runner
   funcionan.
6. **Outro v2 es aditivo y opcional.** Los eventos viejos no se rompen.
7. **Beeps WebAudio, opt-in por GameSpec.** POC 1 decidió sin sonido; acá se permite
   el mínimo que suma al chiste, sin assets.
