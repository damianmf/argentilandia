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
  dodge(): void {
    blip(620, 0.06, 'triangle', 0.07);
  },
  crash(): void {
    blip(140, 0.18, 'sawtooth', 0.16);
  },
  end(): void {
    blip(660, 0.1, 'square', 0.1);
    window.setTimeout(() => blip(440, 0.18, 'square', 0.1), 110);
  },
  punch(): void {
    blip(90 + Math.random() * 70, 0.12, 'sawtooth', 0.22);
  },
  bell(): void {
    blip(1250, 0.35, 'sine', 0.12);
    window.setTimeout(() => blip(1250, 0.35, 'sine', 0.12), 280);
  },
  whistle(): void {
    trill();
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

function trill(): void {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoAmp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 2350;
  lfo.frequency.value = 26;
  lfoAmp.gain.value = 0.05;
  amp.gain.setValueAtTime(0.07, ctx.currentTime);
  amp.gain.setValueAtTime(0.07, ctx.currentTime + 0.5);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
  lfo.connect(lfoAmp).connect(amp.gain);
  osc.connect(amp).connect(ctx.destination);
  osc.start();
  lfo.start();
  osc.stop(ctx.currentTime + 0.75);
  lfo.stop(ctx.currentTime + 0.75);
}
