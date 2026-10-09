# Producción — LA ROJA EQUIVOCADA (2026-10-08-talleres-tucuman-reserva)

Segundo evento real del catálogo y primero generado con la dupla de títulos proyectada
en sesión el 09/10. Aprobación humana real: el humano eligió la dupla
(piñas Reserva + homenaje de Messi) sobre las alternativas del radar del 08/10.

| Etapa | Notas |
|---|---|
| Fuente | Nota de La Nación leída completa (radar 08/10, refresco 20:35) |
| Pasada 1 (pitches) | En sesión 09/10; el humano aprobó el pitch del Joaquín equivocado |
| Pasada 2 (GameSpec) | search, difficulty 5, avatar SVG, validación Zod |

## Notas

- Motor elegido **search** y no catcher (lo proyectado en la conversación fue al
  revés): `Catcher.ts` no renderiza labels durante el juego (solo emoji) y el
  chiste del Joaquín equivocado necesita etiquetas visibles; `Search.ts` muestra
  label + puntos en cada casillero revelado. El homenaje de Messi (el otro de la
  dupla) tomó el catcher: sus emojis son autoexplicativos y el chiste vive en
  título + intro + outro.
- El chiste central es literalizar el dato duro: la falta fue de Salas, la roja
  fue para Soria. Tocar la trampa "Soria, el inocente" es cometer el error del
  árbitro real (pierdes un toque).
- La frase del día es textual de Lautaro Acosta a TyC Sports, citada por La Nación.
- Línea editorial: la batalla campal real (médico golpeado con una silla) quedó
  **fuera del juego** y se cuenta sin broma en el outro; el humor es la
  arbitrariedad del árbitro, no la pelea. Las piñas de caricatura no aparecen
  siquiera: no hacen falta para el chiste.
- El árbitro Ibáñez Mesa no tiene likeness: el avatar es la caricatura del rol
  (uniforme negro, silbato, roja en la mano, cara de pánico).
