# Runbook — jornada diaria (POC 2)

Pipeline: **radar (auto) → análisis (auto) → aprobación (humana, ~2 min) →
generación → validación → web**. Sin aprobación no se publica nada.

Requisitos: Node 24+ (los scripts leen TypeScript con type stripping nativo) y red
para el radar. Todo lo demás es local, sin backend.

## 0. Automático: radar + draft (9:00)

La automatización **"Radar diario — todos los días a las 9:00"** (cron del entorno,
ajustable desde la página Automations) corre:

1. `npm run radar` → `content/radar/<fecha>/candidatos.md`: titulares crudos con
   fuente de 5 feeds argentinos (Clarín, La Nación, Infobae, Ámbito, Perfil).
   Tolerante a feeds caídos; si ninguno responde, corta con error y no escribe nada.
2. El paso 2 con `content/prompts/radar-diario.md` →
   `content/radar/<fecha>/draft.md` con el evento recomendado + 3 pitches y
   `ESTADO: ESPERANDO APROBACIÓN`. El draft se presenta en la sesión y el turno
   termina ahí.

Si no había nadie mirando, el draft queda esperando: se retoma en el paso 2.

## 1. Radar a mano (opcional)

```bash
npm run radar            # hoy; o: npm run radar 2026-10-09
```

Y en una sesión: "Leé PROJECT.md, plan-poc2.md y content/prompts/radar-diario.md;
procesá content/radar/<fecha>/candidatos.md y escribí el draft."

## 2. Aprobación humana (~2 min)

Abrí `content/radar/<fecha>/draft.md`: evento recomendado (JSON con fuentes),
3 pitches y descartes con razones. Respondé en la sesión con **evento + pitch**
elegidos, o pedí cambios, o elegí una de las alternativas que pasaron el umbral.

**Sin este paso no hay paso 3.** Para verificar el corte: no existe
`content/events/<id-del-draft>` y `npm run index` no lista nada nuevo.

## 3. Generación del juego

Con la aprobación dada, en la misma sesión: se marca el draft
`ESTADO: APROBADO — evento <id>, pitch N` y se aplica la pasada 2 de
`content/prompts/game-generation.md` al evento, creando `content/events/<id>/`:

- `event.json` (el del draft)
- `gamespec.json` (motor del pitch elegido, `difficulty: 5` de arranque)
- `avatar.svg` según `content/prompts/avatar-generation.md` (opcional; sin avatar
  el motor usa el emoji)
- `produccion.md` (tiempos y notas de la jornada)

## 4. Validación y web diaria

```bash
npm run validate   # todos los gamespecs en 0 (Zod; barra quote/moments huérfanos)
npm run index      # regenera web/index.html; falla si algún gamespec es inválido
npm run dev        # y abrir http://localhost:5173/web/index.html
```

La card nueva tiene que estar en la web sin tocar código: avatar o emoji, motor,
duración, fecha. Clic en la card abre `?game=<id>` y el juego carga.

## 5. Cierre de jornada

Commit del día: `content/radar/<fecha>/`, `content/events/<id>/` y `web/index.html`.
El objetivo de Fase 5 es jornada completa en menos de 60 minutos de humano.

## Reglas duras

- El radar y el draft **nunca** escriben en `content/events/` ni tocan la web.
- Sin aprobación humana explícita no hay generación (principio del spec: la
  elección editorial es humana; el radar prepara, la persona decide).
- Regla de fuentes de PROJECT.md: todo fact/quote/momento trazable a una source
  del mismo JSON. Zod barra quote/moments huérfanos; los facts siguen siendo
  chequeo manual (lección de Fase 3).
- Dificultad de arranque `5` para todo evento nuevo; se calibra con playtest.
- Si ningún candidato pasa el umbral, `ESTADO: SIN CANDIDATOS`: día sin juego es
  un resultado válido, no se fuerza nada.
