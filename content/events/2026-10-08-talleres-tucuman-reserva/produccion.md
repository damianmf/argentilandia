# Producción — SE ARMÓ LA PIÑA (2026-10-08-talleres-tucuman-reserva)

Este evento tuvo dos versiones. La primera (09/10 temprano) fue **LA ROJA
EQUIVOCADA (search)**, generada con la dupla aprobada en sesión. En la iteración
de la tarde, el humano pidió para Talleres un juego de piñas con los equipos
diferenciables: 1 contra 1 estilo pelea de caricatura. Ese pedido activó el
motor `fighter` (reservado para POC 3 por PROJECT.md) y esta versión lo
**reemplaza** en el catálogo: mismo evento, mismo outro verificado, nueva
mecánica.

| Etapa | Notas |
|---|---|
| Fuente | Nota de La Nación leída completa (radar 08/10) |
| Versión 1 | search "LA ROJA EQUIVOCADA" (validada y publicada el 09/10 a la madrugada) |
| Iteración | Pedido humano: "piñas y diferenciar a los del equipo" → motor fighter |
| Versión 2 | fighter "SE ARMÓ LA PIÑA": azul vs rojo, koHits 10, difficulty 5 |
| Iteración sonido visible (09/10) | onomatopeyas + hit-stop + flash + hinchada que rebota + thud/campana/silbato sintetizados (motor, no JSON) |
| Iteración latiguillos (09/10) | `punchWords` cordobeses (¡AQUÍ NO!, ¡ARRÉ!, ¿VIJO?, ¡NI GARRÓN!) y `rivalWords` norteños (¡ANDÁ PA' ALLÁ!, ¡CHANGUITO!, ¡CUMPA!, ¡CHAMUYO!): lo que grita cada lado al conectar es contenido del GameSpec |

## Notas

- **Diferenciación por camiseta, no por caras**: los peleadores son caricaturas
  de kit (azul/blanco vs rojo/blanco), roles sin likeness. Los labels bajo las
  barras de "ánimo" refuerzan quién es quién ("El azul de Talleres" vs "El rojo
  del Decano").
- **La violência es 100% de caricatura**: estrellitas ⭐💥, knockback, screen
  shake y "piña recibida". La batalla real del alambrado (sillazos, médico
  golpeado) NO se representa: el outro la cuenta sin chiste y la ficción lo
  aclara. Los peleadores no son los hermanos Acosta ni nadie real.
- El chiste del Joaquín equivocado sobrevive en el outro y en la intro (la
  revancha es "por lo que pasó"); la quote de Lautaro Acosta sigue siendo la
  frase del día.
- Motor fighter: primer slice de POC 3 (escena + schema + tabla de dificultad
  propia). Balance de arranque: rival d5 = velocidad 210, agresión 1.0/s,
  cooldown 950 ms; el jugador pega cada 600 ms. koHits 10. Se recalibra con
  playtest (misma doctrina que dodge en d7 y runner en d10).
