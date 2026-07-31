// ============================
// RENDERER HD : graphismes avances
// Par Hylst - Geoffroy avec l'aide d'une IA
// ============================

import * as GE from './gameEngine';

const T = GE.TILE_SIZE;
const UI = GE.UI_HEIGHT;

// =================== MAIN RENDER ===================

export function render(ctx: CanvasRenderingContext2D, state: GE.GameState, frame: number) {
  ctx.save();

  // Slow motion effect
  if (state.slowMotion > 0) {
    ctx.globalAlpha = 0.98;
  }

  // Screen shake
  if (state.shakeTimer > 0) {
    const sx = (Math.random() - 0.5) * state.shakeIntensity;
    const sy = (Math.random() - 0.5) * state.shakeIntensity;
    ctx.translate(sx, sy);
  }

  // Clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, GE.CANVAS_W, GE.CANVAS_H);

  // === PLAYFIELD ===
  ctx.save();
  ctx.translate(0, UI);
  ctx.beginPath();
  ctx.rect(0, 0, GE.CANVAS_W, GE.GRID_H * T);
  ctx.clip();

  // Sky
  drawSky(ctx, frame);

  // Grid (dirt/tunnels)
  drawGrid(ctx, state.grid, frame);

  // Contextual digging helper
  drawDigTarget(ctx, state, frame);

  // Ambient particles (dust motes in tunnels)
  drawAmbientDust(ctx, state, frame);

  // Grass line
  drawGrass(ctx, frame);

  // Flowers
  drawFlowers(ctx, state.flowers, frame);

  // Vegetables
  drawVegetables(ctx, state.vegetables, frame);

  // Power-ups
  drawPowerUps(ctx, state.powerUps, frame);

  // Pump hose (behind player)
  if (state.pump.active || state.pump.targetId !== null) {
    drawPump(ctx, state, frame);
  }

  // Enemies
  const sortedEnemies = [...state.enemies].sort((a, b) => a.y - b.y);
  for (const enemy of sortedEnemies) {
    drawEnemy(ctx, enemy, frame, state);
  }

  // Player
  if (state.player.alive) {
    drawPlayer(ctx, state.player, frame, state);
  } else if (state.player.deathTimer < 90) {
    drawPlayerDeath(ctx, state.player, frame);
  }

  // Rocks
  for (const rock of state.rocks) {
    if (rock.state !== 'shattered' || rock.shatterTimer > 0) {
      drawRock(ctx, rock, frame);
    }
  }

  // Particles
  drawParticles(ctx, state.particles);

  // Floating texts
  drawFloatingTexts(ctx, state.floatingTexts, frame);

  // Vignette effect
  drawVignette(ctx);

  ctx.restore();

  // Screen flash
  if (state.screenFlash) {
    ctx.fillStyle = state.screenFlash.color;
    ctx.globalAlpha = state.screenFlash.alpha;
    ctx.fillRect(0, 0, GE.CANVAS_W, GE.CANVAS_H);
    ctx.globalAlpha = 1;
  }

  // === UI ===
  drawUI(ctx, state, frame);

  // === OVERLAYS ===
  if (state.readyTimer > 0) drawReady(ctx, state, frame);
  else if (state.screen === 'paused') drawPaused(ctx);
  else if (state.screen === 'levelcomplete') drawLevelComplete(ctx, state, frame);
  else if (state.screen === 'gameover') drawGameOver(ctx, state, frame);

  ctx.restore();
}

// =================== SKY ===================

function drawSky(ctx: CanvasRenderingContext2D, frame: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 3 * T);
  skyGrad.addColorStop(0, '#4A90E2');
  skyGrad.addColorStop(0.4, '#7AB8F5');
  skyGrad.addColorStop(0.8, '#B8E0F7');
  skyGrad.addColorStop(1, '#D4EEC8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GE.CANVAS_W, 3 * T);

  // Sun with glow
  const sunX = GE.CANVAS_W * 0.82;
  const sunY = T * 1.0;

  // Sun rays
  ctx.save();
  ctx.translate(sunX, sunY);
  ctx.rotate(frame * 0.002);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(255, 240, 150, 0.3)';
    ctx.fillRect(-1, 20, 2, 20);
    ctx.restore();
  }
  ctx.restore();

  // Sun glow
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, T * 2);
  sunGlow.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
  sunGlow.addColorStop(0.3, 'rgba(255, 230, 100, 0.3)');
  sunGlow.addColorStop(1, 'rgba(255, 200, 50, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(sunX - T * 2, sunY - T * 2, T * 4, T * 4);

  // Sun body
  ctx.fillStyle = '#FFF8DC';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFE55C';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Clouds
  drawClouds(ctx, frame);

  // Birds (small)
  for (let i = 0; i < 3; i++) {
    const bx = ((frame * 0.3 + i * 200) % (GE.CANVAS_W + 100)) - 50;
    const by = 20 + i * 25;
    const wing = Math.sin(frame * 0.2 + i) * 3;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - 5, by);
    ctx.quadraticCurveTo(bx - 3, by - wing, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - wing, bx + 5, by);
    ctx.stroke();
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, frame: number) {
  for (let i = 0; i < 4; i++) {
    const cx = ((frame * (0.12 + i * 0.04) + i * 220) % (GE.CANVAS_W + 100)) - 50;
    const cy = 15 + i * 20;
    const scale = 0.8 + (i % 2) * 0.3;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

    // Cloud shadow
    ctx.fillStyle = 'rgba(200, 210, 230, 0.5)';
    ctx.beginPath();
    ctx.ellipse(2, 5, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main cloud
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(15, -5, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-15, -3, 17, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, -8, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// =================== DIRT GRID ===================

function getDirtColors(y: number) {
  if (y < 5) return {
    main: '#A87038', light: '#C89060', dark: '#785020',
    dots: '#D4A870', shadow: '#5A3818', highlight: '#E0B880'
  };
  if (y < 9) return {
    main: '#8B5A1E', light: '#A87638', dark: '#5A3810',
    dots: '#B88050', shadow: '#3A2508', highlight: '#C88858'
  };
  if (y < 13) return {
    main: '#6B4014', light: '#885828', dark: '#402808',
    dots: '#986840', shadow: '#281804', highlight: '#A87048'
  };
  return {
    main: '#48280C', light: '#684020', dark: '#200E02',
    dots: '#785030', shadow: '#100800', highlight: '#886038'
  };
}

function getTunnelBg(y: number) {
  if (y < 5) return { main: '#1a1a3e', light: '#252560', dark: '#0d0d20' };
  if (y < 9) return { main: '#141430', light: '#202048', dark: '#080818' };
  if (y < 13) return { main: '#0f0f25', light: '#181840', dark: '#050512' };
  return { main: '#0a0a18', light: '#101030', dark: '#030308' };
}

function drawGrid(ctx: CanvasRenderingContext2D, grid: GE.CellType[][], frame: number) {
  for (let y = 0; y < GE.GRID_H; y++) {
    if (y < 3) continue; // Sky
    for (let x = 0; x < GE.GRID_W; x++) {
      const cell = grid[y][x];
      const px = x * T;
      const py = y * T;

      if (cell === 'dirt') {
        drawDirtCell(ctx, px, py, x, y, frame);
      } else if (cell === 'empty') {
        drawTunnelCell(ctx, px, py, x, y, grid, frame);
      }
    }
  }
}

function drawDigTarget(ctx: CanvasRenderingContext2D, state: GE.GameState, frame: number) {
  if (!state.player.alive) return;

  const [dx, dy] = GE.dirToDxDy(state.player.dir);
  const tx = Math.floor(state.player.x + dx * 0.75);
  const ty = Math.floor(state.player.y + dy * 0.75);
  if (tx < 0 || tx >= GE.GRID_W || ty < 0 || ty >= GE.GRID_H) return;

  const cell = state.grid[ty]?.[tx];
  const px = tx * T;
  const py = ty * T;
  const pulse = 0.5 + Math.sin(frame * 0.18) * 0.35;

  if (cell === 'dirt') {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 230, 90, ${0.55 + pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -frame * 0.8;
    ctx.strokeRect(px + 3, py + 3, T - 6, T - 6);
    ctx.setLineDash([]);

    // Small animated pick marks on the target dirt tile
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + pulse * 0.25})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const ox = 9 + i * 6;
      const oy = 10 + Math.sin(frame * 0.2 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(px + ox - 3, py + oy + 3);
      ctx.lineTo(px + ox + 3, py + oy - 3);
      ctx.stroke();
    }

    if (state.digHintTimer > 0) {
      const alpha = Math.min(1, state.digHintTimer / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(20, 10, 40, 0.9)';
      roundRect(ctx, px - 30, py - 22, 92, 18, 5);
      ctx.fill();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      roundRect(ctx, px - 30, py - 22, 92, 18, 5);
      ctx.stroke();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MAJ/F POUR CREUSER', px + 16, py - 13);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  } else if (cell === 'rock') {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 80, 80, ${0.4 + pulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 8);
    ctx.lineTo(px + T - 8, py + T - 8);
    ctx.moveTo(px + T - 8, py + 8);
    ctx.lineTo(px + 8, py + T - 8);
    ctx.stroke();
    ctx.restore();
  }
}

function drawDirtCell(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number, frame: number) {
  const colors = getDirtColors(y);

  // Base dirt gradient
  const grad = ctx.createLinearGradient(px, py, px, py + T);
  grad.addColorStop(0, colors.light);
  grad.addColorStop(0.4, colors.main);
  grad.addColorStop(1, colors.dark);
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, T, T);

  // Texture dots
  const seed = x * 71 + y * 131;
  for (let i = 0; i < 8; i++) {
    const tx = ((seed + i * 37) % 26) + 3;
    const ty = ((seed + i * 23) % 26) + 3;
    const sz = ((seed + i * 13) % 3) + 1;
    const dark = (i % 2) === 0;
    ctx.fillStyle = dark ? colors.shadow : colors.dots;
    ctx.fillRect(px + tx, py + ty, sz, sz);
  }

  // Small pebbles
  if ((seed % 7) === 0) {
    ctx.fillStyle = colors.highlight;
    ctx.beginPath();
    ctx.arc(px + ((seed * 3) % 20) + 6, py + ((seed * 5) % 20) + 6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.shadow;
    ctx.beginPath();
    ctx.arc(px + ((seed * 3) % 20) + 7, py + ((seed * 5) % 20) + 7, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animated root/worm
  if ((seed % 19) === 0) {
    ctx.strokeStyle = colors.dark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const wobble = Math.sin(frame * 0.015 + seed) * 2;
    ctx.moveTo(px + 6, py + 10);
    ctx.quadraticCurveTo(px + 16, py + 6 + wobble, px + 26, py + 14 + wobble);
    ctx.stroke();
  }

  // Top highlight (when above is empty)
  if (y > 0) {
    // check original grid: caller should pass grid, here we use heuristic
    ctx.fillStyle = colors.highlight;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(px, py, T, 2);
    ctx.globalAlpha = 1;
  }

  // Subtle grid separation
  ctx.strokeStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
  ctx.globalAlpha = 1;
}

function drawTunnelCell(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number, grid: GE.CellType[][], _frame: number) {
  const bg = getTunnelBg(y);

  // Base tunnel gradient
  const grad = ctx.createLinearGradient(px, py, px, py + T);
  grad.addColorStop(0, bg.light);
  grad.addColorStop(0.5, bg.main);
  grad.addColorStop(1, bg.dark);
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, T, T);

  // Subtle texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  const seed = x * 41 + y * 97;
  for (let i = 0; i < 3; i++) {
    const tx = ((seed + i * 23) % 24) + 4;
    const ty = ((seed + i * 31) % 24) + 4;
    ctx.fillRect(px + tx, py + ty, 2, 2);
  }

  // Draw edges when adjacent to dirt
  const colors = getDirtColors(y);

  // Top edge (stalactites)
  if (y > 2 && grid[y - 1]?.[x] === 'dirt') {
    for (let i = 0; i < T; i += 4) {
      const h = 3 + ((x * 7 + i * 3) % 5);
      const g = ctx.createLinearGradient(px + i, py, px + i, py + h);
      g.addColorStop(0, colors.dark);
      g.addColorStop(1, colors.main);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(px + i, py);
      ctx.lineTo(px + i + 2, py);
      ctx.lineTo(px + i + 1, py + h);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Bottom edge (stalagmites)
  if (y < GE.GRID_H - 1 && grid[y + 1]?.[x] === 'dirt') {
    for (let i = 0; i < T; i += 5) {
      const h = 2 + ((x * 11 + i * 7) % 4);
      const g = ctx.createLinearGradient(px + i, py + T, px + i, py + T - h);
      g.addColorStop(0, colors.dark);
      g.addColorStop(1, colors.main);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(px + i, py + T);
      ctx.lineTo(px + i + 2, py + T);
      ctx.lineTo(px + i + 1, py + T - h);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Left edge
  if (x > 0 && grid[y]?.[x - 1] === 'dirt') {
    const g = ctx.createLinearGradient(px, py, px + 4, py);
    g.addColorStop(0, colors.dark);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px, py, 4, T);
  }

  // Right edge
  if (x < GE.GRID_W - 1 && grid[y]?.[x + 1] === 'dirt') {
    const g = ctx.createLinearGradient(px + T, py, px + T - 4, py);
    g.addColorStop(0, colors.dark);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px + T - 4, py, 4, T);
  }
}

// =================== AMBIENT DUST ===================

function drawAmbientDust(ctx: CanvasRenderingContext2D, state: GE.GameState, frame: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let i = 0; i < 30; i++) {
    const seed = i * 127;
    const px = ((seed + frame * 0.3) % GE.CANVAS_W);
    const py = ((seed * 3 + frame * 0.2) % (GE.GRID_H * T));
    if (py < 3 * T) continue;
    const gx = Math.floor(px / T);
    const gy = Math.floor(py / T);
    if (state.grid[gy]?.[gx] === 'empty') {
      const alpha = 0.1 + Math.sin(frame * 0.02 + i) * 0.1;
      ctx.globalAlpha = alpha;
      ctx.fillRect(px, py, 1.5, 1.5);
    }
  }
  ctx.globalAlpha = 1;
}

// =================== GRASS ===================

function drawGrass(ctx: CanvasRenderingContext2D, frame: number) {
  const grassY = 3 * T;

  // Grass base
  const grassGrad = ctx.createLinearGradient(0, grassY - 8, 0, grassY + 2);
  grassGrad.addColorStop(0, '#5CB85C');
  grassGrad.addColorStop(1, '#2E7D32');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, grassY - 4, GE.CANVAS_W, 6);

  // Individual grass blades
  for (let x = 0; x < GE.CANVAS_W; x += 3) {
    const h = 5 + Math.sin(x * 0.3 + frame * 0.04) * 2 + ((x * 7) % 4);
    const sway = Math.sin(frame * 0.04 + x * 0.1) * 1.5;
    const hue = 100 + ((x * 3) % 40);
    const light = 30 + ((x * 13) % 20);

    ctx.strokeStyle = `hsl(${hue}, 55%, ${light}%)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, grassY);
    ctx.quadraticCurveTo(x + sway * 0.5, grassY - h / 2, x + sway, grassY - h);
    ctx.stroke();
  }
}

// =================== FLOWERS ===================

function drawFlowers(ctx: CanvasRenderingContext2D, flowers: GE.GameState['flowers'], frame: number) {
  for (const f of flowers) {
    const sway = Math.sin(frame * 0.04 + f.sway) * 3;
    ctx.save();
    ctx.translate(f.x, f.y);

    // Stem
    ctx.strokeStyle = '#3B8B3B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway, -10, sway * 0.5, -16);
    ctx.stroke();

    // Leaf
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(sway * 0.7, -7, 2, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Flower head
    ctx.translate(sway * 0.5, -16);

    const colors = [
      ['#FF6B6B', '#FF3838'],
      ['#FFD93D', '#FFB300'],
      ['#6BCB77', '#3BAA4F'],
      ['#4D96FF', '#2979FF'],
      ['#FF78C4', '#E91E63'],
    ];
    const [light, dark] = colors[f.type % colors.length];

    // Petals
    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2 + frame * 0.01;
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * 3.5, Math.sin(angle) * 3.5, 3.5, 2.5, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * 3.5, Math.sin(angle) * 3.5, 2, 1.5, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// =================== PLAYER ===================

function drawPlayer(ctx: CanvasRenderingContext2D, player: GE.Player, frame: number, state: GE.GameState) {
  const px = player.x * T;
  const py = player.y * T;

  // Invincibility blink
  if (player.invincibleTimer > 0 && Math.floor(frame / 3) % 2 === 0) {
    ctx.globalAlpha = 0.3;
  }

  // Power-up invincibility aura
  if (state.playerPowerUps.invincibility > 0) {
    const auraSize = 16 + Math.sin(frame * 0.2) * 3;
    const aura = ctx.createRadialGradient(px, py, 0, px, py, auraSize);
    aura.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
    aura.addColorStop(0.6, 'rgba(255, 215, 0, 0.2)');
    aura.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(px - auraSize, py - auraSize, auraSize * 2, auraSize * 2);
  }

  // Speed aura
  if (state.playerPowerUps.speed > 0) {
    const auraSize = 14 + Math.sin(frame * 0.3) * 2;
    const aura = ctx.createRadialGradient(px, py, 0, px, py, auraSize);
    aura.addColorStop(0, 'rgba(0, 191, 255, 0.3)');
    aura.addColorStop(1, 'rgba(0, 191, 255, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(px - auraSize, py - auraSize, auraSize * 2, auraSize * 2);
  }

  ctx.save();
  ctx.translate(px, py);

  if (state.bumpTimer > 0) {
    const [bdx, bdy] = GE.dirToDxDy(player.dir);
    const bump = Math.sin(state.bumpTimer * 0.9) * 2.5;
    ctx.translate(-bdx * bump, -bdy * bump);
  }

  const flip = player.dir === 'left' ? -1 : 1;
  ctx.scale(flip, 1);

  // Walk animation
  const walkBob = Math.sin(player.walkFrame * 2) * 2;
  ctx.translate(0, walkBob * 0.5);

  // Breathing animation
  const breathe = Math.sin(player.breatheAnim) * 0.5;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 16 - walkBob * 0.5, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer glow (blue)
  ctx.shadowColor = 'rgba(65, 105, 225, 0.5)';
  ctx.shadowBlur = 10;

  // Body - layered suit
  const bodyGrad = ctx.createLinearGradient(-7, -4, 7, 14);
  bodyGrad.addColorStop(0, '#5A85E8');
  bodyGrad.addColorStop(0.5, '#4169E1');
  bodyGrad.addColorStop(1, '#2B4FBE');
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, -7 - breathe, -4, 14 + breathe * 2, 14, 3);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Body highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  roundRect(ctx, -5, -3, 4, 11, 2);
  ctx.fill();

  // Belt
  const beltGrad = ctx.createLinearGradient(-7, 5, -7, 8);
  beltGrad.addColorStop(0, '#FFD700');
  beltGrad.addColorStop(1, '#C9A800');
  ctx.fillStyle = beltGrad;
  ctx.fillRect(-7, 5, 14, 3);

  // Belt buckle
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-2, 5.5, 4, 2);

  // Legs
  const legAnim = Math.sin(player.walkFrame * 2.5);
  ctx.fillStyle = '#2B4FBE';
  roundRect(ctx, -5, 10, 4, 5 + legAnim * 2, 1);
  ctx.fill();
  roundRect(ctx, 1, 10, 4, 5 - legAnim * 2, 1);
  ctx.fill();

  // Boots
  ctx.fillStyle = '#5D3A1A';
  roundRect(ctx, -6, 14 + legAnim * 2, 5, 3, 1);
  ctx.fill();
  roundRect(ctx, 1, 14 - legAnim * 2, 5, 3, 1);
  ctx.fill();
  ctx.fillStyle = '#8B5A2B';
  ctx.fillRect(-6, 14 + legAnim * 2, 5, 1);
  ctx.fillRect(1, 14 - legAnim * 2, 5, 1);

  // Arms with walk animation
  const armSwing = Math.sin(player.walkFrame * 2.5) * 20 * Math.PI / 180;
  ctx.save();
  ctx.translate(7, 0);
  ctx.rotate(armSwing);
  ctx.fillStyle = '#2B4FBE';
  ctx.fillRect(0, -2, 5, 3);
  // Hand
  ctx.fillStyle = '#FDBCB4';
  ctx.beginPath();
  ctx.arc(5, -0.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(-7, 0);
  ctx.rotate(-armSwing);
  ctx.fillStyle = '#2B4FBE';
  ctx.fillRect(-5, -2, 5, 3);
  ctx.fillStyle = '#FDBCB4';
  ctx.beginPath();
  ctx.arc(-5, -0.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Pump tool (when active)
  if (state.pump.active || state.pump.targetId !== null) {
    ctx.fillStyle = '#B0B0B0';
    ctx.fillRect(7, -3, 8, 4);
    ctx.fillStyle = '#808080';
    ctx.fillRect(13, -4, 3, 6);
    // Tip glow
    ctx.fillStyle = `rgba(255, 255, 100, ${0.5 + Math.sin(frame * 0.3) * 0.3})`;
    ctx.beginPath();
    ctx.arc(15, -1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  const headGrad = ctx.createRadialGradient(-1, -10, 0, 0, -9, 9);
  headGrad.addColorStop(0, '#FDD4B4');
  headGrad.addColorStop(1, '#E8A890');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(0, -9, 7, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#FDBCB4';
  ctx.beginPath();
  ctx.arc(-7, -9, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -9, 2, 0, Math.PI * 2);
  ctx.fill();

  // Helmet - rounded
  const helmetGrad = ctx.createLinearGradient(-8, -17, 8, -11);
  helmetGrad.addColorStop(0, '#FFFFFF');
  helmetGrad.addColorStop(0.5, '#F0F0F0');
  helmetGrad.addColorStop(1, '#D0D0D0');
  ctx.fillStyle = helmetGrad;
  ctx.beginPath();
  ctx.arc(0, -11, 8, Math.PI, 0);
  ctx.fill();

  // Helmet shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-3, -14, 3, 1.5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Helmet band
  ctx.fillStyle = '#FF3333';
  ctx.fillRect(-8, -12, 16, 2);
  ctx.fillStyle = '#CC0000';
  ctx.fillRect(-8, -10.5, 16, 0.5);

  // Visor
  ctx.fillStyle = '#87CEEB';
  ctx.beginPath();
  ctx.arc(3, -10, 3.5, -1, 0.6);
  ctx.fill();
  ctx.fillStyle = '#B0E0FF';
  ctx.beginPath();
  ctx.arc(2.5, -10.5, 2, -0.8, 0.4);
  ctx.fill();

  // Eyes with blink
  const blinkFrame = player.blinkTimer < 5;
  const eyeH = blinkFrame ? 0.5 : 2;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-1, -11, 2.5, eyeH);
  ctx.fillRect(3, -11, 2.5, eyeH);

  if (!blinkFrame) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, -10.5, 1.5, 1.5);
    ctx.fillRect(4, -10.5, 1.5, 1.5);
    // Eye shine
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, -11, 0.8, 0.8);
    ctx.fillRect(4, -11, 0.8, 0.8);
  }

  // Smile
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(2, -7, 2, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawPlayerDeath(ctx: CanvasRenderingContext2D, player: GE.Player, _frame: number) {
  const px = player.x * T;
  const py = player.y * T;
  const t = player.deathTimer;
  const alpha = Math.max(0, 1 - t / 60);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(px, py);

  // Rising ghost
  ctx.translate(0, -t * 0.8);
  const rotate = Math.sin(t * 0.1) * 0.3;
  ctx.rotate(rotate);

  // Ghost body
  const ghostGrad = ctx.createRadialGradient(0, -5, 0, 0, 0, 12);
  ghostGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  ghostGrad.addColorStop(1, 'rgba(200, 220, 255, 0.3)');
  ctx.fillStyle = ghostGrad;
  ctx.beginPath();
  ctx.arc(0, -5, 10, Math.PI, 0);
  ctx.lineTo(10, 5);
  // Wavy bottom
  for (let i = 10; i >= -10; i -= 2.5) {
    const y = 5 + Math.sin((i + t * 0.5) * 0.5) * 2;
    ctx.lineTo(i, y);
  }
  ctx.closePath();
  ctx.fill();

  // X eyes
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(-2, -4); ctx.moveTo(-2, -7); ctx.lineTo(-5, -4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, -7); ctx.lineTo(5, -4); ctx.moveTo(5, -7); ctx.lineTo(2, -4); ctx.stroke();

  // O mouth
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// =================== ENEMIES ===================

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: GE.Enemy, frame: number, _state: GE.GameState) {
  if (enemy.state === 'popped' || enemy.state === 'crushed') return;

  const px = enemy.x * T;
  const py = enemy.y * T;

  if (enemy.state === 'spawning') {
    const progress = 1 - enemy.spawnTimer / (60 + enemy.id * 30);
    ctx.save();
    ctx.globalAlpha = 0.3 + progress * 0.5;
    ctx.translate(px, py);
    ctx.scale(0.3 + progress * 0.7, 0.3 + progress * 0.7);

    // Spawn swirl
    for (let i = 0; i < 6; i++) {
      const angle = (frame * 0.1 + i * Math.PI / 3);
      const r = 20 * (1 - progress);
      ctx.fillStyle = enemy.type === 'pooka' ? '#FF6B6B' : '#6BCB77';
      ctx.globalAlpha = progress * 0.7;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.3 + progress * 0.5;

    if (enemy.type === 'pooka') drawPookaBody(ctx, frame, enemy);
    else drawFygarBody(ctx, frame, enemy);
    ctx.restore();
    return;
  }

  const scale = 1 + enemy.inflation * 0.25;

  ctx.save();
  ctx.translate(px, py);
  ctx.scale(scale, scale);

  if (enemy.state === 'ghost') {
    ctx.globalAlpha = 0.35 + Math.sin(frame * 0.15) * 0.15;
  }
  if (enemy.state === 'deflating') {
    ctx.globalAlpha = 0.6;
  }

  const flip = enemy.dir === 'left' ? -1 : 1;
  ctx.scale(flip, 1);

  if (enemy.type === 'pooka') drawPookaBody(ctx, frame, enemy);
  else drawFygarBody(ctx, frame, enemy);

  // Inflation pulsing
  if (enemy.inflation > 0) {
    ctx.globalAlpha = 1;
    const r = 12 + enemy.inflation * 5 + Math.sin(frame * 0.4) * 2;
    ctx.strokeStyle = `rgba(255, 100, 100, ${0.3 + enemy.inflation * 0.1})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -frame * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();

  // Alert indicator
  if (enemy.alertLevel > 0.5 && enemy.state === 'normal' && frame % 30 < 15) {
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', px, py - 18);
  }

  // Angry indicator
  if (enemy.angryTimer > 0 && frame % 20 < 10) {
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💢', px, py - 20);
  }
}

function drawPookaBody(ctx: CanvasRenderingContext2D, _frame: number, enemy: GE.Enemy) {
  const walkBob = Math.sin(enemy.walkFrame * 2.5) * 1.5;
  const breathe = Math.sin(enemy.breatheAnim) * 0.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 13, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body gradient - tomato
  const bodyGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 13);
  bodyGrad.addColorStop(0, '#FF7070');
  bodyGrad.addColorStop(0.4, '#DC143C');
  bodyGrad.addColorStop(0.8, '#A00020');
  bodyGrad.addColorStop(1, '#600010');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 11 + breathe, 0, Math.PI * 2);
  ctx.fill();

  // Body highlight
  ctx.fillStyle = 'rgba(255, 220, 220, 0.5)';
  ctx.beginPath();
  ctx.ellipse(-4, -5, 4, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Body outline
  ctx.strokeStyle = 'rgba(60, 0, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 11 + breathe, 0, Math.PI * 2);
  ctx.stroke();

  // Goggles strap
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(-11, -6, 22, 3);
  ctx.fillStyle = '#8B7020';
  ctx.fillRect(-11, -3.5, 22, 0.5);

  // Goggles frames
  const gogGrad = ctx.createLinearGradient(-9, -9, -9, -2);
  gogGrad.addColorStop(0, '#FFD700');
  gogGrad.addColorStop(1, '#B8860B');
  ctx.fillStyle = gogGrad;
  roundRect(ctx, -9, -9, 8, 8, 2);
  ctx.fill();
  roundRect(ctx, 1, -9, 8, 8, 2);
  ctx.fill();

  // Goggle lenses
  const lensGrad = ctx.createRadialGradient(-5, -5, 0, -5, -5, 4);
  lensGrad.addColorStop(0, '#FFFFFF');
  lensGrad.addColorStop(0.7, '#E0F0FF');
  lensGrad.addColorStop(1, '#A0C0E0');
  ctx.fillStyle = lensGrad;
  roundRect(ctx, -8, -8, 6, 6, 1);
  ctx.fill();
  roundRect(ctx, 2, -8, 6, 6, 1);
  ctx.fill();

  // Lens shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(-7, -7, 2, 1.5);
  ctx.fillRect(3, -7, 2, 1.5);

  // Pupils following player
  const pupilX = enemy.eyeTargetX * 0.6;
  const pupilY = enemy.eyeTargetY * 0.4;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-5 + pupilX, -5 + pupilY, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5 + pupilX, -5 + pupilY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  if (enemy.angryTimer > 0 || enemy.alertLevel > 0.7) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 4, 3, 0, Math.PI);
    ctx.stroke();
    // Teeth
    ctx.fillStyle = '#FFF';
    ctx.fillRect(-1, 4, 1, 1);
    ctx.fillRect(0, 4, 1, 1);
  }

  // Feet
  ctx.fillStyle = '#A00020';
  ctx.beginPath();
  ctx.ellipse(-5, 11 + walkBob, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5, 11 - walkBob, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Foot shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-6, 10 + walkBob, 1.5, 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, 10 - walkBob, 1.5, 1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFygarBody(ctx: CanvasRenderingContext2D, frame: number, enemy: GE.Enemy) {
  const walkBob = Math.sin(enemy.walkFrame * 2) * 1.5;
  const breathe = Math.sin(enemy.breatheAnim) * 0.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 15, 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  const tailWag = Math.sin(frame * 0.12) * 5;
  ctx.save();
  const tailGrad = ctx.createLinearGradient(-10, 0, -22, 0);
  tailGrad.addColorStop(0, '#228B22');
  tailGrad.addColorStop(1, '#0A5C0A');
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-16, -2 + tailWag, -20, 0 + tailWag);
  ctx.quadraticCurveTo(-22, 4 + tailWag, -20, 5 + tailWag);
  ctx.quadraticCurveTo(-16, 6 + tailWag, -10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Tail spikes
  ctx.fillStyle = '#FF6600';
  ctx.beginPath();
  ctx.moveTo(-16, -2 + tailWag);
  ctx.lineTo(-14, -7 + tailWag);
  ctx.lineTo(-12, -1 + tailWag);
  ctx.fill();

  // Body gradient - dragon
  const bodyGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 13);
  bodyGrad.addColorStop(0, '#5CD65C');
  bodyGrad.addColorStop(0.5, '#228B22');
  bodyGrad.addColorStop(1, '#0A4C0A');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12 + breathe, 10 + breathe, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  const bellyGrad = ctx.createLinearGradient(0, 0, 0, 8);
  bellyGrad.addColorStop(0, '#C8F0C8');
  bellyGrad.addColorStop(1, '#90D090');
  ctx.fillStyle = bellyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 3, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body outline
  ctx.strokeStyle = 'rgba(0, 40, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12 + breathe, 10 + breathe, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Snout
  const snoutGrad = ctx.createLinearGradient(8, -6, 18, 6);
  snoutGrad.addColorStop(0, '#228B22');
  snoutGrad.addColorStop(1, '#0A5C0A');
  ctx.fillStyle = snoutGrad;
  ctx.beginPath();
  ctx.moveTo(8, -6);
  ctx.lineTo(17, -3);
  ctx.lineTo(17, 3);
  ctx.lineTo(8, 6);
  ctx.fill();

  // Nostril
  ctx.fillStyle = '#0A4A0A';
  ctx.beginPath();
  ctx.ellipse(15, 0, 1.5, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spikes on head
  ctx.fillStyle = '#FF6600';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-3 + i * 5, -10);
    ctx.lineTo(-1 + i * 5, -17 - i);
    ctx.lineTo(1 + i * 5, -10);
    ctx.fill();
  }
  // Spike highlights
  ctx.fillStyle = '#FFA500';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-3 + i * 5, -10);
    ctx.lineTo(-2 + i * 5, -14 - i);
    ctx.lineTo(-1 + i * 5, -10);
    ctx.fill();
  }

  // Eye white
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(10, -4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Eye iris (red - dragon)
  const irisGrad = ctx.createRadialGradient(11, -4, 0, 11, -4, 3);
  irisGrad.addColorStop(0, '#FF4444');
  irisGrad.addColorStop(1, '#8B0000');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(11, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(11.5 + enemy.eyeTargetX * 0.3, -4 + enemy.eyeTargetY * 0.2, 1.2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#FFF';
  ctx.fillRect(10.5, -5, 1.2, 1.2);

  // Fire breath
  if (enemy.fireActive) {
    for (let i = 0; i < 7; i++) {
      const d = i * enemy.fireLength * 0.18;
      const size = 4 + i * 1.8;
      const fireColors = ['#FFEE00', '#FFCC00', '#FF8800', '#FF4400', '#CC0000', '#880000', '#440000'];
      ctx.fillStyle = fireColors[Math.min(i, fireColors.length - 1)];
      ctx.globalAlpha = 0.8 - i * 0.1;
      ctx.beginPath();
      ctx.arc(17 + d * T * 0.07, Math.sin(frame * 0.5 + i) * 2, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Legs
  ctx.fillStyle = '#0A4C0A';
  roundRect(ctx, -6, 8, 5, 5 + walkBob, 1);
  ctx.fill();
  roundRect(ctx, 2, 8, 5, 5 - walkBob, 1);
  ctx.fill();

  // Claws
  ctx.fillStyle = '#FF6600';
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-6 + i * 2, 12 + walkBob);
    ctx.lineTo(-7 + i * 2, 14 + walkBob);
    ctx.lineTo(-5 + i * 2, 14 + walkBob);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2 + i * 2, 12 - walkBob);
    ctx.lineTo(1 + i * 2, 14 - walkBob);
    ctx.lineTo(3 + i * 2, 14 - walkBob);
    ctx.fill();
  }
}

// =================== ROCK ===================

function drawRock(ctx: CanvasRenderingContext2D, rock: GE.Rock, _frame: number) {
  const px = rock.x * T;
  const py = rock.y * T;

  ctx.save();
  ctx.translate(px, py);

  if (rock.state === 'unstable') {
    const wobble = Math.sin(rock.wobble * 3) * (1 + rock.wobble * 0.1);
    ctx.rotate(wobble * 0.08);

    // Warning glow
    const glowIntensity = 0.3 + Math.sin(rock.wobble * 5) * 0.3;
    ctx.shadowColor = `rgba(255, 200, 0, ${glowIntensity})`;
    ctx.shadowBlur = 12;
  }

  if (rock.state === 'falling') {
    ctx.rotate(rock.fallDistance * 0.1);
    ctx.shadowColor = 'rgba(255, 100, 0, 0.5)';
    ctx.shadowBlur = 15;
  }

  if (rock.state === 'shattered') {
    const progress = 1 - rock.shatterTimer / 30;
    ctx.globalAlpha = 1 - progress;
    ctx.scale(1 + progress * 0.5, 1 - progress * 0.5);
  }

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(2, 15, 12, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Rock body with gradient
  const rockGrad = ctx.createRadialGradient(-5, -5, 1, 0, 0, 16);
  rockGrad.addColorStop(0, '#B8B8B8');
  rockGrad.addColorStop(0.3, '#909090');
  rockGrad.addColorStop(0.7, '#606060');
  rockGrad.addColorStop(1, '#404040');
  ctx.fillStyle = rockGrad;

  ctx.beginPath();
  ctx.moveTo(-13, -2);
  ctx.lineTo(-9, -13);
  ctx.lineTo(2, -15);
  ctx.lineTo(13, -11);
  ctx.lineTo(15, -3);
  ctx.lineTo(13, 9);
  ctx.lineTo(5, 13);
  ctx.lineTo(-9, 11);
  ctx.lineTo(-15, 4);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cracks
  ctx.strokeStyle = 'rgba(30, 30, 30, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-4, -11);
  ctx.lineTo(-2, -3);
  ctx.lineTo(4, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, -9);
  ctx.lineTo(2, -2);
  ctx.lineTo(0, 6);
  ctx.stroke();

  // Highlight
  ctx.fillStyle = 'rgba(220, 220, 240, 0.5)';
  ctx.beginPath();
  ctx.moveTo(-7, -11);
  ctx.lineTo(0, -13);
  ctx.lineTo(5, -9);
  ctx.lineTo(-2, -5);
  ctx.closePath();
  ctx.fill();

  // Moss patches
  ctx.fillStyle = '#4A8B4A';
  ctx.beginPath();
  ctx.arc(-9, 9, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6AAB6A';
  ctx.beginPath();
  ctx.arc(-8, 8, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4A8B4A';
  ctx.beginPath();
  ctx.arc(10, -8, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// =================== PUMP HOSE ===================

function drawPump(ctx: CanvasRenderingContext2D, state: GE.GameState, frame: number) {
  const player = state.player;
  const pump = state.pump;
  const px = player.x * T;
  const py = player.y * T;

  if (pump.targetId !== null) {
    const enemy = state.enemies.find(e => e.id === pump.targetId);
    if (enemy) {
      const ex = enemy.x * T;
      const ey = enemy.y * T;

      // Hose with animated dashes
      ctx.strokeStyle = '#E8E8F0';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -frame * 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      const midX = (px + ex) / 2;
      const midY = (py + ey) / 2;
      const sag = Math.sin(frame * 0.08) * 10;
      ctx.quadraticCurveTo(midX, midY + sag, ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hose outline
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tip glow
      const tipGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 10);
      tipGlow.addColorStop(0, 'rgba(255, 255, 100, 0.8)');
      tipGlow.addColorStop(1, 'rgba(255, 255, 100, 0)');
      ctx.fillStyle = tipGlow;
      ctx.fillRect(ex - 10, ey - 10, 20, 20);

      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pump.active) {
    const [dx, dy] = GE.dirToDxDy(pump.dir);
    const endX = px + dx * pump.hoseLength * T;
    const endY = py + dy * pump.hoseLength * T;

    // Hose
    ctx.strokeStyle = '#E8E8F0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Tip
    const tipGlow = ctx.createRadialGradient(endX, endY, 0, endX, endY, 8);
    tipGlow.addColorStop(0, 'rgba(255, 255, 100, 0.8)');
    tipGlow.addColorStop(1, 'rgba(255, 255, 100, 0)');
    ctx.fillStyle = tipGlow;
    ctx.fillRect(endX - 8, endY - 8, 16, 16);

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =================== VEGETABLES ===================

function drawVegetables(ctx: CanvasRenderingContext2D, vegetables: GE.Vegetable[], frame: number) {
  const vegEmojis = ['🥕', '🍆', '🌽', '🍅', '🫑', '🍄'];

  for (const veg of vegetables) {
    if (veg.collected) continue;
    const px = veg.x * T;
    const py = veg.y * T + Math.sin(veg.bounceTimer) * 5;

    // Glow
    const glowSize = 20 + Math.sin(frame * 0.1) * 4;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
    glow.addColorStop(0, 'rgba(255, 255, 150, 0.4)');
    glow.addColorStop(1, 'rgba(255, 255, 100, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(px - glowSize, py - glowSize, glowSize * 2, glowSize * 2);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px, veg.y * T + 14, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Emoji
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(vegEmojis[veg.type % vegEmojis.length], px, py);

    // Timer indicator
    if (veg.lifeTimer < 150) {
      ctx.globalAlpha = 0.6 + Math.sin(frame * 0.3) * 0.4;
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (veg.lifeTimer / 150));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

// =================== POWER-UPS ===================

function drawPowerUps(ctx: CanvasRenderingContext2D, powerUps: GE.PowerUp[], frame: number) {
  const puData = {
    speed: { emoji: '⚡', color: '#00BFFF', name: 'VITESSE' },
    invincibility: { emoji: '🛡️', color: '#FFD700', name: 'BOUCLIER' },
    doublePoints: { emoji: '✨', color: '#FF00FF', name: '×2 POINTS' },
    extraLife: { emoji: '❤️', color: '#FF3366', name: 'VIE' },
  };

  for (const pu of powerUps) {
    const px = pu.x * T;
    const py = pu.y * T + Math.sin(pu.bounceTimer) * 4;
    const data = puData[pu.type];

    // Rotating outer glow
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(pu.rotation);

    // Rainbow ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.fillStyle = `hsl(${(i * 45 + frame * 3) % 360}, 100%, 60%)`;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 14, Math.sin(angle) * 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Glow
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 18);
    glow.addColorStop(0, data.color + 'CC');
    glow.addColorStop(1, data.color + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(px - 18, py - 18, 36, 36);

    // Emoji
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.emoji, px, py);

    // Timer
    if (pu.lifeTimer < 180) {
      ctx.globalAlpha = 0.6 + Math.sin(frame * 0.3) * 0.4;
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pu.lifeTimer / 600));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

// =================== PARTICLES ===================

function drawParticles(ctx: CanvasRenderingContext2D, particles: GE.Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    const sx = p.x * T;
    const sy = p.y * T;
    const s = p.size * (0.5 + alpha * 0.5);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.rotation);

    switch (p.type) {
      case 'circle':
        // Add glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      case 'star':
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        drawStar(ctx, 0, 0, s, s * 0.5, 5);
        ctx.shadowBlur = 0;
        break;
      case 'spark':
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 3;
        ctx.fillRect(-s * 2, -0.5, s * 4, 1);
        ctx.fillRect(-0.5, -s * 2, 1, s * 4);
        ctx.shadowBlur = 0;
        break;
      default:
        ctx.fillRect(-s / 2, -s / 2, s, s);
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, points: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// =================== FLOATING TEXTS ===================

function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: GE.FloatingText[], frame: number) {
  for (const ft of texts) {
    const alpha = Math.min(1, ft.life / ft.maxLife * 1.5);
    const rise = (1 - ft.life / ft.maxLife) * 35;
    ctx.globalAlpha = alpha;

    ctx.save();
    ctx.translate(ft.x * T, ft.y * T - rise);

    // Pulsing scale
    const pulse = 1 + Math.sin(frame * 0.2) * 0.05;
    ctx.scale(ft.scale * pulse, ft.scale * pulse);

    // Outline
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, 0, 0);

    // Text
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, 0, 0);

    // Glow
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.fillText(ft.text, 0, 0);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// =================== VIGNETTE ===================

function drawVignette(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createRadialGradient(
    GE.CANVAS_W / 2, GE.GRID_H * T / 2, GE.CANVAS_W * 0.3,
    GE.CANVAS_W / 2, GE.GRID_H * T / 2, GE.CANVAS_W * 0.7
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GE.CANVAS_W, GE.GRID_H * T);
}

// =================== UI ===================

function drawUI(ctx: CanvasRenderingContext2D, state: GE.GameState, frame: number) {
  // UI Background with gradient
  const uiGrad = ctx.createLinearGradient(0, 0, 0, UI);
  uiGrad.addColorStop(0, '#1A0A30');
  uiGrad.addColorStop(0.5, '#2A1050');
  uiGrad.addColorStop(1, '#0D0520');
  ctx.fillStyle = uiGrad;
  ctx.fillRect(0, 0, GE.CANVAS_W, UI);

  // Animated border
  const borderGrad = ctx.createLinearGradient(0, 0, GE.CANVAS_W, 0);
  borderGrad.addColorStop(0, '#8B00FF');
  borderGrad.addColorStop(0.5, '#FF00FF');
  borderGrad.addColorStop(1, '#8B00FF');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, UI - 1);
  ctx.lineTo(GE.CANVAS_W, UI - 1);
  ctx.stroke();

  // Score section
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 10, 15);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillText(state.score.toString().padStart(7, '0'), 10, 32);

  // High score
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF6B6B';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.fillText('MEILLEUR', GE.CANVAS_W / 2, 14);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText(Math.max(state.score, state.highScore).toString().padStart(7, '0'), GE.CANVAS_W / 2, 30);

  // Level
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6BCB77';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.fillText(`NIVEAU ${state.level}`, GE.CANVAS_W - 10, 14);

  // Lives as mini helmets
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('VIES', GE.CANVAS_W - 10, 30);
  for (let i = 0; i < state.lives; i++) {
    const lx = GE.CANVAS_W - 50 - i * 14;
    const ly = 25;
    // Helmet
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(lx, ly, 4, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(lx - 3.5, ly, 7, 3);
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(lx - 3.5, ly - 0.5, 7, 0.5);
  }

  // Active power-ups display
  let puX = 10;
  const puY = 48;
  if (state.playerPowerUps.speed > 0) {
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚡', puX, puY);
    puX += 14;
  }
  if (state.playerPowerUps.invincibility > 0) {
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🛡️', puX, puY);
    puX += 14;
  }
  if (state.playerPowerUps.doublePoints > 0) {
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('✨', puX, puY);
    puX += 14;
  }

  // Combo display
  if (state.player.combo > 1) {
    const hue = (frame * 5) % 360;
    ctx.textAlign = 'center';
    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(`COMBO x${state.player.combo}!`, GE.CANVAS_W / 2, 48);
    ctx.fillText(`COMBO x${state.player.combo}!`, GE.CANVAS_W / 2, 48);
  }

  // Bonus timer bar (right side)
  if (state.bonusTimer > 0) {
    const barWidth = 80;
    const barX = GE.CANVAS_W - barWidth - 10;
    const barY = 42;
    const ratio = Math.min(1, state.bonusTimer / 3000);

    ctx.fillStyle = '#222';
    roundRect(ctx, barX, barY, barWidth, 7, 2);
    ctx.fill();

    const barColor = ratio > 0.5 ? '#6BCB77' : ratio > 0.2 ? '#FFD93D' : '#FF6B6B';
    ctx.fillStyle = barColor;
    roundRect(ctx, barX + 1, barY + 1, (barWidth - 2) * ratio, 5, 2);
    ctx.fill();

    // Glow when low
    if (ratio < 0.2 && frame % 30 < 15) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      roundRect(ctx, barX, barY, barWidth, 7, 2);
      ctx.fill();
    }
  }
}

// =================== OVERLAYS ===================

function drawReady(ctx: CanvasRenderingContext2D, state: GE.GameState, frame: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, UI, GE.CANVAS_W, GE.CANVAS_H - UI);

  const bw = 280, bh = 90;
  const bx = (GE.CANVAS_W - bw) / 2;
  const by = GE.CANVAS_H / 2 - bh / 2 + 10;

  // Animated border
  const borderHue = (frame * 3) % 360;
  ctx.strokeStyle = `hsl(${borderHue}, 80%, 60%)`;
  ctx.lineWidth = 3;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.stroke();

  ctx.fillStyle = 'rgba(20, 10, 50, 0.95)';
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fill();

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 26px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 10;
  ctx.fillText(`NIVEAU ${state.level}`, GE.CANVAS_W / 2, by + 38);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#FFF';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('PRÊT ?', GE.CANVAS_W / 2, by + 65);
}

function drawPaused(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, UI, GE.CANVAS_W, GE.CANVAS_H - UI);

  const bw = 260, bh = 90;
  const bx = (GE.CANVAS_W - bw) / 2;
  const by = GE.CANVAS_H / 2 - bh / 2;

  ctx.strokeStyle = '#6BCB77';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(20, 30, 20, 0.95)';
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fill();

  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⏸ PAUSE', GE.CANVAS_W / 2, by + 38);

  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = '#AAA';
  ctx.fillText('Appuyez sur P pour reprendre', GE.CANVAS_W / 2, by + 65);
}

function drawLevelComplete(ctx: CanvasRenderingContext2D, state: GE.GameState, frame: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, UI, GE.CANVAS_W, GE.CANVAS_H - UI);

  const bw = 320, bh = 120;
  const bx = (GE.CANVAS_W - bw) / 2;
  const by = GE.CANVAS_H / 2 - bh / 2;

  // Rainbow animated border
  const borderHue = (frame * 5) % 360;
  ctx.strokeStyle = `hsl(${borderHue}, 90%, 60%)`;
  ctx.lineWidth = 3;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.stroke();

  ctx.fillStyle = 'rgba(10, 40, 10, 0.95)';
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fill();

  ctx.fillStyle = '#6BCB77';
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#6BCB77';
  ctx.shadowBlur = 12;
  ctx.fillText('🎉 NIVEAU TERMINÉ!', GE.CANVAS_W / 2, by + 38);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px "Courier New", monospace';
  const timeBonus = Math.floor(state.bonusTimer / 10) * 10;
  ctx.fillText(`BONUS: ${timeBonus}`, GE.CANVAS_W / 2, by + 70);

  if (state.enemiesKilledThisLevel === state.totalEnemiesThisLevel) {
    ctx.fillStyle = `hsl(${(frame * 5) % 360}, 100%, 70%)`;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText('★ PARFAIT! ★', GE.CANVAS_W / 2, by + 100);
  }
}

function drawGameOver(ctx: CanvasRenderingContext2D, state: GE.GameState, frame: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, UI, GE.CANVAS_W, GE.CANVAS_H - UI);

  const bw = 320, bh = 140;
  const bx = (GE.CANVAS_W - bw) / 2;
  const by = GE.CANVAS_H / 2 - bh / 2;

  ctx.strokeStyle = '#FF3333';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(50, 5, 5, 0.95)';
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fill();

  ctx.fillStyle = '#FF3333';
  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#FF0000';
  ctx.shadowBlur = 15;
  ctx.fillText('FIN DE PARTIE', GE.CANVAS_W / 2, by + 45);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillText(`SCORE: ${state.score.toLocaleString('fr-FR')}`, GE.CANVAS_W / 2, by + 75);

  ctx.fillStyle = '#FFD700';
  ctx.font = '13px "Courier New", monospace';
  ctx.fillText(`NIVEAU ATTEINT: ${state.level}`, GE.CANVAS_W / 2, by + 100);

  if (state.score >= state.highScore && state.score > 0) {
    ctx.fillStyle = `hsl(${(frame * 3) % 360}, 100%, 70%)`;
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillText('★ NOUVEAU RECORD! ★', GE.CANVAS_W / 2, by + 125);
  }
}

// =================== UTILITY ===================

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
