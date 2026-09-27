# Producción — BAKÚ SIN FRENO (2026-09-26-colapinto-baku)

Primer evento real de la POC. **No se cronometró en su momento**: la Fase 3 no tenía
la medición como tarea. Estos números son una reconstrucción estimada post-facto,
marcados como tales. El evento 2 (supercopa-veron) sí se midió en caliente y sirve
de comparación real.

| Etapa | Minutos (estimado) | Notas |
|---|---|---|
| Búsqueda de actualidad | ~20 | 3–5 candidatos del día, descartes por umbral |
| event-analysis | ~15 | Primera vez corriendo el prompt, incluyó ajustar el criterio de mapeo de scores |
| Elección editorial (humano) | ~10 | 3 pitches presentados y discutidos |
| GameSpec | ~45 | No fue solo el JSON: el pitch elegido fue dodge y **el motor dodge no existía**. Incluyó tipos, esquema Zod, escena y routing |
| Ajustes / playtest | ~20 | Playtest completo en navegador + verificación de regla de fuentes fact por fact |
| **Total** | **~110 (estimado)** | Inflado por construir un motor nuevo |

## Lecciones que alimentan el evento 2

- Elegir una mecánica ya implementada es la diferencia entre ~110 y ~45 minutos.
- La dificultad `7` salió "a ojo" y resultó dura (recalibrada a `5` en Fase 4).
- El outro y la regla de fuentes, una vez aprendidas, no vuelven a costar lo mismo.
