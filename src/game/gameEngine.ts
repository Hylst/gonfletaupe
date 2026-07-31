// ============================
// GONFLE-TAUPE : moteur de jeu
// Par Hylst - Geoffroy
// ============================

import * as Audio from './audio';

export const GRID_W = 20;
export const GRID_H = 18;
export const TILE_SIZE = 32;
export const UI_HEIGHT = 56;
export const CANVAS_W = GRID_W * TILE_SIZE;
export const CANVAS_H = GRID_H * TILE_SIZE + UI_HEIGHT;

export const PLAYER_SPEED = 0.11; // Un peu plus rapide
export const ENEMY_TUNNEL_SPEED = 0.042; // Ralenti pour compenser la difficulté
export const ENEMY_DIRT_SPEED = 0.022;
export const ENEMY_GHOST_SPEED = 0.060;
export const PUMP_RANGE = 4.5;
export const PUMP_EXTEND_SPEED = 0.25;
export const ROCK_FALL_SPEED = 0.14;
export const ROCK_UNSTABLE_TIME = 55;

export const POOKA_POINTS = 200;
export const FYGAR_POINTS = 400;
export const ROCK_CRUSH_POINTS = 1000;

// Depth zones for visual layers (y ranges)
export const DEPTH_ZONES = [
  { minY: 0, maxY: 2, color1: '#87CEEB', color2: '#6BB5D9', name: 'ciel' },  // sky
  { minY: 3, maxY: 6, color1: '#8B6914', color2: '#7A5C0F', name: 'surface' },
  { minY: 7, maxY: 11, color1: '#6B4E0A', color2: '#5A3D05', name: 'profond' },
  { minY: 12, maxY: 18, color1: '#4A3208', color2: '#3A2505', name: 'abysses' },
];

export type CellType = 'empty' | 'dirt' | 'rock';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type EnemyType = 'pooka' | 'fygar';
export type EnemyState = 'spawning' | 'normal' | 'ghost' | 'inflating' | 'deflating' | 'popped' | 'crushed' | 'fleeing';
export type RockState = 'stable' | 'unstable' | 'falling' | 'landed' | 'shattered';
export type GameScreen = 'playing' | 'paused' | 'gameover' | 'levelcomplete';

export interface Player {
  x: number;
  y: number;
  dir: Direction;
  alive: boolean;
  respawnTimer: number;
  invincibleTimer: number;
  walkFrame: number;
  digging: boolean;
  deathTimer: number;
  combo: number;
  comboTimer: number;
  breatheAnim: number;
  blinkTimer: number;
  pumpCharge: number;
  maxPumpCharge: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  dir: Direction;
  state: EnemyState;
  inflation: number;
  maxInflation: number;
  moveTimer: number;
  ghostTimer: number;
  spawnTimer: number;
  fireTimer: number;
  fireActive: boolean;
  fireLength: number;
  hookedBy: number | null;
  points: number;
  walkFrame: number;
  deflateTimer: number;
  angryTimer: number;
  speed: number;
  breatheAnim: number;
  alertLevel: number; // 0-1, augmente quand le joueur est proche
  eyeTargetX: number;
  eyeTargetY: number;
}

export interface Rock {
  x: number;
  y: number;
  state: RockState;
  unstableTimer: number;
  enemiesCrushed: number;
  fallDistance: number;
  shatterTimer: number;
  wobble: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'square' | 'circle' | 'star' | 'spark';
  gravity: number;
  rotation: number;
  rotSpeed: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  scale: number;
}

export interface Vegetable {
  x: number;
  y: number;
  collected: boolean;
  type: number; // 0-5 different vegs
  bounceTimer: number;
  lifeTimer: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'speed' | 'invincibility' | 'doublePoints' | 'extraLife';
  bounceTimer: number;
  lifeTimer: number;
  rotation: number;
}

export interface ScreenFlash {
  color: string;
  alpha: number;
  decay: number;
}

export interface TunnelTrail {
  x: number;
  y: number;
  alpha: number;
}

export interface GameState {
  grid: CellType[][];
  tunnelMap: boolean[][];
  player: Player;
  enemies: Enemy[];
  rocks: Rock[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  vegetables: Vegetable[];
  powerUps: PowerUp[];
  tunnelTrails: TunnelTrail[];
  score: number;
  lives: number;
  level: number;
  bonusTimer: number;
  screen: GameScreen;
  levelTransitionTimer: number;
  shakeTimer: number;
  shakeIntensity: number;
  pump: {
    active: boolean;
    targetId: number | null;
    hoseLength: number;
    maxHoseLength: number;
    dir: Direction;
    cooldown: number;
  };
  highScore: number;
  readyTimer: number;
  globalTime: number;
  enemiesKilledThisLevel: number;
  totalEnemiesThisLevel: number;
  hurryUp: boolean;
  hurryUpTimer: number;
  lastEnemyBonus: number;
  depthMultiplier: number;
  flowers: { x: number; y: number; type: number; sway: number }[];
  screenFlash: ScreenFlash | null;
  slowMotion: number;
  digHintTimer: number;
  bumpTimer: number;
  playerPowerUps: {
    speed: number;
    invincibility: number;
    doublePoints: number;
  };
}

export function dirToDxDy(dir: Direction): [number, number] {
  switch (dir) {
    case 'up': return [0, -1];
    case 'down': return [0, 1];
    case 'left': return [-1, 0];
    case 'right': return [1, 0];
  }
}

export function getCell(grid: CellType[][], x: number, y: number): CellType {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return 'rock';
  return grid[gy][gx];
}

export function setCell(grid: CellType[][], x: number, y: number, type: CellType) {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) {
    grid[gy][gx] = type;
  }
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getDepthZone(y: number): typeof DEPTH_ZONES[0] {
  for (const z of DEPTH_ZONES) {
    if (y >= z.minY && y <= z.maxY) return z;
  }
  return DEPTH_ZONES[DEPTH_ZONES.length - 1];
}

export function getDepthMultiplier(y: number): number {
  if (y < 5) return 1;
  if (y < 9) return 2;
  if (y < 13) return 3;
  return 4;
}

// --- Level Generation ---

export function generateLevel(level: number): {
  grid: CellType[][];
  tunnelMap: boolean[][];
  rocks: Rock[];
  spawns: { x: number; y: number }[];
  flowers: { x: number; y: number; type: number; sway: number }[];
} {
  const grid: CellType[][] = [];
  const tunnelMap: boolean[][] = [];

  for (let y = 0; y < GRID_H; y++) {
    grid[y] = [];
    tunnelMap[y] = [];
    for (let x = 0; x < GRID_W; x++) {
      grid[y][x] = y < 3 ? 'empty' : 'dirt';
      tunnelMap[y][x] = y < 3;
    }
  }

  // Create some pre-dug tunnels with variety
  const numHTunnels = Math.max(2, 4 - Math.floor(level / 3));
  const usedRows = new Set<number>();
  for (let i = 0; i < numHTunnels; i++) {
    let row: number;
    do { row = 4 + Math.floor(Math.random() * (GRID_H - 6)); } while (usedRows.has(row) || usedRows.has(row - 1) || usedRows.has(row + 1));
    usedRows.add(row);
    const startX = Math.floor(Math.random() * 3) + 1;
    const endX = GRID_W - Math.floor(Math.random() * 3) - 2;
    for (let x = startX; x <= endX; x++) {
      grid[row][x] = 'empty';
      tunnelMap[row][x] = true;
    }
  }

  const numVTunnels = Math.max(1, 3 - Math.floor(level / 3));
  const usedCols = new Set<number>();
  for (let i = 0; i < numVTunnels; i++) {
    let col: number;
    do { col = 3 + Math.floor(Math.random() * (GRID_W - 6)); } while (usedCols.has(col));
    usedCols.add(col);
    const startY = 3 + Math.floor(Math.random() * 2);
    const endY = GRID_H - 2 - Math.floor(Math.random() * 2);
    for (let y = startY; y <= endY; y++) {
      grid[y][col] = 'empty';
      tunnelMap[y][col] = true;
    }
  }

  // Small rooms
  for (let i = 0; i < Math.min(level, 3); i++) {
    const rx = 3 + Math.floor(Math.random() * (GRID_W - 6));
    const ry = 5 + Math.floor(Math.random() * (GRID_H - 8));
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        if (ry + dy < GRID_H && rx + dx < GRID_W) {
          grid[ry + dy][rx + dx] = 'empty';
          tunnelMap[ry + dy][rx + dx] = true;
        }
      }
    }
  }

  // Rocks : plus nombreux avec les niveaux
  const numRocks = Math.min(3 + Math.floor(level / 2), 6);
  const rocks: Rock[] = [];
  for (let i = 0; i < numRocks; i++) {
    let rx: number, ry: number;
    let attempts = 0;
    do {
      rx = 2 + Math.floor(Math.random() * (GRID_W - 4));
      ry = 3 + Math.floor(Math.random() * (GRID_H - 6));
      attempts++;
    } while (attempts < 50 && rocks.some(r => Math.abs(Math.floor(r.x) - rx) < 3 && Math.abs(Math.floor(r.y) - ry) < 3));

    rocks.push({
      x: rx + 0.5,
      y: ry + 0.5,
      state: 'stable',
      unstableTimer: 0,
      enemiesCrushed: 0,
      fallDistance: 0,
      shatterTimer: 0,
      wobble: 0,
    });
    grid[ry][rx] = 'empty';
    tunnelMap[ry][rx] = true;
  }

  // Enemy spawns : disperses sous terre
  const spawns: { x: number; y: number }[] = [];
  for (let i = 0; i < 12; i++) {
    let sx: number, sy: number;
    let attempts = 0;
    do {
      sx = 1 + Math.floor(Math.random() * (GRID_W - 2));
      sy = 4 + Math.floor(Math.random() * (GRID_H - 5));
      attempts++;
    } while (attempts < 30 && (grid[sy][sx] !== 'empty' || spawns.some(s => Math.abs(s.x - sx) < 2 && Math.abs(s.y - sy) < 2)));
    spawns.push({ x: sx, y: sy });
  }

  // Flowers on surface
  const flowers: { x: number; y: number; type: number; sway: number }[] = [];
  for (let x = 0; x < GRID_W; x++) {
    if (Math.random() < 0.3) {
      flowers.push({
        x: x * TILE_SIZE + Math.random() * TILE_SIZE,
        y: 2 * TILE_SIZE + UI_HEIGHT - 4,
        type: Math.floor(Math.random() * 4),
        sway: Math.random() * Math.PI * 2,
      });
    }
  }

  return { grid, tunnelMap, rocks, spawns, flowers };
}

// --- Create Game State ---

export function createGameState(level: number, score: number, lives: number, highScore: number): GameState {
  const { grid, tunnelMap, rocks, spawns, flowers } = generateLevel(level);

  const numEnemies = Math.min(3 + level, 8);
  const numFygars = Math.min(Math.floor(level / 2) + 1, Math.floor(numEnemies / 2));

  const enemies: Enemy[] = [];
  for (let i = 0; i < numEnemies; i++) {
    const spawn = spawns[i % spawns.length];
    const isFygar = i < numFygars;
    const speedMult = 1 + Math.min(level * 0.05, 0.5);
    enemies.push({
      id: i,
      type: isFygar ? 'fygar' : 'pooka',
      x: spawn.x + 0.5,
      y: spawn.y + 0.5,
      dir: Math.random() > 0.5 ? 'left' : 'right',
      state: 'spawning',
      inflation: 0,
      maxInflation: 4,
      moveTimer: 0,
      ghostTimer: 300 + Math.random() * 400,
      spawnTimer: 60 + i * 30,
      fireTimer: 120 + Math.random() * 180,
      fireActive: false,
      fireLength: 0,
      hookedBy: null,
      points: isFygar ? FYGAR_POINTS : POOKA_POINTS,
      walkFrame: Math.random() * 100,
      deflateTimer: 0,
      angryTimer: 0,
      speed: speedMult,
      breatheAnim: Math.random() * Math.PI * 2,
      alertLevel: 0,
      eyeTargetX: 0,
      eyeTargetY: 0,
    });
  }

  // Dig starting area
  const startX = Math.floor(GRID_W / 2);
  const startY = GRID_H - 2;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ny = startY + dy;
      const nx = startX + dx;
      if (ny >= 0 && ny < GRID_H && nx >= 0 && nx < GRID_W) {
        grid[ny][nx] = 'empty';
        tunnelMap[ny][nx] = true;
      }
    }
  }

  return {
    grid,
    tunnelMap,
    player: {
      x: startX + 0.5,
      y: startY + 0.5,
      dir: 'up',
      alive: true,
      respawnTimer: 0,
      invincibleTimer: 120,
      walkFrame: 0,
      digging: false,
      deathTimer: 0,
      combo: 0,
      comboTimer: 0,
      breatheAnim: 0,
      blinkTimer: 60,
      pumpCharge: 0,
      maxPumpCharge: 3,
    },
    enemies,
    rocks,
    particles: [],
    floatingTexts: [],
    vegetables: [],
    powerUps: [],
    tunnelTrails: [],
    score,
    lives,
    level,
    bonusTimer: 2500 + level * 200,
    screen: 'playing',
    levelTransitionTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    pump: {
      active: false,
      targetId: null,
      hoseLength: 0,
      maxHoseLength: PUMP_RANGE,
      dir: 'right',
      cooldown: 0,
    },
    highScore,
    readyTimer: 90,
    globalTime: 0,
    enemiesKilledThisLevel: 0,
    totalEnemiesThisLevel: numEnemies,
    hurryUp: false,
    hurryUpTimer: 0,
    lastEnemyBonus: 0,
    depthMultiplier: 1,
    flowers,
    screenFlash: null,
    slowMotion: 0,
    digHintTimer: 0,
    bumpTimer: 0,
    playerPowerUps: {
      speed: 0,
      invincibility: 0,
      doublePoints: 0,
    },
  };
}

// --- Helpers for particles ---

function spawnParticles(state: GameState, x: number, y: number, count: number, color: string, opts?: Partial<Particle>) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      life: 20 + Math.random() * 15,
      maxLife: 30,
      color,
      size: 2 + Math.random() * 3,
      type: 'square',
      gravity: 0,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      ...opts,
    });
  }
}

function spawnExplosion(state: GameState, x: number, y: number, colors: string[]) {
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const speed = 0.08 + Math.random() * 0.12;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 25 + Math.random() * 20,
      maxLife: 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4,
      type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'circle' : 'spark',
      gravity: 0.003,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    });
  }
}

// --- Player Update ---

export function updatePlayer(state: GameState, keys: Set<string>) {
  const player = state.player;

  // Animate breathing and blinking
  player.breatheAnim += 0.08;
  player.blinkTimer--;
  if (player.blinkTimer <= 0) {
    player.blinkTimer = 180 + Math.random() * 180;
  }

  // Update power-up timers
  if (state.playerPowerUps.speed > 0) state.playerPowerUps.speed--;
  if (state.playerPowerUps.invincibility > 0) state.playerPowerUps.invincibility--;
  if (state.playerPowerUps.doublePoints > 0) state.playerPowerUps.doublePoints--;

  if (player.comboTimer > 0) player.comboTimer--;
  if (player.comboTimer <= 0) player.combo = 0;
  if (state.digHintTimer > 0) state.digHintTimer--;
  if (state.bumpTimer > 0) state.bumpTimer--;

  if (!player.alive) {
    player.deathTimer++;
    player.respawnTimer--;
    if (player.respawnTimer <= 0 && state.lives > 0) {
      const startX = Math.floor(GRID_W / 2);
      const startY = GRID_H - 2;
      player.x = startX + 0.5;
      player.y = startY + 0.5;
      player.alive = true;
      player.invincibleTimer = 180;
      player.dir = 'up';
      player.deathTimer = 0;

      state.pump.active = false;
      state.pump.targetId = null;
      for (const enemy of state.enemies) {
        if (enemy.state === 'inflating') {
          enemy.state = 'normal';
          enemy.inflation = 0;
        }
      }
    }
    return;
  }

  if (player.invincibleTimer > 0) player.invincibleTimer--;

  if (state.pump.targetId !== null) return;

  let dx = 0, dy = 0;
  let newDir: Direction | null = null;

  if (keys.has('ArrowUp') || keys.has('z') || keys.has('Z') || keys.has('w') || keys.has('W')) { dy = -1; newDir = 'up'; }
  else if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) { dy = 1; newDir = 'down'; }
  else if (keys.has('ArrowLeft') || keys.has('q') || keys.has('Q') || keys.has('a') || keys.has('A')) { dx = -1; newDir = 'left'; }
  else if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) { dx = 1; newDir = 'right'; }

  if (newDir) player.dir = newDir;
  if (dx === 0 && dy === 0) {
    player.digging = false;
    return;
  }

  const speed = PLAYER_SPEED * (state.playerPowerUps.speed > 0 ? 1.5 : 1);
  const newX = player.x + dx * speed;
  const newY = player.y + dy * speed;
  const checkX = Math.floor(newX);
  const checkY = Math.floor(newY);

  if (checkX < 0 || checkX >= GRID_W || checkY < 0 || checkY >= GRID_H) return;

  const targetCell = state.grid[checkY]?.[checkX];
  const isDiggingAction = keys.has('Shift') || keys.has('f') || keys.has('F') || keys.has('MOUSE_DIG');

  // Le héros ne traverse jamais la roche. La terre bloque aussi, sauf si l'action creuser est maintenue.
  if (targetCell === 'rock') {
    state.bumpTimer = 12;
    spawnParticles(state, player.x + dx * 0.35, player.y + dy * 0.35, 2, '#909090', {
      type: 'spark',
      life: 12,
      maxLife: 12,
      size: 2,
    });
    return;
  }

  if (targetCell === 'dirt' && !isDiggingAction) {
    state.digHintTimer = 90;
    state.bumpTimer = 10;
    return;
  }

  // Check rocks
  for (const rock of state.rocks) {
    if (rock.state === 'stable' || rock.state === 'landed') {
      const rx = Math.floor(rock.x);
      const ry = Math.floor(rock.y);
      if (rx === checkX && ry === checkY) {
        state.bumpTimer = 12;
        spawnParticles(state, player.x + dx * 0.35, player.y + dy * 0.35, 2, '#A0A0A0', {
          type: 'spark',
          life: 12,
          maxLife: 12,
          size: 2,
        });
        return;
      }
    }
  }

  player.x = newX;
  player.y = newY;
  player.walkFrame += 0.3;

  // Digging
  const wasDirt = targetCell === 'dirt';

  if (wasDirt && isDiggingAction) {
    state.grid[checkY][checkX] = 'empty';
    state.tunnelMap[checkY][checkX] = true;
    player.digging = true;

    spawnParticles(state, player.x, player.y, 3, getDepthZone(checkY).color1, {
      size: 2 + Math.random() * 2,
      gravity: 0.004,
      life: 18,
    });

    Audio.playDigSound();
  } else if (wasDirt) {
    // Si c'est de la terre et qu'on n'appuie pas sur creuser, on est bloqué
    return;
  } else {
    player.digging = false;
    Audio.playStepSound();
  }

  state.depthMultiplier = getDepthMultiplier(player.y);
}

// --- Enemy AI ---

export function updateEnemies(state: GameState) {
  for (const enemy of state.enemies) {
    if (enemy.state === 'popped' || enemy.state === 'crushed') continue;

    enemy.walkFrame += 0.15;
    enemy.breatheAnim += 0.05;

    // Mettre à jour le niveau d'alerte basé sur la distance au joueur
    if (state.player.alive) {
      const dist = distance(enemy, state.player);
      const targetAlert = Math.max(0, 1 - dist / 8);
      enemy.alertLevel += (targetAlert - enemy.alertLevel) * 0.05;

      // Les yeux suivent le joueur
      const dx = state.player.x - enemy.x;
      const dy = state.player.y - enemy.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      enemy.eyeTargetX = (dx / len) * 1.5;
      enemy.eyeTargetY = (dy / len) * 1.5;
    }

    if (enemy.state === 'spawning') {
      enemy.spawnTimer--;
      if (enemy.spawnTimer <= 0) {
        enemy.state = 'normal';
      }
      continue;
    }

    // Deflation timer (enemy slowly deflates if not pumped)
    if (enemy.state === 'deflating') {
      enemy.deflateTimer--;
      if (enemy.deflateTimer <= 0) {
        enemy.inflation = Math.max(0, enemy.inflation - 1);
        if (enemy.inflation <= 0) {
          enemy.state = 'normal';
          enemy.angryTimer = 120; // Angry after escaping!
        } else {
          enemy.deflateTimer = 30;
        }
      }
      continue;
    }

    if (enemy.state === 'inflating') continue;

    // Ghost mode toggle
    enemy.ghostTimer--;
    if (enemy.ghostTimer <= 0) {
      if (enemy.state === 'normal') {
        enemy.state = 'ghost';
        enemy.ghostTimer = 80 + Math.random() * 120;
      } else if (enemy.state === 'ghost') {
        // Un fantôme ne redevient tangible que dans un tunnel, jamais au milieu de la terre.
        if (state.grid[Math.floor(enemy.y)]?.[Math.floor(enemy.x)] === 'dirt') {
          enemy.ghostTimer = 30;
        } else {
          enemy.state = 'normal';
          enemy.ghostTimer = 200 + Math.random() * 300;
        }
      }
    }

    // Fygar fire breath
    if (enemy.type === 'fygar' && enemy.state === 'normal') {
      enemy.fireTimer--;
      if (enemy.fireTimer <= 0 && !enemy.fireActive) {
        const dy = Math.abs(enemy.y - state.player.y);
        if (dy < 1.5 && state.player.alive) {
          enemy.fireActive = true;
          enemy.fireLength = 0;
          Audio.playFireSound();
        }
        enemy.fireTimer = 150 + Math.random() * 180;
      }

      if (enemy.fireActive) {
        enemy.fireLength += 0.15;
        const [fdx] = dirToDxDy(enemy.dir);
        // Spawn fire particles
        for (let i = 0; i < 3; i++) {
          const dist = Math.random() * enemy.fireLength;
          state.particles.push({
            x: enemy.x + fdx * dist,
            y: enemy.y + (Math.random() - 0.5) * 0.4,
            vx: fdx * 0.02 + (Math.random() - 0.5) * 0.01,
            vy: (Math.random() - 0.5) * 0.02 - 0.01,
            life: 12 + Math.random() * 8,
            maxLife: 20,
            color: ['#FF2200', '#FF4400', '#FF6600', '#FF8800', '#FFAA00', '#FFCC00'][Math.floor(Math.random() * 6)],
            size: 3 + Math.random() * 4,
            type: 'circle',
            gravity: -0.002,
            rotation: 0,
            rotSpeed: 0,
          });
        }

        // Check fire -> player collision
        if (state.player.alive && state.player.invincibleTimer <= 0) {
          for (let d = 0.5; d < enemy.fireLength; d += 0.3) {
            const fx = enemy.x + fdx * d;
            const fy = enemy.y;
            if (Math.abs(fx - state.player.x) < 0.6 && Math.abs(fy - state.player.y) < 0.6) {
              killPlayer(state);
              break;
            }
          }
        }

        if (enemy.fireLength > 3.5) {
          enemy.fireActive = false;
          enemy.fireLength = 0;
        }
      }
    }

    // Fleeing when last enemy
    const aliveCount = state.enemies.filter(e => e.state !== 'popped' && e.state !== 'crushed').length;
    if (aliveCount === 1 && enemy.state === 'normal') {
      enemy.state = 'fleeing';
    }

    // Movement AI
    const pdx = state.player.x - enemy.x;
    const pdy = state.player.y - enemy.y;

    let dirs: Direction[];

    if (enemy.state === 'fleeing') {
      // Run AWAY from player
      dirs = [];
      if (Math.abs(pdx) > Math.abs(pdy)) {
        dirs.push(pdx < 0 ? 'right' : 'left');
        dirs.push(pdy < 0 ? 'down' : 'up');
      } else {
        dirs.push(pdy < 0 ? 'down' : 'up');
        dirs.push(pdx < 0 ? 'right' : 'left');
      }
    } else {
      dirs = [];
      if (Math.abs(pdx) > Math.abs(pdy)) {
        dirs.push(pdx > 0 ? 'right' : 'left');
        dirs.push(pdy > 0 ? 'down' : 'up');
      } else {
        dirs.push(pdy > 0 ? 'down' : 'up');
        dirs.push(pdx > 0 ? 'right' : 'left');
      }
    }

    const allDirs: Direction[] = ['up', 'down', 'left', 'right'];
    for (const d of allDirs) {
      if (!dirs.includes(d)) dirs.push(d);
    }

    // Random direction change for variety
    if (Math.random() < 0.02 && enemy.state === 'normal') {
      dirs = dirs.sort(() => Math.random() - 0.5);
    }

    const baseSpeed = enemy.state === 'ghost' ? ENEMY_GHOST_SPEED :
      enemy.state === 'fleeing' ? ENEMY_TUNNEL_SPEED * 1.5 :
      (state.tunnelMap[Math.floor(enemy.y)]?.[Math.floor(enemy.x)] ? ENEMY_TUNNEL_SPEED : ENEMY_DIRT_SPEED);
    const speed = baseSpeed * enemy.speed * (enemy.angryTimer > 0 ? 1.3 : 1) * (state.hurryUp ? 1.4 : 1);

    if (enemy.angryTimer > 0) enemy.angryTimer--;

    for (const dir of dirs) {
      const [ndx, ndy] = dirToDxDy(dir);
      const newX = enemy.x + ndx * speed;
      const newY = enemy.y + ndy * speed;

      const gx = Math.floor(newX);
      const gy = Math.floor(newY);
      if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) continue;

      // Ghost can go through dirt, normal enemies MUST use tunnels
      // Les monstres ne traversent JAMAIS la terre sauf s'ils sont fantômes (mécanique originale)
      if (enemy.state !== 'ghost' && state.grid[gy][gx] === 'dirt') {
        continue;
      }
      // Les murs/roches sont infranchissables pour tous
      if (state.grid[gy][gx] === 'rock') {
        continue;
      }

      let blocked = false;
      for (const other of state.enemies) {
        if (other.id !== enemy.id && other.state !== 'popped' && other.state !== 'crushed' && other.state !== 'spawning') {
          const dist = Math.sqrt((newX - other.x) ** 2 + (newY - other.y) ** 2);
          if (dist < 0.5) { blocked = true; break; }
        }
      }
      // Check rocks
      for (const rock of state.rocks) {
        if (rock.state === 'stable' || rock.state === 'landed') {
          const dist = Math.sqrt((newX - rock.x) ** 2 + (newY - rock.y) ** 2);
          if (dist < 0.7) { blocked = true; break; }
        }
      }
      if (blocked) continue;

      enemy.x = newX;
      enemy.y = newY;
      enemy.dir = dir;
      break;
    }
  }
}

// --- Pump ---

export function updatePump(state: GameState, spaceJustPressed: boolean) {
  const pump = state.pump;

  if (pump.cooldown > 0) pump.cooldown--;

  if (spaceJustPressed && state.player.alive) {
    if (pump.targetId !== null) {
      const enemy = state.enemies.find(e => e.id === pump.targetId);
      if (enemy && enemy.state === 'inflating') {
        enemy.inflation++;
        Audio.playPumpSound();

        spawnParticles(state, enemy.x, enemy.y, 4, '#FFFFFF', {
          type: 'circle',
          size: 2 + enemy.inflation,
        });

        if (enemy.inflation >= enemy.maxInflation) {
          popEnemy(state, enemy);
        }
      }
    } else if (!pump.active && pump.cooldown <= 0) {
      pump.active = true;
      pump.dir = state.player.dir;
      pump.hoseLength = 0.5;
      pump.targetId = null;
    }
  }

  if (pump.active && pump.targetId === null) {
    pump.hoseLength += PUMP_EXTEND_SPEED;

    const [dx, dy] = dirToDxDy(pump.dir);
    const endX = state.player.x + dx * pump.hoseLength;
    const endY = state.player.y + dy * pump.hoseLength;

    for (const enemy of state.enemies) {
      if (enemy.state === 'normal' || enemy.state === 'ghost' || enemy.state === 'fleeing') {
        const dist = Math.sqrt((endX - enemy.x) ** 2 + (endY - enemy.y) ** 2);
        if (dist < 0.8) {
          pump.targetId = enemy.id;
          enemy.state = 'inflating';
          enemy.inflation = 1;
          enemy.hookedBy = 0;
          Audio.playHookSound();
          break;
        }
      }
    }

    if (pump.hoseLength >= pump.maxHoseLength) {
      pump.active = false;
      pump.hoseLength = 0;
      pump.cooldown = 10;
    }
  }

  // Disconnect if too far or enemy escaped
  if (pump.targetId !== null) {
    const enemy = state.enemies.find(e => e.id === pump.targetId);
    if (!enemy || enemy.state === 'popped' || enemy.state === 'crushed') {
      pump.targetId = null;
      pump.active = false;
      pump.cooldown = 8;
    } else if (enemy.state === 'inflating') {
      const dist = distance(state.player, enemy);
      if (dist > PUMP_RANGE * 1.5) {
        pump.targetId = null;
        pump.active = false;
        pump.cooldown = 8;
        enemy.state = 'deflating';
        enemy.deflateTimer = 40;
      }
    }
  }

  // If not pumping and an enemy is inflating, start deflate
  if (pump.targetId === null) {
    for (const enemy of state.enemies) {
      if (enemy.state === 'inflating' && enemy.inflation > 0) {
        enemy.state = 'deflating';
        enemy.deflateTimer = 35;
      }
    }
  }
}

function popEnemy(state: GameState, enemy: Enemy) {
  enemy.state = 'popped';
  state.enemiesKilledThisLevel++;

  // Depth bonus
  const depthMult = getDepthMultiplier(enemy.y);
  // Combo bonus
  state.player.combo++;
  state.player.comboTimer = 150;
  const comboMult = Math.min(state.player.combo, 5);
  const doublePointsMult = state.playerPowerUps.doublePoints > 0 ? 2 : 1;

  const points = enemy.points * depthMult * comboMult * doublePointsMult;
  state.score += points;

  // Texte flottant
  const comboText = comboMult > 1 ? ` x${comboMult}` : '';
  const doubleText = doublePointsMult > 1 ? ' ×2!' : '';
  state.floatingTexts.push({
    x: enemy.x,
    y: enemy.y - 0.5,
    text: `${points}${comboText}${doubleText}`,
    life: 90,
    maxLife: 90,
    color: comboMult >= 4 ? '#FF00FF' : comboMult >= 3 ? '#FF4500' : comboMult >= 2 ? '#00FFFF' : '#FFD700',
    scale: 1 + comboMult * 0.2,
  });

  // Explosion spectaculaire
  spawnExplosion(state, enemy.x, enemy.y,
    enemy.type === 'pooka'
      ? ['#DC143C', '#FF6347', '#FF4500', '#FFD700', '#FFB6C1']
      : ['#228B22', '#32CD32', '#00FF00', '#ADFF2F', '#98FB98']
  );

  // Effet secondaire : particules en spirale pour les gros combos
  if (comboMult >= 3) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 0.15;
      state.particles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: `hsl(${(i * 30) % 360}, 100%, 70%)`,
        size: 3,
        type: 'star',
        gravity: 0,
        rotation: 0,
        rotSpeed: 0.3,
      });
    }
    triggerScreenFlash(state, comboMult >= 4 ? '#FF00FF' : '#FFD700', 0.4);
    state.shakeTimer = 15;
    state.shakeIntensity = 4;
  }

  Audio.playPopSound();
}

// --- Rocks ---

export function updateRocks(state: GameState) {
  for (const rock of state.rocks) {
    if (rock.state === 'shattered') {
      rock.shatterTimer--;
      if (rock.shatterTimer <= 0) {
        rock.state = 'landed'; // Remove from active
      }
      continue;
    }

    if (rock.state === 'stable') {
      // belowY est deja la ligne juste sous le rocher (contrairement a "landY" plus bas,
      // qui lui doit regarder un cran plus loin car il suit un rocher deja en mouvement).
      // Le +1 ici verifiait donc la case DEUX lignes sous le rocher : creuser juste en
      // dessous ne le faisait jamais tomber, et il tombait a travers de la terre intacte
      // des qu'on creusait deux cases plus bas.
      const belowY = Math.floor(rock.y + 0.5);
      const belowX = Math.floor(rock.x);
      if (belowY < GRID_H && state.grid[belowY][belowX] === 'empty') {
        let supported = false;
        for (const other of state.rocks) {
          if (other !== rock && (other.state === 'landed' || other.state === 'stable')) {
            const ox = Math.floor(other.x);
            const oy = Math.floor(other.y);
            if (ox === belowX && oy === belowY) { supported = true; break; }
          }
        }
        if (!supported) {
          rock.state = 'unstable';
          rock.unstableTimer = ROCK_UNSTABLE_TIME;
          rock.wobble = 0;
        }
      }
    } else if (rock.state === 'unstable') {
      rock.unstableTimer--;
      rock.wobble += 0.15;
      if (rock.unstableTimer <= 0) {
        rock.state = 'falling';
        rock.fallDistance = 0;
        const gy = Math.floor(rock.y);
        const gx = Math.floor(rock.x);
        if (gy >= 0 && gy < GRID_H) {
          state.grid[gy][gx] = 'empty';
          state.tunnelMap[gy][gx] = true;
        }
        Audio.playRockFallSound();
        state.shakeTimer = 15;
        state.shakeIntensity = 3;
      }
    } else if (rock.state === 'falling') {
      rock.y += ROCK_FALL_SPEED;
      rock.fallDistance += ROCK_FALL_SPEED;

      // Crush enemies
      for (const enemy of state.enemies) {
        if (enemy.state !== 'popped' && enemy.state !== 'crushed' && enemy.state !== 'spawning') {
          const dist = distance(rock, enemy);
          if (dist < 0.75) {
            enemy.state = 'crushed';
            rock.enemiesCrushed++;
            const points = ROCK_CRUSH_POINTS * rock.enemiesCrushed;
            state.score += points;
            state.enemiesKilledThisLevel++;

            state.floatingTexts.push({
              x: enemy.x,
              y: enemy.y - 0.5,
              text: `💥 ${points}`,
              life: 80,
              maxLife: 80,
              color: '#FF4500',
              scale: 1.3,
            });

            spawnExplosion(state, enemy.x, enemy.y,
              ['#808080', '#A0A0A0', '#FFD700', enemy.type === 'pooka' ? '#DC143C' : '#228B22']
            );

            Audio.playRockCrushSound();
          }
        }
      }

      // Crush player
      if (state.player.alive && state.player.invincibleTimer <= 0) {
        if (distance(rock, state.player) < 0.75) {
          killPlayer(state);
        }
      }

      // Land
      const landY = Math.floor(rock.y + 0.5);
      const landX = Math.floor(rock.x);
      if (landY + 1 >= GRID_H || (state.grid[landY + 1]?.[landX] === 'dirt')) {
        rock.state = 'shattered';
        rock.shatterTimer = 30;
        rock.y = landY + 0.5;

        // Shatter particles
        for (let i = 0; i < 12; i++) {
          state.particles.push({
            x: rock.x,
            y: rock.y,
            vx: (Math.random() - 0.5) * 0.2,
            vy: -Math.random() * 0.15,
            life: 25,
            maxLife: 30,
            color: ['#606060', '#808080', '#A0A0A0', '#909090'][Math.floor(Math.random() * 4)],
            size: 3 + Math.random() * 5,
            type: 'square',
            gravity: 0.008,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.4,
          });
        }

        state.shakeTimer = 10;
        state.shakeIntensity = 4;
        Audio.playRockCrushSound();

        // Bonus vegetable if crushed 2+ enemies
        if (rock.enemiesCrushed >= 2) {
          const vx = Math.floor(GRID_W / 2) + 0.5;
          const vy = 2.5;
          state.vegetables.push({
            x: vx,
            y: vy,
            collected: false,
            type: Math.min(state.level - 1, 5),
            bounceTimer: 0,
            lifeTimer: 600,
          });
        }
      }

      // Check other landed rocks
      for (const other of state.rocks) {
        if (other !== rock && other.state === 'landed') {
          if (Math.floor(other.x) === landX && Math.floor(other.y) === landY + 1) {
            rock.state = 'landed';
            rock.y = landY + 0.5;
            state.grid[landY][landX] = 'rock';
            break;
          }
        }
      }
    }
  }
}

// --- Kill Player ---

function killPlayer(state: GameState) {
  if (!state.player.alive) return;
  state.player.alive = false;
  state.player.respawnTimer = 150;
  state.player.deathTimer = 0;
  state.lives--;

  state.pump.active = false;
  state.pump.targetId = null;

  spawnExplosion(state, state.player.x, state.player.y,
    ['#FFFFFF', '#4169E1', '#FDBCB4', '#FFD700']
  );

  Audio.playDieSound();

  if (state.lives <= 0) {
    state.screen = 'gameover';
    Audio.stopMusic();
  }
}

// --- Collisions ---

export function checkCollisions(state: GameState) {
  // Invincibilité par power-up
  const invincible = state.player.invincibleTimer > 0 || state.playerPowerUps.invincibility > 0;

  if (state.player.alive && !invincible) {
    for (const enemy of state.enemies) {
      if (enemy.state === 'normal' || enemy.state === 'ghost' || enemy.state === 'fleeing') {
        if (distance(state.player, enemy) < 0.6) {
          killPlayer(state);
          return;
        }
      }
    }
  }

  // Vegetables
  for (const veg of state.vegetables) {
    if (!veg.collected) {
      if (distance(state.player, veg) < 0.8) {
        veg.collected = true;
        const vegPoints = [400, 600, 800, 1000, 1500, 2000];
        const points = vegPoints[Math.min(veg.type, 5)] * (state.playerPowerUps.doublePoints > 0 ? 2 : 1);
        state.score += points;
        state.floatingTexts.push({
          x: veg.x,
          y: veg.y - 0.5,
          text: `🥕 ${points}`,
          life: 80,
          maxLife: 80,
          color: '#00FF00',
          scale: 1.2,
        });
        spawnParticles(state, veg.x, veg.y, 8, '#00FF00', { type: 'star' });
        Audio.playVegetableSound();

        // 20% chance de spawn un power-up
        if (Math.random() < 0.2 && state.powerUps.length < 2) {
          const types: PowerUp['type'][] = ['speed', 'invincibility', 'doublePoints', 'extraLife'];
          const type = types[Math.floor(Math.random() * types.length)];
          state.powerUps.push({
            x: veg.x,
            y: veg.y,
            type,
            bounceTimer: 0,
            lifeTimer: 600,
            rotation: 0,
          });
        }
      }
    }
  }

  // Power-ups
  for (const pu of state.powerUps) {
    if (distance(state.player, pu) < 0.8) {
      pu.lifeTimer = 0;
      const emojis: Record<string, string> = {
        speed: '⚡',
        invincibility: '🛡️',
        doublePoints: '✨',
        extraLife: '❤️',
      };
      const names: Record<string, string> = {
        speed: 'VITESSE!',
        invincibility: 'INVINCIBLE!',
        doublePoints: 'DOUBLE POINTS!',
        extraLife: '+1 VIE!',
      };
      const colors: Record<string, string> = {
        speed: '#00BFFF',
        invincibility: '#FFD700',
        doublePoints: '#FF00FF',
        extraLife: '#FF3366',
      };

      switch (pu.type) {
        case 'speed':
          state.playerPowerUps.speed = 600;
          break;
        case 'invincibility':
          state.playerPowerUps.invincibility = 480;
          break;
        case 'doublePoints':
          state.playerPowerUps.doublePoints = 600;
          break;
        case 'extraLife':
          state.lives = Math.min(state.lives + 1, 9);
          break;
      }

      state.floatingTexts.push({
        x: pu.x,
        y: pu.y - 0.5,
        text: `${emojis[pu.type]} ${names[pu.type]}`,
        life: 100,
        maxLife: 100,
        color: colors[pu.type],
        scale: 1.4,
      });

      spawnParticles(state, pu.x, pu.y, 16, colors[pu.type], { type: 'star', size: 4 });
      Audio.playBonusSound();
      triggerScreenFlash(state, colors[pu.type], 0.3);
    }
  }
  state.powerUps = state.powerUps.filter(pu => pu.lifeTimer > 0);
}

export function triggerScreenFlash(state: GameState, color: string, alpha: number) {
  state.screenFlash = { color, alpha, decay: 0.02 };
}

export function updateScreenFlash(state: GameState) {
  if (state.screenFlash) {
    state.screenFlash.alpha -= state.screenFlash.decay;
    if (state.screenFlash.alpha <= 0) {
      state.screenFlash = null;
    }
  }
}

export function updatePowerUps(state: GameState) {
  for (const pu of state.powerUps) {
    pu.bounceTimer += 0.08;
    pu.rotation += 0.05;
    pu.lifeTimer--;
  }
}

export function updateSlowMotion(state: GameState) {
  if (state.slowMotion > 0) state.slowMotion--;
}

// --- Win Condition ---

export function checkWinCondition(state: GameState) {
  const aliveEnemies = state.enemies.filter(e => e.state !== 'popped' && e.state !== 'crushed');
  if (aliveEnemies.length === 0 && state.screen === 'playing') {
    state.screen = 'levelcomplete';
    state.levelTransitionTimer = 180;
    Audio.playLevelCompleteSound();

    const timeBonus = Math.floor(state.bonusTimer / 10) * 10;
    const perfectBonus = state.enemiesKilledThisLevel === state.totalEnemiesThisLevel ? 500 * state.level : 0;
    const totalBonus = timeBonus + perfectBonus;
    state.score += totalBonus;

    if (totalBonus > 0) {
      state.floatingTexts.push({
        x: GRID_W / 2,
        y: GRID_H / 2 - 1,
        text: `BONUS TEMPS: ${timeBonus}`,
        life: 140,
        maxLife: 140,
        color: '#FFD700',
        scale: 1.2,
      });
    }
    if (perfectBonus > 0) {
      state.floatingTexts.push({
        x: GRID_W / 2,
        y: GRID_H / 2 + 1,
        text: `PARFAIT! +${perfectBonus}`,
        life: 140,
        maxLife: 140,
        color: '#FF00FF',
        scale: 1.4,
      });
    }
  }
}

// --- Updates ---

export function updateParticles(state: GameState) {
  for (const p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.rotation += p.rotSpeed;
    p.life--;
  }
  state.particles = state.particles.filter(p => p.life > 0);
}

export function updateFloatingTexts(state: GameState) {
  for (const ft of state.floatingTexts) {
    ft.life--;
  }
  state.floatingTexts = state.floatingTexts.filter(ft => ft.life > 0);
}

export function updateBonusTimer(state: GameState) {
  if (state.screen === 'playing' && state.bonusTimer > 0) {
    state.bonusTimer -= 0.5;
    if (state.bonusTimer < 0) state.bonusTimer = 0;
  }
}

export function updateShake(state: GameState) {
  if (state.shakeTimer > 0) {
    state.shakeTimer--;
    state.shakeIntensity *= 0.92;
  }
}

export function updateVegetables(state: GameState) {
  for (const veg of state.vegetables) {
    if (!veg.collected) {
      veg.bounceTimer += 0.08;
      veg.lifeTimer--;
      if (veg.lifeTimer <= 0) veg.collected = true;
    }
  }
}

export function updateHurryUp(state: GameState) {
  if (state.bonusTimer <= 0 && state.screen === 'playing' && !state.hurryUp) {
    state.hurryUp = true;
    state.floatingTexts.push({
      x: GRID_W / 2,
      y: GRID_H / 2,
      text: 'DÉPÊCHEZ-VOUS!',
      life: 120,
      maxLife: 120,
      color: '#FF0000',
      scale: 1.5,
    });
  }

  if (state.hurryUp) {
    state.hurryUpTimer++;
    if (state.hurryUpTimer > 300) {
      for (const enemy of state.enemies) {
        if (enemy.state === 'normal') {
          enemy.state = 'ghost';
          enemy.ghostTimer = 999999;
        }
      }
    }
  }
}

export function updateGlobalTime(state: GameState) {
  state.globalTime++;
}
