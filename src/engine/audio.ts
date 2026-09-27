let ctx: AudioContext | null = null;
let enabled = false;

export function initAudio(specEnabled: boolean): void {
  enabled = specEnabled;
  if (!enabled) return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

export const sfx = {
  catch(): void {
    blip(880, 0.07, 'square', 0.1);
  },
  crash(): void {
    blip(140, 0.18, 'sawtooth', 0.16);
  },
  end(): void {
    blip(660, 0.1, 'square', 0.1);
    window.setTimeout(() => blip(440, 0.18, 'square', 0.1), 110);
  },
};

function blip(freq: number, duration: number, type: OscillatorType, gain: number): void {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}
