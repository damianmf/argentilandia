# Plan de ejecución — POC 3 (fighter y lo que siga)

POC 3 era "motores caros" según PROJECT.md (fighter primero). Se abre el 09/10
por pedido de iteración del humano sobre el evento Talleres–Tucumán. Mismo
formato que POC 2: fases con gate, checkpoint por fase. Los lineamientos de
diseño (tono, acidez, dispositivos, elección de motor) viven en
`docs/lineamientos-del-juego.md`: este plan define en qué orden se construye;
esa biblia define qué se construye.

---

## Fase 0 — Motor fighter (1v1 de caricatura) — HECHA el 09/10

**Objetivo:** quinto motor: pelea 1 contra 1 vista de lado, piñas de caricatura,
rival IA simple. El motor no conoce la noticia.

1. `fighter` en la unión discriminada: `player` vs `rival` (dos `PlayerSpec` con
   avatar propio), `crowd` (emojis de hinchada de fondo, opcional), `koHits`
   (piñas para ganar), `punchPoints` / `hitPenalty`.
2. `src/scenes/Fighter.ts`: movimiento (←→ o mouse), piña (espacio o click) con
   cooldown, reach y knockback; IA que persigue, respeta distancia y pega por
   probabilidad; estrellitas ⭐💥, tint de golpe, screen shake; tres finales con
   headline ("¡TROMPADA FINAL!", "TE ROMPIERON LA CAMISETA", "SE TERMINÓ EL
   TIEMPO").
3. Tabla de dificultad fighter: velocidad del rival, agresión (piñas/segundo en
   rango), cooldown del rival.
4. Title con los dos peleadores enfrentados (solo para fighter).

**Gate:**
- [x] `npm run validate` con el evento convertido (Talleres–Tucumán) en 0.
- [x] Partida completa en browser: Title → pelea con piñas conectadas → Outro con headline.
- [x] Los otros cuatro motores siguen funcionando (schemas y ruteo intactos).

**Notas de fase 0:**
- Sin animaciones cuadro a cuadro: la piña es un tween de estirada + partículas.
  La regla de cero assets se mantiene; los SVG son poses fijas (una por
  personaje), el "golpe" lo pone el código.
- El rival se espeja con `setFlipX` (si es Text de emoji, se saltea: los emojis
  ya miran al frente).
- Balance de arranque d5: jugador pega cada 600 ms; rival 210 px/s, pide pelea
  1 piña/segundo esperado con cooldown 950 ms; koHits 10. Pendiente de playtest
  humano como todos los recalibres.
- **Iteración "sonido visible" (09/10, pedido del humano: impacto para gente
  con tema de oído):** onomatopeyas de historieta por evento (¡DING DING! al
  arrancar, ¡PUM!/¡ZAS!/¡TROMPA!/¡BAM! al conectar, rojo al recibirla, ¡FIU! al
  fallar, 🧑‍⚖️ ¡PIIIII! con silbato al cierre), hit-stop de 75 ms, flash de
  pantalla (blanco al conectar, rojo al recibir) y la hinchada rebota en cada
  golpe. Audio sintetizado nuevo sin assets: thud con pitch aleatorio, campana
  y silbato de árbitro (trill WebAudio). El texto y los emojis son los assets:
  la capa accesible es la misma que la capa de impacto. Pendiente: exportar las
  onomatopeyas a los otros cuatro motores.

---

## Fase 1 — Motor kick (propuesta, no empezada)

**Objetivo:** sexto motor para los chistes del homenaje a Messi que quedaron en
el tintero: apuntar/patada con temporizador.

- Mecánica: barra o flecha oscilante; un click fija ángulo (o potencia); la
  pelota sale en un arco; el chiste configurable por JSON es a dónde va a parar.
  Para PATEÓ CON LA DERECHA: el drone apunta a la zurda y el pie que patea es el
  derecho (la pelota sale al revés).
- JSON: objetivo, desvío del chiste, premios/aciertos, tries, difficulty.
- Segundo chiste candidato (drones dibujando y Messi mirando): requiere adivinar
  el dibujo del drone (ronda de "¿qué es?") o input de dibujo libre (toy, no
  juego). Decidir antes de construir: la versión "adiviná" encaja en un search
  variante y no necesita motor nuevo.

**Precondición:** cerrar el gate de POC 2 (dos jornadas + retrospectiva) o
decidir explícitamente que POC 3 convive con ese cierre.
