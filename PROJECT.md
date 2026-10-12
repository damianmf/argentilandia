# Juego de la Actualidad Argentina — Plan inicial de POC

Spec fuente: `init.spec.rtf`. Este documento es el plan vivo; lo que no está acá, no existe todavía. Los lineamientos de diseño del juego viven en `docs/lineamientos-del-juego.md`.

## Decisiones tomadas (2026-09-26)

| Tema | Decisión |
|---|---|
| Primer entregable | Rebanada vertical: 1 mecánica (catcher) + 1 evento real + post-juego informativo |
| Arte | Emoji + formas + etiquetas de texto. Cero producción de assets |
| LLM | Manual: prompts corridos en sesión ZCode, selección editorial humana |
| Distribución | Solo local. Métricas de compartir/retorno diferidas hasta deploy |
| Validación de hechos | Diferida: el outro lo redacta la IA directo de las fuentes; validación manual recién cuando la POC funcione |

## Decisiones POC 2 (2026-09-27)

El plan por fases vive en [plan-poc2.md](plan-poc2.md). Decisiones tomadas al abrirlo:

| Tema | Decisión |
|---|---|
| Deploy | Diferido explícitamente: POC 2 se valida local; fase opcional al final |
| Personajes | Avatares caricatura por IA en build-time, archivos estáticos por evento, fallback emoji. Runtime client-side |
| Violencia / humor | Línea editorial escrita: caricatura sí (piñas, humo, caídas), víctimas reales y ensañarse con personas, no |
| Motores nuevos | Search y runner (fighter queda para una POC 3) |
| Narrativa | Outro v2: frase del día (cita textual trazable a fuente) + momentos concretos, aditivo y opcional |
| Sonido | Beeps WebAudio sin assets, opt-in por GameSpec |
| Web diaria | `index.html` estático generado desde `content/`, se abre local |
| Automatización | Radar de actualidad auto-draft + aprobación humana obligatoria (nunca auto-publicar) |
| Dificultad | Default de arranque `5` para todo evento nuevo (lección POC 1) |

## Decisión de iteración (2026-10-08)

| Tema | Decisión |
|---|---|
| Automatización | Jornada **FULL-AUTO** durante la iteración de POC 2: el cron de 9:00 produce radar → draft → juego → web → commit sin aprobación humana. La calidad la garantizan las barreras existentes (umbral de jugabilidad, línea editorial, regla de fuentes, validación Zod). Ante duda editorial, no se genera |
| Aprobación humana | Suspendida para iterar; **se reintroduce como obligatoria antes de cualquier deploy** (la fase opcional no arranca sin volver al modo con aprobación del runbook) |
| Fase 5 | Las dos jornadas del cierre se miden como corridas automáticas; el humano itera sobre lo producido (juega la web, lee drafts, ajusta prompts) |

## Decisión de iteración (2026-10-09)

| Tema | Decisión |
|---|---|
| Motor fighter | POC 3 se abre por pedido de iteración: el humano quiere el evento Talleres–Tucumán como juego de piñas con equipos diferenciables. Primer slice: escena 1v1 de caricatura (SVGs por kit, estrellitas, knockback), schema + tabla de dificultad. Las piñas de caricatura pasan del texto editorial a mecánica |
| Gráfica | Se mantiene la regla de cero assets: la "mejor gráfica" es diferenciación (camisetas) + feedback (partículas, shake), que es código, no producción de arte |
| Pendiente | Motor `kick` (apuntar/patada con temporizador) propuesto para los chistes del homenaje a Messi ("errarle con la derecha"); ver plan-poc3.md |
| Personajes públicos | Se autoriza el muñeco de atributos para cargos públicos en ejercicio, actuando como cargo: símbolos del cargo y rasgos icónicos (banda, patillas), nunca foto ni rostro, sátira a la política y no a la persona. Regla escrita en linea-editorial.md; primer caso: SE REMATA EL PAÍS (privatización de AySA) |
| Aprobación humana | Reintroducida el 09/10 (plan POC 3, Etapa 1): el cron de 9:00 corta en el draft esperando el OK (2 minutos). Lo publicado se des-publica con un commit: la web es estática y versionada |
| Deploy | **Sitio vivo** desde el 11/10: https://juego-de-la-actualidad.dami-fontenla.workers.dev (Cloudflare Workers assets, config en `wrangler.jsonc`, deploy por push). El sitio público se ensambla con `npm run build` (dist/ autocontenido: landings OG por juego + tarjetas PNG 1200×630 + content jugable) |
| Automatización Etapa 2 (2026-10-11) | Pipeline **headless full-auto**: los dos pasos LLM (draft y pasada 2) pasan de sesión a scripts (`npm run jornada`: radar → draft → N=3 candidatos autopuntuados contra el checklist → validate → index → commit+push). LLM vía API Z.ai/GLM (`.env`, gitignoreado). Calidad como número: `seleccion.json` (6 criterios por candidato + descartes + acidez) y `scores.json` (veredictos del juez) comparables día a día. **Reemplaza la regla "nunca auto-publicar" de la decisión 09/10**: publica solo con esas barreras; des-publicar = un commit. `APROBACION=on` reactiva el corte humano sin tocar código. Avatares paramétricos (`scripts/generar-avatar.mjs`): muñeco base + atributos, sin arte por evento |
| Iteración usuario (2026-10-12) | Cuatro frentes de una vez: **(1) Portada del día**: el chooser deja de ser un archivo — hero con el juego de la fecha más nueva + carrusel chico con los últimos 7 días; los demos salen de la portada. Criterio de "populares" definido pero diferido: más partidas registradas en 7 días, recién cuando el backend acumule datos (hasta entonces, recencia). **(2) Draft con memoria**: `generar-draft.mjs` inyecta los últimos 2 días de `seleccion.json` (preselección + descartes con scores): un descarte que reaparece puede ganar ("reincidente"), y si el ganador es la misma historia de un juego publicado, se declara `segundaJornada` con giro obligatorio. **(3) Comentarios + ranking (backend D1)**: al terminar, el jugador deja apodo + puntaje + 1 veredicto opcional (un POST a `/api/juegos/<id>/partidas`, Worker con D1, rate limit 6/hora por IP). **Solo el juego más nuevo publicado recibe partidas**: los anteriores quedan como archivo congelado de solo lectura — la moderación es siempre "los veredictos de hoy". El ranking y los veredictos se ven en el Outro; cada `GameSpec` define su marco satírico (`ranking`: título del escalafón + títulos por puesto + unidad). **(4) El loop se cierra**: los veredictos del último juego entran como input al draft del día siguiente (señal editorial, no orden). Configuración del backend: `wrangler login` + `npm run backend:setup` (crea D1, cuelga el worker, aplica schema) + push |

## Entregable Slice 0 — definición de listo

Un catcher jugable en el browser, generado a partir de un evento real:

1. Pantalla título: título del juego, duración, botón JUGAR.
2. Juego de 30–90 s: mover al jugador (←→ / mouse), caen objetos que suman o restan, puntaje y barra de tiempo, pantalla de fin con puntaje.
3. Pantalla "¿QUÉ PASÓ REALMENTE?": resumen, qué es ficción, fuentes con links.
4. Todo el contenido sale de un único `GameSpec` JSON. El motor no conoce la noticia.
5. Costo de producción medido: el primer evento completo toma lo que tome; el segundo debe bajar a menos de la mitad.

## Modelos

### Event (entrada del pipeline)

```json
{
  "id": "2026-09-26-slug",
  "date": "2026-09-26",
  "event": "incidentes después de partido",
  "category": "sports",
  "actors": ["equipo A", "equipo B", "árbitro"],
  "conflict": "pelea",
  "facts": ["hecho verificado 1", "hecho verificado 2"],
  "sources": [
    { "title": "...", "url": "...", "outlet": "...", "type": "media|official" }
  ],
  "virality": 9,
  "gameability": 10,
  "humorPotential": 8,
  "shareability": 9
}
```

Criterio de jugabilidad: el evento pasa al pipeline solo si `gameability >= 7` y existe al menos una fuente que valide los hechos (sección 3 del spec: la sátira exagera, los hechos se trazan).

### GameSpec — unión por `game` (6 motores)

El esquema es una unión discriminada por `game`; la fuente de verdad del shape es
`src/types.ts` y la barrera es `src/schemas.ts` (Zod). Motores activos: `catcher`,
`dodge`, `search`, `runner`, `fighter` (1v1 con `rival`, latiguillos, veredictos) y
`whack` (martillá lo que brota, con `noTouch`). Compartidos: `theme` opcional,
`sound` opcional, `outro` v2 (quote + momentos trazables). Los lineamientos de
diseño (tono, acidez, dispositivos, elección de motor) viven en
`docs/lineamientos-del-juego.md`.

```json
{
  "game": "catcher",
  "title": "AGARRÁ EL SOBRE",
  "emoji": "💰⚖️",
  "duration": 45,
  "intro": "El árbitro tiene que juntar todos los sobres antes de que llegue el VAR.",
  "player": { "emoji": "🧑‍⚖️", "label": "El Árbitro" },
  "catch": [
    { "emoji": "💸", "label": "Sobre", "points": 100, "weight": 3 }
  ],
  "avoid": [
    { "emoji": "⚽", "label": "Pelotazo", "points": -50, "weight": 2 }
  ],
  "special": [
    { "emoji": "📺", "label": "VAR", "points": -200, "weight": 1, "effect": "none" }
  ],
  "difficulty": 7,
  "outro": {
    "whatHappened": "resumen en 3 líneas",
    "facts": ["hecho 1", "hecho 2"],
    "fiction": "qué exagera o inventa el juego",
    "sources": [{ "title": "...", "url": "..." }]
  }
}
```

`difficulty` (1–10) se mapea a parámetros concretos en el motor, una única tabla:

| difficulty | fallSpeed (px/s) | spawnInterval (ms) | ratio buenos |
|---|---|---|---|
| 1 | 120 | 1200 | 0.80 |
| 5 | 260 | 700 | 0.65 |
| 10 | 480 | 350 | 0.50 |

(interpolación lineal entre extremos)

## Prompts (manuales, corridos en sesión)

1. `content/prompts/event-analysis.md` — entrada: una o más noticias del día. Salida: `Event` completo + score de jugabilidad con los 6 criterios del spec (actualidad, jugabilidad, humor, reconocibilidad, shareability, explicabilidad).
2. `content/prompts/game-generation.md` — entrada: `Event`. Salida: 3 pitches (uno por mecánica candidata: catcher siempre + 2 alternativas). Humano elige. Segunda pasada: `GameSpec` catcher completo incluyendo `outro` (el `outro` lo redacta la IA directo de las fuentes citadas; validación manual diferida).

Cada evento procesado vive en `content/events/<id>/`: `event.json`, `gamespec.json`, y las noticias crudas usadas.

## Estructura del proyecto

```
myfirstproject/
├── PROJECT.md            ← este archivo
├── init.spec.rtf         ← spec original (congelado)
├── index.html
├── src/
│   ├── main.ts           ← boot Phaser + carga del GameSpec
│   ├── engine/
│   │   ├── loader.ts     ← valida GameSpec contra el esquema
│   │   └── difficulty.ts ← tabla dificultad → parámetros
│   └── scenes/
│       ├── Title.ts
│       ├── Catcher.ts    ← única mecánica del slice
│       └── Outro.ts      ← "¿qué pasó realmente?"
├── content/
│   ├── prompts/
│   │   ├── event-analysis.md
│   │   └── game-generation.md
│   └── events/           ← un directorio por evento procesado
└── docs/
```

`games/fighter|runner|dodge|search` recién cuando se construyan; no crear carpetas vacías.

## Stack

Vite + TypeScript + Phaser 3. Cero backend, cero base de datos en este slice. SQLite recién con puntajes/reacciones (V2).

## Plan de ejecución

El detalle por fase (tareas, entregables, gate de validación, checkboxes de seguimiento) vive en [plan.md](plan.md) (POC 1) y [plan-poc2.md](plan-poc2.md) (POC 2). Este archivo conserva decisiones, modelos y reglas; los planes, la ejecución.

## Regla mínima mientras no haya validación manual

Todo hecho del `outro` tiene que ser trazable a una fuente linkeada en el mismo JSON. Si la IA no encuentra fuente, el hecho no entra al outro. Sin esa regla, el riesgo de la validación diferida es publicar ficción como hecho.

## Qué se mide en modo local

- Con testers en tu máquina: ¿entienden sin tutorial?, ¿terminan el juego?, ¿rejuegan?, ¿leen el outro?, ¿preguntan por más contexto?
- De producción: tiempo humano por evento, % de eventos que pasan el filtro de jugabilidad.
- Diferidas hasta deploy: shares, clicks en fuentes, retorno al día siguiente.

## Riesgos del slice

1. **Catcher genérico.** Si el punchline no está en los objetos y las etiquetas, el juego es un minijuego cualquiera con emojis. El pitch tiene que definir el chiste jugable, no solo el título.
2. **Fuentes sin validar.** Con la validación manual diferida, la única barrera es la trazabilidad: la regla mínima de arriba es obligatoria. El modo de fallo silencioso es que un hecho inventado termine presentado como real.
3. **Dificultad a ojo.** La tabla 1–10 es una hipótesis; se recalibra jugando, no Diseñando de antemano.
