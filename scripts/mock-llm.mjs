// Servidor LLM de mentira (OpenAI-compatible) para probar el pipeline sin key:
// detecta qué paso le pregunta por los marcadores del system prompt y responde
// JSON canónico (con ruido: cercas de código y saludos) para probar también el
// parser. Uso: node scripts/mock-llm.mjs [puerto]  (default 8787)

import { createServer } from 'node:http';

const puerto = Number(process.argv[2] ?? 8787);

function respuesta(peticion) {
  const todo = peticion.messages.map((m) => m.content).join('\n');
  const fecha = todo.match(/Fecha de hoy: (\d{4}-\d{2}-\d{2})/)?.[1] ?? '2027-01-01';
  const fuente = {
    title: 'Nota de prueba del mock',
    url: 'https://www.infobae.com/economia/2026/10/09/nota-de-prueba-del-mock/',
    outlet: 'Infobae',
    type: 'media',
  };

  // Marcadores por contenido del contrato (extractSection no incluye el encabezado).
  if (todo.includes('"preseleccion"')) {
    return {
      preseleccion: [
        {
          titular: 'El Gobierno remata dos puentes por la mitad del presupuesto',
          url: fuente.url,
          outlet: 'Infobae',
          scores: { actualidad: 9, jugabilidad: 8, humor: 8, reconocibilidad: 7, shareability: 8, explicabilidad: 8 },
          motivo: 'dato duro absurdo y verificable',
        },
        {
          titular: 'Un turista confundió la Casa Rosada con el Museo de Bellas Artes',
          url: 'https://www.perfil.com/noticias/sociedad/turista-casa-rosada-museo.phtml',
          outlet: 'Perfil',
          scores: { actualidad: 6, jugabilidad: 4, humor: 9, reconocibilidad: 7, shareability: 6, explicabilidad: 7 },
          motivo: 'gracioso pero poco jugable',
        },
      ],
      ganador: 1,
      descartes: [
        { titular: 'Renunció un secretario', url: 'https://www.ambito.com/renuncia-secretario.phtml', razon: 'jugabilidad 3: sin mecánica posible' },
      ],
    };
  }

  if (todo.includes('"pitches"')) {
    return {
      acidez: '🟡 amarillo suave — el chiste es el número, dato verificable como objeto',
      event: {
        id: `${fecha}-remate-de-puentes`,
        date: fecha,
        event: 'El Gobierno remató dos puentes por la mitad de su presupuesto',
        category: 'economy',
        actors: ['Gobierno', 'Vialidad Nacional'],
        conflict: 'Puentes rematados a mitad de precio',
        facts: [
          'Dos puentes fueron rematados por el 50% de su presupuesto.',
          'Vialidad Nacional informó que la obra costaba 10 millones y se adjudicó por 5 millones.',
        ],
        sources: [fuente],
        virality: 8,
        gameability: 8,
        humorPotential: 8,
        shareability: 8,
      },
      pitches: [
        { motor: 'catcher', nombre: 'AGARRÁ EL SOBRE', chiste: 'Vialidad junta los sobres del remate antes de que llegue la auditoría.', scoreChiste: 7 },
        { motor: 'whack', nombre: 'REMATE OFFICIAL', chiste: 'Martillazo a los puentes que brotan; el presupuesto que brota es noTouch.', scoreChiste: 9 },
        { motor: 'dodge', nombre: 'ESQUIVÁ EL PRESUPUESTO', chiste: 'El puente esquiva las ofertas que caen; si le pega el precio justo, se cae.', scoreChiste: 8 },
      ],
    };
  }

  if (todo.includes('"gamespec"')) {
    const motor = todo.includes('"motor": "whack"') || todo.includes('whack —') ? 'whack' : 'dodge';
    const spec =
      motor === 'whack'
        ? {
            game: 'whack',
            title: 'REMATE OFFICIAL',
            emoji: '🔨🌉',
            duration: 45,
            intro: 'Brotan puentes rematados: pegale al martillazo antes de que los adjudiquen.',
            player: { emoji: '🔨', label: 'El martillero oficial' },
            grid: { width: 5, height: 3 },
            targets: [
              { emoji: '🌉', label: 'Puente a mitad', points: 100 },
              { emoji: '💰', label: '5 palos verdes', points: 150 },
            ],
            noTouch: [{ emoji: '🚑', label: 'Ambulancia', points: -2000 }],
            whackWords: ['¡REMATADO!', '¡ADJUDICADO!'],
            verdicts: ['Aprendiz', 'Martillero', 'Rematador Mayor del País'],
            difficulty: 5,
            sound: true,
            outro: {
              whatHappened: 'El Gobierno remató dos puentes por la mitad de su presupuesto.',
              quote: { text: 'Se adjudicó por 5 millones', who: 'Vialidad Nacional', source: fuente.url },
              moments: [{ emoji: '🌉', text: 'Dos puentes adjudicados por 5 millones', source: fuente.url }],
              facts: ['Dos puentes fueron rematados por el 50% de su presupuesto.'],
              fiction: 'El martillo no existe: el remate fue con sobres.',
              sources: [fuente],
            },
          }
        : {
            game: 'dodge',
            title: 'ESQUIVÁ EL PRESUPUESTO',
            emoji: '🌉💸',
            duration: 60,
            intro: 'Sos un puente nacional: esquivá las ofertas del remate o te pagan de más.',
            player: { emoji: '🌉', label: 'Puente patriota' },
            obstacles: [
              { emoji: '💸', label: 'Oferta baja', points: -50, weight: 3 },
              { emoji: '📑', label: 'Pliego', points: -80, weight: 2 },
            ],
            difficulty: 5,
            sound: true,
            outro: {
              whatHappened: 'El Gobierno remató dos puentes por la mitad de su presupuesto.',
              quote: { text: 'Se adjudicó por 5 millones', who: 'Vialidad Nacional', source: fuente.url },
              moments: [{ emoji: '💸', text: 'Adjudicados por 5 de 10 millones', source: fuente.url }],
              facts: ['Dos puentes fueron rematados por el 50% de su presupuesto.'],
              fiction: 'Los puentes no esquivan: eso es el juego.',
              sources: [fuente],
            },
          };
    return {
      gamespec: spec,
      avatar: {
        skin: '#f2c89b',
        hair: 'patillas',
        hairColor: '#5a5f6e',
        facial: 'none',
        headgear: 'none',
        torso: 'traje',
        torsoColor: '#232a3d',
        accent: '#74acdf',
        banda: true,
        emotion: 'concentrado',
        prop: 'none',
        propColor: '#8a5a2b',
      },
    };
  }

  if (todo.includes('"chisteJugable"')) {
    return {
      criterios: { chisteJugable: 8, punchline: 7, acidez: 9, fuentes: 8 },
      nota: 'chiste directo, dato verificable, trazabilidad OK',
    };
  }

  return { error: 'el mock no sabe qué responder a esta llamada' };
}

createServer((request, response) => {
  if (request.method !== 'POST') {
    response.writeHead(404).end();
    return;
  }
  let cuerpo = '';
  request.on('data', (chunk) => (cuerpo += chunk));
  request.on('end', () => {
    const peticion = JSON.parse(cuerpo);
    const content = '```json\n' + JSON.stringify(respuesta(peticion), null, 2) + '\n```';
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
}).listen(puerto, () => console.log(`mock-llm escuchando en http://127.0.0.1:${puerto}`));
