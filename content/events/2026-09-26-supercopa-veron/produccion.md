# Producción — EL ROBO DEL AÑO (2026-09-26-supercopa-veron)

Segundo evento punta a punta, **cronometrado en caliente** (sesión del 27/09).
Primera medición real del pipeline. Objetivo de PROJECT.md: bajar a menos de la
mitad del primer evento (~110 min estimados).

| Etapa | Minutos | Notas |
|---|---|---|
| Búsqueda de actualidad | ~20 | Web + portadas del día; 4 candidatos evaluados, 2 descartados por umbral (FMI sin humor, Lali sin conflicto jugable) |
| event-analysis | ~5 | Aplicación directa del prompt; scores: virality 10 / gameability 9 / humor 9 / share 9 |
| Elección editorial (humano) | ~2 | Elección por opciones: evento Central/Verón + pitch catcher |
| GameSpec | ~20 | Verificación de fuentes (TyC + Olé, fetch completo) y escritura de event.json + gamespec.json con regla de fuentes |
| Ajustes / playtest | ~10 (estimado) | Pendiente de playtest humano al cierre; se ajusta esta fila si aparece algo |
| **Total** | **~47–57** | Motor ya existente (catcher): sin código, solo contenido |

## Notas

- El ahorro real frente al evento 1 no es "hacerlo más rápido": es que **no se
  escribió ni una línea de código** (la hipótesis de Fase 3 que se había roto al
  elegir dodge).
- La dificultad salió con el default aprendido en Fase 4 (`5`), no a ojo.
- La regla de fuentes ya salió verificada de fábrica: cada fact está copiado del
  artículo correspondiente, sin pasadas extra.
