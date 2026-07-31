// ============================
// AUDIO ENGINE : Gonfle-Taupe
// Musique d'ambiance procédurale + SFX
// ============================

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicPlaying = false;
let musicTimers: number[] = [];
let musicLoop: number | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.25;
    musicGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.6;
    sfxGain.connect(masterGain);
  }
  return audioCtx;
}

function getSfxGain(): GainNode {
  getAudioContext();
  return sfxGain!;
}

function getMusicGain(): GainNode {
  getAudioContext();
  return musicGain!;
}

// --- Utility tone players ---

function playTone(freq: number, duration: number, type: OscillatorType = 'square', vol = 0.15, dest?: AudioNode) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(dest || getSfxGain());
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_e) { /* ignore */ }
}

function playToneAt(freq: number, duration: number, type: OscillatorType, vol: number, delay: number, dest?: AudioNode) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(dest || getSfxGain());
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (_e) { /* ignore */ }
}

function playNoise(duration: number, vol = 0.08, dest?: AudioNode) {
  try {
    const ctx = getAudioContext();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(dest || getSfxGain());
    source.start();
  } catch (_e) { /* ignore */ }
}

// --- SOUND EFFECTS ---

let lastDigSound = 0;
export function playDigSound() {
  const now = Date.now();
  if (now - lastDigSound < 70) return;
  lastDigSound = now;
  const freq = 180 + Math.random() * 80;
  playTone(freq, 0.04, 'square', 0.06);
  playNoise(0.035, 0.025);
}

let lastStepSound = 0;
export function playStepSound() {
  const now = Date.now();
  if (now - lastStepSound < 120) return;
  lastStepSound = now;
  playTone(120 + Math.random() * 40, 0.03, 'triangle', 0.04);
}

let lastPumpSound = 0;
export function playPumpSound() {
  const now = Date.now();
  if (now - lastPumpSound < 120) return;
  lastPumpSound = now;
  playTone(440, 0.05, 'square', 0.1);
  playToneAt(550, 0.04, 'square', 0.08, 0.03);
  playToneAt(660, 0.04, 'square', 0.06, 0.06);
}

export function playHookSound() {
  playTone(350, 0.08, 'square', 0.12);
  playToneAt(500, 0.06, 'square', 0.1, 0.05);
  playToneAt(700, 0.08, 'triangle', 0.08, 0.1);
}

export function playPopSound() {
  playNoise(0.15, 0.12);
  playTone(800, 0.04, 'square', 0.15);
  playToneAt(600, 0.06, 'square', 0.12, 0.04);
  playToneAt(400, 0.08, 'square', 0.1, 0.08);
  playToneAt(200, 0.12, 'sawtooth', 0.08, 0.12);
}

export function playRockFallSound() {
  playNoise(0.25, 0.1);
  playTone(80, 0.3, 'sawtooth', 0.1);
  playToneAt(60, 0.2, 'sawtooth', 0.08, 0.1);
}

export function playRockCrushSound() {
  playNoise(0.35, 0.15);
  playTone(60, 0.35, 'sawtooth', 0.12);
  playToneAt(120, 0.08, 'square', 0.1, 0.05);
  playToneAt(80, 0.12, 'square', 0.08, 0.1);
  playToneAt(40, 0.15, 'square', 0.06, 0.15);
}

export function playDieSound() {
  playTone(500, 0.08, 'square', 0.12);
  playToneAt(400, 0.08, 'square', 0.1, 0.08);
  playToneAt(300, 0.1, 'square', 0.1, 0.16);
  playToneAt(200, 0.12, 'square', 0.08, 0.24);
  playToneAt(100, 0.2, 'sawtooth', 0.06, 0.32);
  playNoise(0.4, 0.04);
}

export function playBonusSound() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    playToneAt(freq, 0.1, 'square', 0.1, i * 0.06);
  });
}

export function playLevelCompleteSound() {
  const melody = [523, 587, 659, 784, 880, 1047, 1175, 1319];
  melody.forEach((freq, i) => {
    playToneAt(freq, 0.12, 'square', 0.1, i * 0.08);
    playToneAt(freq * 0.5, 0.12, 'triangle', 0.05, i * 0.08);
  });
}

export function playFireSound() {
  playNoise(0.2, 0.1);
  playTone(200, 0.15, 'sawtooth', 0.08);
  playToneAt(300, 0.1, 'sawtooth', 0.06, 0.05);
}

export function playVegetableSound() {
  const notes = [660, 880, 1100, 1320];
  notes.forEach((f, i) => {
    playToneAt(f, 0.08, 'triangle', 0.12, i * 0.05);
  });
}

export function playMenuSelect() {
  playTone(800, 0.06, 'square', 0.1);
  playToneAt(1200, 0.08, 'square', 0.08, 0.06);
}

// --- AMBIENT MUSIC ---
// Procedural chiptune loop : marche chiptune

const MUSIC_BPM = 140;
const BEAT_MS = 60000 / MUSIC_BPM;

// Main melody : motif entrainant façon marche (notes MIDI)
const melodyNotes = [
  // Bar 1
  64, 64, 67, 67, 71, 71, 72, 72,
  // Bar 2
  71, 69, 67, 69, 71, 67, 64, 62,
  // Bar 3
  60, 60, 64, 64, 67, 67, 69, 69,
  // Bar 4
  71, 69, 67, 64, 62, 60, 62, 64,
  // Bar 5
  64, 67, 71, 72, 71, 69, 67, 64,
  // Bar 6
  60, 62, 64, 67, 64, 62, 60, 59,
  // Bar 7
  60, 64, 67, 71, 72, 71, 67, 64,
  // Bar 8
  62, 64, 67, 64, 62, 60, 62, 64,
];

const bassNotes = [
  48, 0, 48, 0, 43, 0, 43, 0,
  45, 0, 45, 0, 47, 0, 47, 0,
  48, 0, 48, 0, 43, 0, 43, 0,
  45, 0, 47, 0, 48, 0, 48, 0,
  48, 0, 43, 0, 45, 0, 47, 0,
  48, 0, 48, 0, 43, 0, 43, 0,
  48, 0, 48, 0, 43, 0, 45, 0,
  47, 0, 48, 0, 47, 0, 48, 0,
];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

let currentBeat = 0;

function playMusicBeat() {
  if (!musicPlaying) return;

  const ctx = getAudioContext();
  const dest = getMusicGain();

  const melodyIdx = currentBeat % melodyNotes.length;
  const bassIdx = currentBeat % bassNotes.length;

  const melodyNote = melodyNotes[melodyIdx];
  const bassNote = bassNotes[bassIdx];

  // Melody
  if (melodyNote > 0) {
    const freq = midiToFreq(melodyNote);
    const noteDur = (BEAT_MS / 1000) * 0.7;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + noteDur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + noteDur);
  }

  // Bass
  if (bassNote > 0) {
    const freq = midiToFreq(bassNote);
    const noteDur = (BEAT_MS / 1000) * 0.6;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + noteDur);
  }

  // Percussion - kick on beats 0,4 / hi-hat on others
  if (currentBeat % 4 === 0) {
    // Kick drum
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } else if (currentBeat % 2 === 0) {
    // Snare-ish noise
    playNoise(0.04, 0.05, dest);
  } else {
    // Hi-hat tick
    playNoise(0.02, 0.025, dest);
  }

  currentBeat++;
}

export function startMusic() {
  if (musicPlaying) return;
  getAudioContext();
  musicPlaying = true;
  currentBeat = 0;

  const scheduleBeat = () => {
    if (!musicPlaying) return;
    playMusicBeat();
    musicLoop = window.setTimeout(scheduleBeat, BEAT_MS) as unknown as number;
  };
  scheduleBeat();
}

export function stopMusic() {
  musicPlaying = false;
  if (musicLoop !== null) {
    clearTimeout(musicLoop);
    musicLoop = null;
  }
  for (const t of musicTimers) clearTimeout(t);
  musicTimers = [];
}

export function pauseMusic() {
  musicPlaying = false;
  if (musicLoop !== null) {
    clearTimeout(musicLoop);
    musicLoop = null;
  }
}

export function resumeMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  const scheduleBeat = () => {
    if (!musicPlaying) return;
    playMusicBeat();
    musicLoop = window.setTimeout(scheduleBeat, BEAT_MS) as unknown as number;
  };
  scheduleBeat();
}

export function setMusicSpeed(_bpmMultiplier: number) {
  // Could be used for hurry-up mode
}

// Init audio on first user interaction
export function initAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (_e) { /* ignore */ }
}
