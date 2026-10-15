# Producción — 2026-10-15-quorum-121-de-129

- **Modo:** headless **local sin key** (Etapa 2, transporte degradado): `npm run
  jornada` fallaría en el draft por falta de `LLM_API_KEY`; la sesión ZCode
  ejecutó los pasos LLM con los mismos contratos JSON que la API de GLM, según
  la sección "Modo sin key" de `docs/runbook-diario.md`.
- **Nota:** el backend de veredictos no respondió (error Cloudflare 1042 al
  pedir el resumen del juego del 14/10); el draft corrió sin la señal editorial
  de los jugadores, como contempla el contrato.
- **Variedad:** ayer fue economy + whack (IPC tomate); hoy politics + catcher,
  ambos permitidos. El 13/10 no hubo jornada.
- **Pitch elegido (scoreChiste 9):** catcher — JUNTÁ EL QUÓRUM. Sos el encargado
  de quórum de la oposición: atrapás diputados que caen del techo mientras
  esquivás el "control remoto" (Yasky, Perfil), el "toma y daca", la banca que
  "firmó y no vino" (Zigarán, Infobae) y la "ausencia clave" (−200, el titular
  de Infobae como objeto). El número real (121 de 129) es el marco del ranking.
- **Candidatos:** 3 variantes (catcher 9, dodge 7.5, search 7.25), las 3 pasaron
  el checklist (umbral: ningún criterio < 6, promedio >= 7). Ganó la variante 1
  con promedio 9. Veredictos en `scores.json`.
- **Duración:** 20 s (contrato del 12/10 para motores de reflejos). Dificultad 5.
- **Frase del día:** "la lógica del toma y daca" — Hugo Yasky, en Modo
  Fontevecchia, minutos antes de la sesión (Perfil, textual, trazable a
  `outro.sources` por la barrera Zod).
- **Línea editorial:** el blanco es el parlamento como feria de volúmenes (la
  silla y la maniobra, no personas). La emergencia en discapacidad y la marcha
  universitaria entran solo como contexto serio del outro, jamás como target.
  El encargado de quórum es un personaje genérico: nadie de carne y hueso en la
  mira (declarado en `outro.fiction`).
- **Avatar:** paramétrico (`scripts/generar-avatar.mjs`): encargado de quórum de
  traje, cara de pánico y bandera blanca (el desenlace real de la jornada).
  Sin SVG a mano.
- **Selección editorial del día:** `content/radar/2026-10-15/seleccion.json`
  (3 preseleccionados con 6 criterios, 16 descartes con razón, acidez 🟡 alta).
- **Iteración del humano (15/10 tarde):** el outro se enriqueció con el "qué se
  juega": qué derogó el DNU y qué volvería si caía (alquileres a 3 años,
  prepagas, góndolas PyME, compre nacional, ley de tierras), el telón de los
  fallos encontrados de la Corte, el rechazo previo del Senado (marzo 2024: por
  eso bastaba Diputados) y el aire que ganó el Gobierno (PASO + Presupuesto
  2027). Fuente nueva: explainer de Infobae del 2/10 ("Qué leyes volverían a
  regir si Diputados deroga el DNU 70"). Los objetos-juguete del juego no
  cambian: las etiquetas satirizan el mecanismo, sin nombres de personas.
- **Fix permanente en prompts:** `radar-diario.md` ahora exige en la llamada B
  el fact "qué se juega" (qué está en disputa y a quién cambia la mano, con
  fuente) cuando la historia es una pulseada normativa. Lo que se arregla en el
  prompt se arregla para siempre.
- **Segunda jornada candidateada:** el 21/10 el oficialismo trata la
  Inviolabilidad de la Propiedad Privada con los arts. 38/39 (le copa la
  bandera de tierras a la oposición). Si la historia sigue, pide motor `decide`
  (sin usar en producción): "EL TOMA Y DACA" — sos el gobernador que cobra por
  las ausencias. Giro ya declarado: hoy jugó el que junta y pierde; mañana, el
  que cobra.
