# Retrospectiva — POC 1

Cierre de la POC 1 (fases 0–4). Tres juegos validados con Zod: demo (catcher
ficticio), BAKÚ SIN FRENO (dodge, Colapinto en Bakú) y EL ROBO DEL AÑO (catcher,
escándalo de la Supercopa).

## ¿H1 sostiene? — Una noticia puede convertirse consistentemente en un juego simple

**Sostiene con matices.** El pipeline convirtió 3 de 3 eventos intentados (demo +
2 reales) en juegos jugables punta a punta sin tocar el motor, y el filtro de
jugabilidad (gameability >= 7 + fuente) descartó de manera útil: los eventos
rechazados (FMI, Lali, Milei–Lula, Formosa) eran efectivamente malos candidatos.
Lo que **no está verificado** es la mitad "divertido" de H1: falta el tester
externo que juegue sin explicación previa y el dato de rejuego. La conversión es
consistente; la diversión, pendiente de medir.

## ¿H2 sostiene? — Una mecánica genérica se vuelve interesante contextualizada

**Sostiene, con una condición confirmada.** El mismo dodge genérico ("esquivá
cosas que caen") se vuelve reconocible cuando los obstáculos son Gasly, el Safety
Car y la pared de Bakú; el catcher solo suma sentido cuando el punchline está en
los objetos ("Medalla pa' Verón", el árbitro juntando trofeos que él mismo "robó").
La condición es el riesgo 1 de PROJECT.md: el contexto vive en **objetos, etiquetas
y premisa**, no en el título. Un catcher con emojis random de la noticia no
contextualiza nada. El riesgo es real y el pitch tiene que seguir defendiéndolo.

## ¿Qué mecánica sigue y por qué?

**Search (búsqueda/minesweeper).** Razones:

1. **Cubre la clase de noticia más frecuente del día argentino que hoy no tenemos:**
   escándalos, coimas, "apareció el documento", expedientes, lo político-económico.
   El día de prueba (26/09) el mejor candidato no deportivo fue el pago al FMI:
   "encontrá los dólares escondidos" es un juego; "esquivá la inflación" es un dodge
   genérico.
2. **Es la más barata de implementar:** grilla + clic + revelado, sin física en
   tiempo real ni colisiones. Menor riesgo que fighter (que necesita animaciones,
   IA enemiga y balance) y que runner (que necesita obstáculos compuestos).
3. **Varía el ritmo:** catcher y dodge son lo mismo con el signo invertido (atrapar
   vs evitar); search es la primera mecánica que no es de reflejos, y eso teste si
   el formato general sobrevive a otra familia de interacción.

Runner y fighter quedan para después: fighter es la más atractiva para el usuario
final pero la más cara en contenido (diálogos, balance, dos personajes), y conviene
hacerla cuando el pipeline ya produzca eventos sin cuellos de botella.

## ¿Qué del pipeline romper primero?

1. **Búsqueda de actualidad (mayor costo humano: ~40% del tiempo).** Hoy es un
   humano leyendo portadas. Automatizar el radar: fetch de portadas/feeds →
   lista de candidatos crudos para el event-analysis. Es el paso con mejor
   relación esfuerzo/ahorro.
2. **Verificación de la regla de fuentes.** Hoy es manual y fact por fact. Un
   script que chequee que cada fact del outro tenga similitud con el texto de
   alguna source (o al menos un checklist mecanizado) convierte la regla editorial
   más importante en una barrera automática.
3. **Defaults aprendidos dentro del prompt de generación.** `difficulty: 5`,
   pesos y rangos de puntos ya no son decisiones por evento: moverlos al prompt
   (ya está parcialmente) y a un default del esquema.

No romper todavía: distribución/deploy (necesita la decisión de producto), sonido,
mobile ni la automatización de la elección editorial (el criterio del spec es
explícito: la selección es humana en la POC).

## Números de producción

- Evento 1 (Colapinto): ~110 min estimados, inflado por construir el motor dodge.
- Evento 2 (Supercopa): ~47–57 min reales, sin una línea de código.
- El objetivo de PROJECT.md ("el segundo debe bajar a menos de la mitad") se cumple.

## Calibración de dificultad (Fase 4)

- El evento real salió con `difficulty: 7` a ojo y resultó duro: a 7 hay pares de
  obstáculos consecutivos imposibles de esquivar (distancia > lo que el jugador
  cruza entre spawns). Recalibrado a `5` y **5 pasa a ser el default de arranque**
  de todo evento nuevo; se ajusta solo con playtest en contra.
- La tabla de dificultad no se tocó: el problema era la elección del valor, no la
  interpolación.
- La validación automática de dificultad (jugador bot por CDP) se intentó y se
  abandonó: el entorno headless de esta máquina cuelga `Runtime.evaluate` después
  de navegar. El playtest humano es el gate.
