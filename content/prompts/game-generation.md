# Prompt: game-generation

Pipeline manual POC 1. Entrada: un `Event` que ya pasó el umbral (`content/events/<id>/event.json`).
Salida: 3 pitches, y luego (elegido uno) el `GameSpec` catcher completo en JSON.

## Instrucciones

Sos el diseñador del proyecto "Juego de la Actualidad Argentina". Recibís un `Event` y
tenés que proponer cómo convertirlo en minijuego satírico.

### Pasada 1 — pitches

Tres pitches, uno por mecánica candidata:

1. **Catcher** (siempre): algo cae, el jugador agarra lo bueno y esquiva lo malo.
2. Alternativa 1: otra mecánica del spec (fighter, runner, dodge, search).
3. Alternativa 2: otra mecánica distinta de la 2.

Cada pitch, en 4 líneas máximo, tiene que definir **el chiste jugable** (riesgo 1 de
PROJECT.md): qué es el jugador, qué agarra/esquiva y dónde está el punchline. No sirve
"un catcher con emojis de la noticia": el punchline tiene que estar en los objetos, las
etiquetas y la premisa. Cero producción de assets: solo emojis + formas + etiquetas.

Presentá los 3 pitches y esperá la elección humana. No generes GameSpec sin elección.

### Pasada 2 — GameSpec

Con el pitch elegido, generá el `GameSpec` completo del motor elegido con exactamente
el shape de su branch en `src/types.ts` (acá el ejemplo con catcher):

```json
{
  "game": "catcher",
  "title": "<GRITOS EN MAYÚSCULAS, corto>",
  "emoji": "<2 emojis: tema+jugador>",
  "duration": 45,
  "intro": "<1-2 líneas en rioplatense que planteen la premisa del chiste>",
  "player": { "emoji": "<1 emoji>", "label": "<quién es, con humor>" },
  "catch": [
    { "emoji": "...", "label": "...", "points": 100, "weight": 3 }
  ],
  "avoid": [
    { "emoji": "...", "label": "...", "points": -50, "weight": 2 }
  ],
  "special": [
    { "emoji": "...", "label": "...", "points": -200, "weight": 1, "effect": "none" }
  ],
  "difficulty": 5,
  "outro": {
    "whatHappened": "<lo que pasó de verdad, 3 líneas>",
    "quote": {
      "text": "<cita textual exacta, con el gancho del evento>",
      "who": "<quién la dijo y en qué contexto, breve>",
      "source": "<url EXACTA de una source de abajo>"
    },
    "moments": [
      { "emoji": "<1 emoji>", "text": "<momento concreto del hecho real, 1 línea>", "source": "<url EXACTA de una source de abajo>" }
    ],
    "facts": ["<hecho verificado 1>", "<hecho verificado 2>"],
    "fiction": "<qué exagera o inventa el juego>",
    "sources": [{ "title": "...", "url": "...", "outlet": "...", "type": "..." }]
  }
}
```

## Reglas

- **Regla de fuentes (obligatoria)**: cada `fact` del `outro` debe ser trazable a una
  `source` del mismo JSON. Copiá a `outro.sources` las fuentes del `event.json` que
  respaldan los facts. Si un hecho no tiene fuente, no entra al outro.
- **LA FRASE DEL DÍA (`outro.quote`)**: una cita textual EXACTA que alguien dijo de
  verdad en el evento — la que se va a repetir mañana en todos los chats. Nunca
  parafrasear: si la fuente no la dice textual, no hay quote (es opcional y puede
  faltar). `who` es breve y concreto ("Verón, en la cancha, al árbitro"). `source`
  tiene que ser, carácter por carácter, una URL de `outro.sources`: el validador
  rechaza quotes sin trazabilidad.
- **`outro.moments`**: 2–4 momentos concretos del hecho real, en orden cronológico,
  cada uno con un emoji y su `source` trazable a `outro.sources` (misma regla del
  validador). Son la cronología que el jugador acaba de deformar, no chistes: el
  humor ya pasó en el juego.
- `outro.facts` no repite la ficción del juego: son el hecho real que el jugador acaba de
  deformar. `outro.fiction` nombra explícitamente qué parte del juego es invento.
- `outro.sources` no usa placeholders (eso era solo para el demo): URLs reales.
- Etiquetas (`label`) cortas: máximo ~22 caracteres, se leen en pleno juego.
- **Latiguillos regionales (solo fighter, `punchWords`/`rivalWords`)**: si el evento
  enfrenta identidades regionales claras (provincias, ciudades), cargá 3–4 gritos
  autóctonos por lado, cortos, en mayúsculas, afectuosos (slang sí, insulto a nadie).
  Lo grita el lado que conecta la piña: `punchWords` es el jugador, `rivalWords` el
  rival. Si no hay identidad regional, omití los campos: el motor cae a las
  onomatopeyas genéricas (¡PUM!, ¡ZAS!).
- **Whack (`targets`/`noTouch`)**: los blancos del martillo son el mensaje — cada
  uno lleva su `label` visible mientras brota, así que etiqueta = titular. El dato
  incómodo puede ser target (pegarle es el chiste: el martillo "borra" el problema).
  `noTouch` es lo que NO se remata: aparece con la advertencia a la vista y pega
  fuerte si lo golpean (ej. silla de ruedas −2000). Grupos vulnerables jamás son
  targets: van en `noTouch` o no entron.
- Pesos sugeridos: `catch` 2–3, `avoid` 2, `special` 1. Puntos positivos 50–150,
  negativos −30 a −200 (el special pega más fuerte).
- `duration` 30–90 s. `difficulty` arranca en `5` (default de POC 2) y se calibra
  jugando.
- Todo el texto en español rioplatense, sin insultos a personas reales: la sátira se
  lleva a las situaciones y los objetos, no a los actores.
