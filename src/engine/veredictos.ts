import type { GameSpec } from '../types';

// Chips de veredicto por motor: la semilla de comentario a un tap. El juego
// puede traer los suyos (ranking.chips, los genera el pipeline); si no, cae a
// estos genéricos del motor.
const CHIPS_POR_MOTOR: Record<GameSpec['game'], string[]> = {
  catcher: ['Manos de sopera', 'Agarré todo lo que brillaba', 'El special me destrozó'],
  dodge: ['Esquivé la corrida entera', 'El pánico me comió igual', 'Esquivar quieto ya no alcanza'],
  search: ['Encontré todo sin gastar toques', 'Tocaba donde no era', 'Olfato de auditor'],
  runner: ['Frené como el tren', 'Llegué con la lengua afuera', 'Salto limpio, caída dudosa'],
  fighter: ['Dueño del alambrado', 'Me trompearon con estilo', 'La piña vino sola'],
  whack: ['Martillazo limpio', 'Le piqué a todo', 'El noTouch me tentó'],
  decide: ['Gestión impecable', 'Renuncié en la cuarta crisis', 'El país ficticio bancó mi gestión'],
};

export function chipsDeVeredicto(spec: GameSpec): string[] {
  const propios = spec.ranking?.chips;
  if (propios && propios.length > 0) return propios.slice(0, 6);
  return CHIPS_POR_MOTOR[spec.game];
}
