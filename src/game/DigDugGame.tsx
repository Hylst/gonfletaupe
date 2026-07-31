// ============================
// GONFLE-TAUPE : composant principal
// Par Hylst - Geoffroy
// ============================

import { useRef, useEffect } from 'react';
import * as GE from './gameEngine';
import * as Audio from './audio';
import { render } from './renderer';

interface DigDugGameProps {
  onGameOver: (score: number, level: number) => void;
  highScore: number;
}

export default function DigDugGame({ onGameOver, highScore }: DigDugGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GE.GameState>(GE.createGameState(1, 0, 3, highScore));
  const keysRef = useRef<Set<string>>(new Set());
  const keysJustPressedRef = useRef<Set<string>>(new Set());
  const onGameOverRef = useRef(onGameOver);
  const frameCountRef = useRef(0);
  const gameOverCalledRef = useRef(false);

  onGameOverRef.current = onGameOver;

  useEffect(() => {
    Audio.initAudio();
    Audio.startMusic();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'].includes(e.key)) {
        e.preventDefault();
      }

      if (!keysRef.current.has(e.key)) {
        keysJustPressedRef.current.add(e.key);
      }
      keysRef.current.add(e.key);

      if (e.key === 'p' || e.key === 'P') {
        const state = stateRef.current;
        if (state.screen === 'playing') {
          state.screen = 'paused';
          Audio.pauseMusic();
        } else if (state.screen === 'paused') {
          state.screen = 'playing';
          Audio.resumeMusic();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) keysRef.current.add('MOUSE_DIG');
    };

    const handleMouseUp = () => {
      keysRef.current.delete('MOUSE_DIG');
    };

    const handleTouchStart = (_e: TouchEvent) => {
      keysRef.current.add('MOUSE_DIG');
    };

    const handleTouchEnd = () => {
      keysRef.current.delete('MOUSE_DIG');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const loop = () => {
      frameCountRef.current++;
      const state = stateRef.current;

      if (state.screen === 'gameover') {
        GE.updateParticles(state);
        GE.updateFloatingTexts(state);
        GE.updateGlobalTime(state);
        render(ctx, state, frameCountRef.current);
        if (!gameOverCalledRef.current) {
          gameOverCalledRef.current = true;
          setTimeout(() => onGameOverRef.current(state.score, state.level), 2500);
        }
        animationId = requestAnimationFrame(loop);
        return;
      }

      if (state.screen === 'levelcomplete') {
        state.levelTransitionTimer--;
        GE.updateParticles(state);
        GE.updateFloatingTexts(state);
        GE.updateGlobalTime(state);
        GE.updateScreenFlash(state);
        if (state.levelTransitionTimer <= 0) {
          stateRef.current = GE.createGameState(
            state.level + 1,
            state.score,
            state.lives,
            Math.max(state.score, state.highScore)
          );
        }
      }

      if (state.screen === 'playing') {
        if (state.readyTimer > 0) {
          state.readyTimer--;
        } else {
          GE.updatePlayer(state, keysRef.current);
          GE.updateEnemies(state);
          GE.updatePump(state,
            keysJustPressedRef.current.has(' ') ||
            keysJustPressedRef.current.has('Space')
          );
          GE.updateRocks(state);
          GE.checkCollisions(state);
          GE.checkWinCondition(state);
          GE.updateHurryUp(state);
          GE.updateVegetables(state);
          GE.updatePowerUps(state);
        }

        GE.updateParticles(state);
        GE.updateFloatingTexts(state);
        GE.updateBonusTimer(state);
        GE.updateShake(state);
        GE.updateGlobalTime(state);
        GE.updateScreenFlash(state);
        GE.updateSlowMotion(state);
      }

      if (state.screen === 'paused') {
        GE.updateGlobalTime(state);
      }

      keysJustPressedRef.current.clear();

      render(ctx, state, frameCountRef.current);

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      Audio.stopMusic();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={GE.CANVAS_W}
      height={GE.CANVAS_H}
      className="block rounded-lg shadow-2xl"
      style={{
        imageRendering: 'auto',
        maxWidth: '100%',
        maxHeight: 'calc(100vh - 60px)',
        border: '3px solid #4A2080',
        boxShadow: '0 0 30px rgba(74, 32, 128, 0.4), 0 0 60px rgba(74, 32, 128, 0.2)',
      }}
    />
  );
}
