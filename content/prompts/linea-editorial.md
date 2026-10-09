# Línea editorial — humor, violencia y avatares

Documento normativo del proyecto. Todo prompt de generación (event-analysis,
game-generation, radar-diario, avatar-generation) hereda estas reglas. La sátira va
a las **situaciones**, nunca a las personas.

## Humor que SÍ

- **Sarcasmo y ironía rioplatense**: el tono de boín de club de barrio, la exageración
  afectuosa, el "pobre tipo" en vez del escrache.
- **Absurdo y literalización del chiste**: los trofeos caen del cielo, el árbitro junta
  sobres, la pared de Bakú persigue autos. Convertir la metáfora del noticiero en
  mecánica literal es el chiste por defecto del proyecto.
- **Violencia de caricatura**: piñas con estrellitas, trompadas, humo, caídas cómicas,
  choques con repelú. Estilo Tom y Jerry o El Chavo: el golpe hace reír porque no
  lastima a nadie real ni visible.
- **Lado B del protagonista**: al ídolo se lo puede meter en la situación ridícula
  (que Franco choque contra paredes, que el árbitro junte trofeos), siempre que la
  broma sea sobre la situación y no sobre la persona.

## Humor que NO

- **Sangre, lesiones graves o tragedias con víctimas reales**: nada de muertes,
  heridos, enfermedad, duelos. Si el evento tiene víctimas, no es jugable: se descarta
  en el análisis, antes de pensar mecánicas.
- **Ensañarse con personas concretas**: no hay insultos, apodos denigratorios ni burlas
  sobre el cuerpo, la familia o la vida privada de nadie. "Verón enojado" es un emoji;
  "Verón es un..." no existe.
- **Odio o discriminación** de cualquier tipo (xenofobia, machismo, política como
  piedra de hidro), ni chistes que requieran odiar a alguien para funcionar.
- **Ficción presentada como hecho**: la separación juego/outro es sagrada; el outro
  dice siempre qué parte es invento (regla de fuentes de PROJECT.md).

## Personajes de carga pública (decisión 09/10)

Quien ejerce un **cargo público electo, actuando en su rol público**, puede
aparecer como **muñeco de atributos**: la tradición de la caricatura política
argentina (Landrú, Nik, Caras y Caretas).

1. **Atributos, nunca rostro**: el personaje se reconoce por símbolos del cargo y
   rasgos icónicos de caricatura (banda presidencial, patillas, uniforme,
   motosierra). Prohibido reproducir el rostro real o usar fotos.
2. **La sátira va a la política, no a la persona**: se satiriza la medida, el
   acto, la situación de gobierno. Nunca la vida privada, el cuerpo ni la familia.
3. **Sin insultos ni ensañamiento**: el muñeco puede ser ridículo por la situación
   (rematador, cantor, corredor), no por degradación de la persona.
4. **Fuera del cargo público o en hecho privado**: rige el no-likeness de siempre
   (deportistas, vecinos, víctimas: roles genéricos, no retratos).
5. En el `outro.fiction` se aclara siempre que el muñeco es la caricatura del
   cargo, y qué parte es exageración satírica versus hecho confirmado.

## Reglas para la generación de avatares

Los avatares son **caricaturas de situación, no retratos de la persona**:

1. **No hacer likeness**: nada de reproducir el rostro real de una persona
   reconocible. Se caricaturiza el rol, el uniforme o la situación: el casco, la
   camiseta, el salacot del juez, la banda presidencial. Si quitando el nombre ya
   no se reconoce a la persona, la broma es de la situación: correcto.
2. **Cabeza grande, cuerpo chico, emoción clara**: estilo sticker/caricatura,
   gesto exagerado (enfado, pánico, euforia) que cuente el chiste sin texto.
3. **Una emoción por avatar**, coherente con el rol del personaje en el juego:
   el jugador puede estar concentrado o en pánico; el villano, enojado.
4. **Paleta plana, fondo transparente o sólido**: cero degradados complejos, cero
   texto dentro de la imagen (el nombre lo pone el HUD). Debe verse a 64 px.
5. **Violencia permitida**: moretones de caricatura, turbina humeante, estrellas
   girando. Nunca sangre, armas reales ni sufrimiento realista.
6. **Formato y ubicación**: un archivo por evento, guardado en
   `content/events/<id>/avatar.svg` (o .png), referenciado en el GameSpec como
   `player.image` con ruta relativa al `gamespec.json` (ej.: `"avatar.svg"`).
   Sin avatar, el motor usa el emoji: nunca se rompe.
