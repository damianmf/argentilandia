# Producción — EL FRENITO INFINITO (2026-10-08-emergencia-ferroviaria)

Primer evento producido con el pipeline de la Fase 4 (radar → draft → aprobación →
juego → web). **Jornada simulada**: la aprobación la dio la sesión para el gate de la
fase, etiquetada como tal en el draft; la primera jornada real con humano aprobador
son las dos de la Fase 5.

| Etapa | Minutos | Notas |
|---|---|---|
| Radar (`npm run radar`) | ~1 | 90 titulares, 5/5 feeds |
| Análisis + draft (radar-diario.md) | ~15 | 3 notas leídas completas, 6 descartes duros |
| Aprobación humana | (simulada) | Evento + pitch 1 (runner) |
| Generación del juego | ~20 | event.json, gamespec, avatar SVG, produccion |
| Validación + web | ~2 | `npm run validate` + `npm run index` |
| **Total de trabajo humano** | **~38 (sin contar aprobación)** | Objetivo de Fase 5: jornada < 60 min |

## Notas

- El pitch ganador literaliza el titular: "el tren sin frenos" es un runner.
- Los obstáculos salen de los hechos de la nota (bolsos, expedientes, avisos de
  suspensión); el premio más raro es la orden de compra de 2023 que recién se emitió
  en 2025.
- La frase del día es del propio Decreto 312/2026 (fuente oficial citada por Ámbito):
  primera quote del proyecto trazable a documento oficial.
- Alternativas del draft que pasaron el umbral y quedaron sin juego: piñas de la
  Reserva (Talleres–Tucumán) y fallas del homenaje a Messi.
