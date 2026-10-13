# Lineamientos del juego — la biblia de diseño

Documento vivo: define qué es un juego de este proyecto y con qué reglas se hace.
Cada decisión nueva de tono, mecánica o formato entra acá. Lo que se arregla acá,
se arregla para siempre. Fuentes de verdad complementarias: `src/types.ts` (shapes),
`content/prompts/linea-editorial.md` (humor), `docs/runbook-diario.md` (operación),
`plan-poc3.md` (roadmap de motores).

---

## 1. Qué es este juego

Minijuegos satíricos de la actualidad argentina, diarios, de 20 segundos
(recalibre 12/10; search 30–45): la noticia del día se convierte en mecánica,
se juega deformándola, y el outro la cuenta con fuentes. El jugador se va con
el chiste **y** con el dato real.

## 2. El medidor de acidez

La acidez es una perilla, no un clima. Todo evento nuevo declara su nivel antes
de pensar mecánicas:

| Nivel | Qué significa | Ejemplos publicados |
|---|---|---|
| 🟢 Verde | Sarcasmo de club de barrio; literalizar el titular sin nombrar poder | EL FRENITO INFINITO (el tren que no frena) |
| 🟡 Amarillo | Crítica dura con datos incómodos como objetos; poder público como muñeco | SE ARMÓ LA PIÑA (la arbitrariedad arbitral), PÉGUELE, SEÑORES (33% sin cloacas como blanco) |
| 🔴 Rojo — nunca | Víctimas reales, grupos vulnerables como chiste, odio, vida privada, ensañarse con personas | (los descartes de cada radar: Maradona, aluviones, silla de ruedas como blanco) |

Regla del amarillo alto: **cuanto más ácido el mensaje, más verificable el dato**.
La silla de ruedas de PÉGUELE, SEÑORES es el ejemplo de casa: aparece, es
`noTouch`, y el juego te cobra −2000 si le pegás — el límite del remate se
muestra y se cobra; el grupo vulnerable nunca es el chiste.

## 3. Dispositivos de la casa (la gramática)

1. **El chiste jugable obligatorio**: literalizar la metáfora del noticiero.
   Pitch sin chiste jugable claro se rehace, no se aprueba.
2. **El objeto-dato**: los hechos incómodos de la nota son objetos del juego
   ("Orden de compra '23" +200, "33% sin cloacas" −200). El loot cuenta la nota,
   como premio (el dato que "salva") y como obstáculo (el dato que cobra).
3. **La frase del día**: cita textual trazable (Zod la barra si no). Viaja dentro
   de la tarjeta COMPARTIR.
4. **El muñeco de atributos**: cargos públicos en ejercicio = símbolos del cargo
   (banda, patillas), nunca foto ni rostro. Fuera del cargo: roles genéricos.
5. **Latiguillos regionales** (`punchWords`/`rivalWords`): si el evento enfrenta
   identidades, cada lado grita en su idioma. Es contenido del GameSpec.
6. **Onomatopeyas + hit-stop + hinchada**: el sonido se hace visible; el golpe
   pesa. (Pendiente: exportar de fighter/whack al resto.)
7. **El veredicto compartible**: puntaje con nombre ("Brazo derecho de Laucha",
   "Rematador Mayor del País") + tira de emojis del fight. La gente comparte
   títulos, no números.

## 4. Catálogo de motores — noticia → mecánica

| Motor | Cuando la noticia es... | Juego de referencia |
|---|---|---|
| `catcher` | algo cae/se ofrece: agarrar lo bueno, esquivar lo malo | (demo; reemplazado en AySA) |
| `dodge` | esquivar un peligro que viene | BAKÚ SIN FRENO |
| `search` | una auditoría: encontrar los X entre mucho ruido | (demo; libre para eventos) |
| `runner` | una fuga/una carrera sin control | EL FRENITO INFINITO |
| `fighter` | dos lados que se chocan; diferenciación por camiseta | SE ARMÓ LA PIÑA |
| `whack` | golpear lo que brota, con mensaje insistente y un noTouch | PÉGUELE, SEÑORES |
| `decide` | una gestión de gobierno: cada opción cobra y el veredicto resume | GOBERNÁ LA ARGENTINA (demo-decide) |
| `kick` (pendiente) | apuntar y errar: el tiro que sale mal | (propuesto: drone de Messi) |

Elección: la mecánica es la literalización del titular. Si dos motores la cuentan,
gana el que el catálogo no repitió últimamente.

## 5. El circuito viral

Enganchar sin clic (attract mode) → jugar 45 s → resultado con veredicto
compartible (tira + frase del día) → revancha en un tap → récord local y PRO
como desafío transferible. Pendiente de decisión: deploy + tarjetas OG (con eso
el share pasa de texto a link).

## 6. Reglas duras (no se negocian)

- Todo hecho del outro trazable a fuente linkeada; quote/momentos los barra Zod.
- Nada sale sin `npm run validate` en 0; la web no se genera con specs inválidos.
- Full-auto: ante duda editorial, no se genera. Un día vacío es válido.
- Antes de deploy: volver a modo con aprobación humana (runbook).
- Los ajustes de calidad van a los prompts y a este documento, nunca a mano en
  los JSON de eventos ya publicados.

## 7. Cómo se trabaja

Fases con gates (`plan-poc3.md`), jornada diaria (`docs/runbook-diario.md`),
iteración del humano sobre lo producido (jugar la web, ajustar prompts). Los
gates pendientes de POC 2 Fase 5 (dos jornadas medidas + una persona externa
jugando sin explicación + retrospectiva) alimentan este documento con evidencia.

## 8. Registro de decisiones de tono

- 08/10 — Full-auto para iterar; aprobación humana vuelve antes de deploy.
- 09/10 — Medidor de acidez formalizado (PÉGUELE, SEÑORES es el techo actual del
  amarillo). Silla de ruedas = `noTouch`, no blanco.
- 09/10 — Muñecos de carga pública autorizados por atributos (banda/patillas),
  nunca foto ni rostro; primer caso: Milei rematador.
- 09/10 — Latiguillos regionales como contenido del GameSpec.
- 12/10 — Duración: reflejos a 20 s, search 30–45 (probado por el humano).
- 12/10 — **Máxima picantez como base del prompting, no importa el lado**
  (calibración en linea-editorial.md; el único freno es el rojo, no el bando).
  El dodge exige `prizes`: todo motor de reflejos tiene que tener algo que
  agarrar — esquivar quieto no es un juego.
