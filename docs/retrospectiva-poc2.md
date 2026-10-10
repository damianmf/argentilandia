# Retrospectiva — POC 2 (cierre 09/10)

POC 2 fue: impacto visual + variedad de motores + automatización del diario.
Cierre con el modo FULL-AUTO decidido el 08/10 (producir sin aprobación humana;
el humano itera sobre lo producido; la aprobación vuelve antes de deploy).

## Qué se construyó

- **Fase 0**: thema por evento, avatares SVG de caricatura, portada con
  punchline, beeps WebAudio opt-in.
- **Fases 1-2**: motores `search` y `runner` (más tarde `fighter` y `whack`
  por POC 3, que conviven sin romper nada).
- **Fase 3**: outro v2 — frase del día y momentos, trazabilidad forzada por Zod.
- **Fase 4**: radar diario (`radar.mjs`, 5 feeds) + draft editorial + web diaria
  (`build-index.mjs`) + cron de las 9:00.
- **Iteraciones del 09/10 (POC 3 abierta)**: fighter 1v1 (piñas con camisetas),
  sonido visible (onomatopeyas + hit-stop + hinchada), latiguillos regionales,
  muñecos de carga pública, circuito viral (COMPARTIR + récord + PRO + attract +
  revancha), motor `whack` con `noTouch`.

## Las preguntas del cierre

**¿Llama la atención más que antes?** Sí por construcción, con evidencia
anecdótica: en POC 1 el producto era un catcher genérico con emojis; hoy el
catálogo tiene 6 motores, portadas themadas con avatares caricatura, sonido y
portadas que ya se están peleando solas (attract mode). El playtest externo del
09/10 (reportado por el humano: OK, el externo jugó) cierra el gate; la
observación estructurada queda para el próximo round de playtests, para
alimentar `docs/lineamientos-del-juego.md` con datos y no con intuiciones.

**¿Search/runner cubren las noticias que catcher/dodge no cubrían?** Sí y de
más: el tren salió runner (literalizar "no frena"), las piñas fighter (dos
lados), el remate whack (golpear lo que brota). `search` quedó sin evento real
(solo demo): su caso natural es la auditoría (desperfectos, errores de cálculo) y
hasta hoy ningún titular lo pidió con fuerza. Queda listo en el catálogo.

**¿El auto-draft ahorra de verdad?** Sí. La jornada del 08/10 (tren) quedó en
~38 min de trabajo humano sin aprobación, dentro del objetivo de <60. El radar
trae ~90 noticias en un minuto, y la línea editorial filtró solas las notas
intocables (Maradona, aluvión, fusilamiento) antes de pensar mecánicas. El
cuello de botella real no es el radar: es la generación del GameSpec (todavía
asistida en sesión). Ahí apunta la automatización futura.

**¿Qué calidad produce solo, y qué arregla el humano después?** El pipeline
solo produce: radar completo, draft con scores y descartes razonados, validación
Zod, web y commit. Lo que sigue necesitando humano: la picardía fina (elegir el
primer chiste y no el segundo), el tono ácido (el medidor de lineamientos lo
ordenó, pero el techo lo fija una persona) y el playtest de dificultad.

## Qué falló y queda aprendido

1. **Catcher no muestra labels en juego**: mató el chiste del Joaquín equivocado
   y forzó el engine swap a search. Lección: el mensaje vive en las etiquetas;
   motor sin etiquetas visibles sirve solo si los emojis hablan solos.
2. **El decor pisa el título** (Fase 0, reincidente en el homenaje de Messi con
   la luna): los emojis de decoración con caja opaca van fuera del título,
   siempre.
3. **Dificultad sin playtest es hipótesis**: fighter d5 rival está duro (gana si
   el jugador se queda quieto); whack responde al spam con su propio sistema
   (noTouch −2000, verificado con el bot). Calibrar jugando, como siempre.
4. **Los límites editoriales se mecanizan, no se declaman**: silla de ruedas
   como `noTouch` (el juego cobra la falta), descartes del radar por línea
   editorial, Zod barriendo quotes huérfanas.

## Década de decisión pendiente: deploy

Diferido explícitamente hasta que el humano traiga los próximos pasos (09/10).
Cuando se decida: hosting estático de `dist/` + `content/`, tarjetas OG por
juego, restaurar aprobación humana antes de publicar. Es ~1 sesión.

## Qué sigue

Backlog vivo en `plan-poc3.md` (kick, cinemática de KO + papelitos, recalibres)
y los puntos que trae el humano para armar la próxima etapa. Todo juego nuevo se
hace dentro de los lineamientos (`docs/lineamientos-del-juego.md`).
