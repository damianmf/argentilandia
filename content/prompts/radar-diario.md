# Prompt: radar-diario

Paso 2 del pipeline diario de POC 2 (ver `docs/runbook-diario.md`). Entrada:
`content/radar/<fecha>/candidatos.md`, generado por `scripts/radar.mjs` (titulares
crudos con fuentes). Salida: `content/radar/<fecha>/draft.md` con el análisis del día.

**Regla madre: el radar prepara, la persona decide. Este paso NUNCA escribe en
`content/events/` ni genera GameSpec. Sin aprobación humana explícita del draft
(paso 3 del runbook), no se genera ningún juego.**

Línea editorial: heredá [linea-editorial.md](linea-editorial.md) completa. Criterios
y umbral: los de [event-analysis.md](event-analysis.md). Pitches: forma de la pasada 1
de [game-generation.md](game-generation.md).

## Instrucciones

1. Leé `content/radar/<fecha>/candidatos.md` y preseleccioná hasta 5 titulares con
   potencial (actualidad + chiste visible + reconocible para un argentino).
2. Para cada preseleccionado, evaluá los 6 criterios del spec (actualidad,
   jugabilidad, humor, reconocibilidad, shareability, explicabilidad), cada uno 1–10.
   Aplicá el umbral completo: `gameability >= 7` (con apoyo de explicabilidad),
   fuente real en la lista de candidatos, línea editorial (si hay víctimas reales,
   se descarta antes de pensar mecánicas).
3. Del mejor candidato que pase el umbral, leé la nota (fetch de la URL) y extraé:
   los **hechos verificados** (lo que la fuente afirma explícitamente, nada inferido)
   y si existe la **frase del día**: una cita textual exacta, entre comillas en la
   nota, con potencial de repetirse en todos los chats. Si la fuente no la dice
   textual, no hay quote (es opcional).
4. Escribí `content/radar/<fecha>/draft.md` con exactamente esta estructura:

```
# Draft radar — <YYYY-MM-DD>
ESTADO: ESPERANDO APROBACIÓN

> Sin aprobación humana no se genera ningún juego (docs/runbook-diario.md, paso 3).
> Respondé en la sesión con: evento + pitch elegido.

## Evento recomendado

{JSON `Event` completo, mismo shape de event-analysis.md, con fuentes reales}

## Pitches (elegir uno)

1. **<motor> — <nombre>**: <el chiste jugable, 4 líneas máximo>
2. ...
3. ...

## Descartes

- [<titular>](<url>) — <razón en 1 línea, con el score que falló si aplica>
```

5. Presentá el draft completo en la sesión y terminá tu turno ahí. No continúes.

## Reglas

- **Nunca publicar**: ni este paso ni la automatización que lo corre generan
  GameSpec, ni crean directorios en `content/events/`, ni tocan la web diaria.
- Fuentes: solo URLs que estén en `candidatos.md` o verificadas al leer la nota
  (mismo outlet). No inventar URLs ni fechas: la regla de fuentes de PROJECT.md
  aplica al `Event`, no solo al outro.
- Los pitches proponen motores ya implementados (catcher, dodge, search, runner,
  fighter). Un pitch sin chiste jugable claro se rehace, no se aprueba.
- Si ningún candidato pasa el umbral, el draft se escribe igual con
  `ESTADO: SIN CANDIDATOS`, la lista de descartes con razones, y ningún Event.
  Un día sin juego es un resultado válido del radar.
- Español rioplatense en todos los campos de texto.
