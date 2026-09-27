# Prompt: avatar-generation

Genera el avatar caricatura del personaje de un evento y lo deja listo para el
GameSpec. Corre **una vez por evento**, en build-time: el runtime solo consume el
archivo estático. Reglas de estilo y de qué se puede burlar: ver
[linea-editorial.md](linea-editorial.md) (sección avatares).

## Entrada

- `content/events/<id>/event.json` (actores, conflicto) y el `gamespec.json`
  (quién es el `player` del juego, qué emoción le corresponde).

## Instrucciones

1. Identificá el personaje del `player` y su rol en el chiste (ej.: el piloto que
   choca, el árbitro que "roba"). El avatar caricaturiza **la situación, no a la
   persona**: casco, uniforme, herramienta, gesto. Nada de likeness facial.
2. Generá la caricatura en formato vectorial (SVG, 160×160, fondo transparente,
   paleta plana, sin texto dentro de la imagen) con una emoción clara y exagerada.
   Debe leerse a 64 px de alto.
3. Guardala como `content/events/<id>/avatar.svg`.
4. En el `gamespec.json` del evento, agregale al player la ruta relativa:
   `"player": { "emoji": "🏎️", "label": "...", "image": "avatar.svg" }`.
   El emoji queda como fallback: si el archivo no existe o el navegador falla,
   el motor usa el emoji y nada se rompe.

## Cómo se generó en POC 2 (método usado)

Los avatares de esta POC se escribieron a mano como SVG por la sesión (caricatura
plana, sin likeness). Cuando haya un generador de imágenes por IA disponible, este
prompt se usa igual: misma entrada, misma regla editorial, misma salida
(`avatar.svg` o `.png` de ~160 px en el directorio del evento).

## Checklist antes de cerrar

- [ ] Sin rostro reconocible de persona real.
- [ ] Sin sangre, armas realistas ni sufrimiento realista.
- [ ] Sin texto dentro de la imagen; se entiende a 64 px.
- [ ] El juego carga con avatar y también carga si se borra el archivo (fallback emoji).
