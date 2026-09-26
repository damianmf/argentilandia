# Plan de ejecución — POC 1 (catcher)

Plan operativo por fases. El contexto del proyecto (concepto, decisiones, modelos Event/GameSpec, riesgos) vive en `PROJECT.md`; este archivo solo define qué se construye, en qué orden y cómo se valida cada etapa.

## Cómo ejecutar las fases

Cada fase corre en una ventana/sesión independiente. Prompt sugerido para abrir cada sesión:

> Leé PROJECT.md y plan.md. Ejecutá únicamente la Fase N. Respetá las convenciones globales. Al terminar, corré el gate de la fase; si pasa, marcá los checkboxes y hacé el commit del checkpoint. No avances a la siguiente fase.

Reglas para toda sesión de ejecución:

- Respetar `.zproject.rtf`: respuestas concisas, sin comentarios en el código.
- Leer solo: `PROJECT.md`, `plan.md`, `src/`, `content/`, `docs/`, configs. Nunca `node_modules/`.
- Si algo no está definido en este plan, decidir lo más simple y anotarlo en "Notas de fase" de esa fase, no inventar definiciones nuevas de esquema.
- Al cierre de fase: tildar checkboxes, commit `checkpoint-<N>`.

## Convenciones globales (todas las fases)

| Tema | Definición |
|---|---|
| Stack | Vite + TypeScript + Phaser 3, sin backend. npm, no pnpm |
| Canvas | 960×600 horizontal, escala `FIT` con letterbox. Desktop primero (el producto mobile es una decisión futura) |
| Tipografía | System font stack. Sin archivos de fuentes |
| Sonido | Sin sonido en POC 1 |
| Controles | ←→ del teclado y posición X del mouse. Sin touch por ahora |
| Fin del juego | Solo por timer (`duration`). El puntaje puede ser negativo y se muestra igual |
| Selección de juego | `index.html?game=<id>` carga `content/events/<id>/gamespec.json`. Default: `demo`. Sin router |
| Idioma | Español rioplatense en toda la UI y el contenido |
| Regla de fuentes | Todo `fact` del outro debe ser trazable a una `source` del mismo JSON. Aplica desde Fase 3; el demo usa URLs placeholder |
| Git | Repo local, un commit `checkpoint-<N>` por fase |

---

## Fase 0 — Esqueleto técnico

**Objetivo:** proyecto que corre, GameSpec demo que valida, pantalla título renderizada desde el JSON.

**Precondiciones:** ninguna.

**Tareas:**

1. `git init`, `.gitignore` (`node_modules/`, `dist/`), commit inicial.
2. Scaffold Vite (`vanilla-ts`) + `npm i phaser zod`.
3. `src/types.ts`: `Event` y `GameSpecCatcher` según PROJECT.md (unión discriminada por `game`; por ahora solo el branch `catcher`). Incluye tipos de soporte: `CatchObject`, `Outro`, `SourceRef`.
4. `src/schemas.ts`: esquemas Zod espejo + `parseGamespec(json)` que devuelva error legible (campo faltante y path del JSON).
5. `scripts/validate.mjs`: recorre `content/events/*/gamespec.json`, valida con Zod, `exit 1` listando errores. Script npm: `npm run validate`.
6. `content/events/demo/gamespec.json`: evento claramente ficticio (ej. "Los capybaras toman Nordelta"), con todos los campos completos incluido `outro`.
7. `src/main.ts`: boot Phaser, lee `?game=`, fetch del JSON, `parseGamespec`; si falla → pantalla de error con el mensaje (nunca pantalla en blanco).
8. `src/scenes/Title.ts`: título, emoji, duración estimada e `intro` leídos del GameSpec + botón JUGAR. Nada hardcodeado.

**Entregables:** `index.html`, `src/main.ts`, `src/types.ts`, `src/schemas.ts`, `src/scenes/Title.ts`, `scripts/validate.mjs`, `content/events/demo/gamespec.json`, `package.json` con scripts `dev` y `validate`.

**Gate para pasar a Fase 1:**

- [x] `npm run validate` termina en 0.
- [x] `npm run dev` muestra la pantalla título del demo con título/emoji/duración/intro tomados del JSON.
- [x] Editar el `title` en el JSON y recargar → cambia en pantalla (prueba de que no hay nada hardcodeado).
- [x] Sacar un campo requerido del JSON → pantalla de error legible, no blanca.
- [x] Commit `checkpoint-0`.

**Notas de fase:**

- No había Node en la máquina: instalado Node v24.21.0 en `~/.local/node` (binario oficial, PATH en `~/.zshenv`).
- `validate.mjs` importa `src/schemas.ts` directamente (Node ≥23.6 transforma TS nativo); no hay esquemas duplicados.
- `SourceRef`: `title`+`url` obligatorios, `outlet`/`type` opcionales, cubre Event y outro con un solo tipo.
- Pantalla de error: overlay DOM, no escena Phaser (el error puede ocurrir antes del boot).
- JUGAR en Fase 0 muestra un aviso en pantalla; en Fase 1 pasa a la escena Catcher.
- `phaser@3.90` y `typescript@5` fijados por la convención de stack (npm trajo Phaser 4 / TS 7 por defecto).

---

## Fase 1 — Mecánica catcher

**Objetivo:** jugar los `duration` segundos de punta a punta con puntaje.

**Precondiciones:** gate de Fase 0 verde.

**Tareas:**

1. `src/engine/difficulty.ts`: tabla 1–10 → `fallSpeed` / `spawnInterval` / `goodRatio` (la de PROJECT.md), interpolación lineal, clamp.
2. `src/scenes/Catcher.ts`: jugador (emoji del GameSpec), movimiento ←→ y mouse, clamp a bordes.
3. Spawner: cae un objeto cada `spawnInterval`; elección ponderada por `weight` entre catch/avoid/special; respetando `goodRatio` global por dificultad. Caen a `fallSpeed`.
4. Colisión: sumar/restar `points` según objeto. HUD: puntaje + tiempo restante.
5. Feedback mínimo: flash/escala del objeto atrapado. Sin partículas ni assets.
6. `src/scenes/GameOver.ts` (placeholder de esta fase): puntaje final + botón REINTENTAR → Title. En Fase 2 este placeholder es reemplazado por Outro.
7. Ajustar pesos del demo si algo resulta ilegible.

**Entregables:** `src/engine/difficulty.ts`, `src/scenes/Catcher.ts`, `src/scenes/GameOver.ts`.

**Gate para pasar a Fase 2:**

- [ ] Checklist jugable (~1 min): se mueve con teclado Y mouse; bueno suma, malo resta, especial resta más; el juego termina solo a los `duration` s; REINTENTAR reinicia el loop completo.
- [ ] Con `difficulty: 1` vs `difficulty: 10` en el demo, se nota a simple vista la diferencia de velocidad y densidad.
- [ ] `npm run validate` en 0.
- [ ] Commit `checkpoint-1`.

**Notas de fase:** —

---

## Fase 2 — Outro "¿qué pasó realmente?"

**Objetivo:** loop completo título → jugar → outro, con el motor agnóstico de la noticia.

**Precondiciones:** gate de Fase 1 verde.

**Tareas:**

1. `src/scenes/Outro.ts` reemplaza a GameOver en el flujo: puntaje final arriba, luego secciones `¿QUÉ PASÓ REALMENTE?` (whatHappened), `¿Qué sabemos?` (bullets de facts), `¿Qué es ficción?` (fiction), `Fuentes:` (links clickeables, abren en pestaña nueva).
2. Contenido scrolleable si excede el canvas (no cortar texto).
3. Botón VOLVER A JUGAR → Title, sin recargar la página.
4. Eliminar `GameOver.ts`.

**Entregables:** `src/scenes/Outro.ts`, flujo actualizado en `main.ts`.

**Gate para pasar a Fase 3:**

- [ ] Loop completo: JUGAR → 45 s → outro con puntaje → VOLVER A JUGAR → título. Sin recargar.
- [ ] Los links de fuentes usan las URLs del JSON y abren al clickear.
- [ ] Agregar al demo un `fact` de dos líneas → el outro scrollea y no se corta.
- [ ] `npm run validate` en 0. Commit `checkpoint-2`.

**Notas de fase:** —

---

## Fase 3 — Primer evento real

**Objetivo:** una noticia del día convertida en juego jugable, sin tocar código.

**Precondiciones:** gate de Fase 2 verde.

**Tareas:**

1. Escribir `content/prompts/event-analysis.md`: entrada una o más noticias crudas; salida JSON `Event` con los 6 scores (actualidad, jugabilidad, humor, reconocibilidad, shareability, explicabilidad); umbral `gameability >= 7` + al menos una fuente.
2. Escribir `content/prompts/game-generation.md`: entrada `Event`; salida 3 pitches (catcher + 2 mecánicas candidatas) y, elegido uno, el `GameSpec` catcher completo con `outro` bajo la regla de fuentes.
3. Buscar actualidad argentina del día (3–5 candidatos), aplicar el umbral.
4. Presentar al usuario: Events que pasaron + 3 pitches del elegido. **Única intervención humana de la fase: elegir evento y pitch.**
5. Generar `content/events/<YYYY-MM-DD-slug>/event.json` y `gamespec.json`.
6. Verificar regla de fuentes: cada fact del outro es trazable a una source del mismo JSON.
7. `npm run validate` + playtest; anotar problemas en notas de fase.

**Entregables:** los dos prompts, `content/events/<id>/` completo (event.json, gamespec.json, links de las noticias usadas).

**Gate para pasar a Fase 4:**

- [ ] `npm run validate` en 0 con el nuevo evento.
- [ ] `?game=<id>` carga el juego nuevo sin tocar una línea de código.
- [ ] Checklist editorial: título/intro/objetos son reconocibles como la noticia; los facts del outro no repiten la ficción del juego; las fuentes abren y efectivamente hablan del hecho.
- [ ] Regla de fuentes verificada fact por fact.
- [ ] Commit `checkpoint-3`.

**Notas de fase:** —

---

## Fase 4 — Cierre y medición

**Objetivo:** dificultad calibrada con juego real y primer número de costo de producción.

**Precondiciones:** gate de Fase 3 verde.

**Tareas:**

1. Playtest de dificultad con el evento real: ajustar `difficulty` del evento; si el problema es la tabla (y no el evento), ajustar tabla y documentar el cambio en PROJECT.md.
2. Segundo evento punta a punta cronometrado: `content/events/<id2>/produccion.md` con minutos por etapa (búsqueda, event-analysis, elección, gamespec, ajustes).
3. Retrospectiva en `docs/retrospectiva-poc1.md`: ¿H1 sostiene?, ¿H2 sostiene?, ¿qué mecánica sigue y por qué?, ¿qué del pipeline romper primero?

**Entregables:** dos eventos jugables, dos `produccion.md`, retrospectiva.

**Gate de cierre de POC 1:**

- [ ] Una persona externa a la sesión juega los dos juegos sin explicación previa: entiende qué hacer, termina, y lee el outro.
- [ ] Minutos de producción de ambos eventos anotados.
- [ ] `npm run validate` en 0. Commit `checkpoint-4` + tag `poc-1`.

**Notas de fase:** —

---

## Definiciones que faltaban (defaults tomados — cambiar los que se quiera antes de arrancar)

1. **Canvas 960×600 horizontal.** Desktop primero porque la validación local es en máquina; la orientación mobile es decisión futura.
2. **Sin sonido.** Si el humor lo pide, se agrega en Fase 4 con beeps generados (sin assets).
3. **Fin solo por timer; puntaje negativo permitido.** Es más satírico terminar en rojo que morir.
4. **`?game=<id>` con default `demo`.** Es lo mínimo para soportar varios juegos sin router.
5. **Git local con commit por checkpoint.** Sin esto no hay seguimiento entre sesiones.
6. **GameOver placeholder en Fase 1, reemplazado por Outro en Fase 2.** Evita bloquear la Fase 1 sin la pantalla final definitiva.
7. **La regla de fuentes aplica desde Fase 3.** El demo es ficción declarada y usa URLs placeholder.
8. **Puntaje, no vidas.** No hay condición de derrota antes de tiempo en esta POC.
