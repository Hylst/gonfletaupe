// ============================
// GONFLE-TAUPE : Application React
// Créé par Hylst - Geoffroy
// ============================

import { useState, useCallback, useEffect } from 'react';
import DigDugGame from './game/DigDugGame';
import { initAudio, playMenuSelect } from './game/audio';

type Screen = 'menu' | 'playing' | 'gameover';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [showInfo, setShowInfo] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('gonfletaupe_hylst_highscore') || '0');
    } catch {
      return 0;
    }
  });

  const handleGameOver = useCallback((finalScore: number, finalLevel: number) => {
    setScore(finalScore);
    setLevel(finalLevel);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        localStorage.setItem('gonfletaupe_hylst_highscore', String(finalScore));
      } catch { /* ignore */ }
    }
    setScreen('gameover');
  }, [highScore]);

  const handleStart = useCallback(() => {
    initAudio();
    playMenuSelect();
    setScreen('playing');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (screen === 'menu' || screen === 'gameover') {
          e.preventDefault();
          handleStart();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen, handleStart]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a20] via-[#0f0830] to-[#1a0a10] flex flex-col items-center justify-center p-2 sm:p-4 select-none overflow-hidden">

      {/* Fond animé décoratif */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-80 h-80 rounded-full bg-purple-900/10 blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 rounded-full bg-blue-900/10 blur-3xl -bottom-32 -right-32 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-64 h-64 rounded-full bg-red-900/8 blur-3xl top-1/2 left-1/3 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {screen === 'menu' && (
        <div className="text-center relative z-10 max-w-lg mx-auto px-4">
          {/* Logo */}
          <div className="mb-2">
            <h1
              className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 leading-tight"
              style={{
                fontFamily: '"Courier New", monospace',
                WebkitTextStroke: '1px rgba(255,200,0,0.3)',
                filter: 'drop-shadow(3px 3px 0 #cc3300) drop-shadow(-1px -1px 0 #ff8800)',
                letterSpacing: '6px',
              }}
            >
              GONFLE-TAUPE
            </h1>
            <div className="h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-yellow-500 to-transparent mt-1 rounded" />
          </div>

          <p className="text-yellow-400/80 text-sm sm:text-base mb-6 tracking-[0.3em] uppercase"
             style={{ fontFamily: '"Courier New", monospace' }}>
            Aventure Souterraine
          </p>

          {/* Instructions */}
          <div className="bg-gradient-to-b from-[#1a1040] to-[#0d0825] border border-purple-800/50 p-4 sm:p-5 mb-6 rounded-xl shadow-lg shadow-purple-900/20">
            <h2 className="text-white text-sm sm:text-base mb-4 font-bold tracking-wider uppercase border-b border-purple-700/40 pb-2">
              Comment Jouer
            </h2>
            <div className="text-gray-300 text-left space-y-2 text-xs sm:text-sm">
              <p className="flex items-start gap-2">
                <span className="text-yellow-400 text-base leading-none mt-0.5">⬆⬇⬅➡</span>
                <span><span className="text-white font-semibold">Flèches / ZQSD</span> : se déplacer dans les tunnels</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-400 text-base leading-none mt-0.5">⇧ / 🖱️</span>
                <span><span className="text-white font-semibold">Maj / Souris / Tactile</span> : maintenir pour creuser la terre</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-cyan-400 text-base leading-none mt-0.5">⎵</span>
                <span><span className="text-white font-semibold">Espace</span> : pomper pour gonfler les ennemis</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-400 text-base leading-none mt-0.5">🪨</span>
                <span><span className="text-white font-semibold">Rochers</span> : creusez juste dessous pour les lâcher sur les ennemis !</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-400 text-base leading-none mt-0.5">👻</span>
                <span><span className="text-white font-semibold">Fantômes</span> : seuls eux peuvent traverser la terre, jamais les rochers</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-400 text-base leading-none mt-0.5">🐉</span>
                <span><span className="text-white font-semibold">Fygars</span> : dragons verts cracheurs de feu !</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-purple-400 text-base leading-none mt-0.5">✨</span>
                <span><span className="text-white font-semibold">Combos</span> : enchaînez les éliminations pour des points bonus</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-gray-400 text-base leading-none mt-0.5">⏸</span>
                <span><span className="text-white font-semibold">P</span> : mettre en pause</span>
              </p>
            </div>
          </div>

          {/* Bouton Start */}
          <button
            onClick={handleStart}
            className="group px-10 py-3 bg-gradient-to-b from-red-600 to-red-800 text-white font-bold text-lg sm:text-xl rounded-xl
                       hover:from-red-500 hover:to-red-700 transition-all duration-200 cursor-pointer
                       shadow-lg shadow-red-900/40 hover:shadow-red-800/60 hover:scale-105
                       border border-red-500/30 active:scale-95"
            style={{ fontFamily: '"Courier New", monospace', letterSpacing: '3px' }}
          >
            ▶ JOUER
          </button>

          <p
            className="blink text-yellow-400/70 text-sm mt-5"
            style={{ fontFamily: '"Courier New", monospace' }}
          >
            APPUYEZ SUR ENTRÉE POUR COMMENCER
          </p>

          {highScore > 0 && (
            <p
              className="text-yellow-600/60 mt-3 text-xs"
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              MEILLEUR SCORE : {highScore.toLocaleString('fr-FR')}
            </p>
          )}

          {/* Crédits */}
          <div className="mt-6 pt-4 border-t border-purple-900/30">
            <p className="text-purple-300/70 text-xs uppercase tracking-wider">
              Créé par <span className="font-semibold">Hylst - Geoffroy</span>
            </p>
            <p className="text-purple-400/40 text-[10px] mt-1 italic">
              avec l'aide d'une IA
            </p>
            <p className="text-gray-600 text-[10px] mt-2">
              Clavier requis • Meilleur sur bureau
            </p>
            <button
              onClick={() => setShowInfo(true)}
              className="mt-3 text-purple-300/70 text-[10px] uppercase tracking-wider underline decoration-dotted hover:text-purple-200 transition-colors cursor-pointer"
            >
              ℹ️ Comment ce jeu a été fait
            </button>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowInfo(false)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-gradient-to-b from-[#1a1040] to-[#0d0825] border border-purple-800/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 sm:p-6 space-y-3.5 text-sm leading-relaxed text-gray-300">
              <h3 className="text-white text-lg font-bold tracking-wider uppercase border-b border-purple-700/40 pb-2">Comment ce jeu a été fait</h3>
              <p><strong className="text-white">Stack :</strong> React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, compilé en un seul fichier HTML, aucune dépendance chargée depuis l'extérieur.</p>
              <p><strong className="text-white">Graphismes :</strong> tout est dessiné en Canvas 2D à chaque image (tunnels, taupe, rochers, ennemis), aucun sprite ni image externe.</p>
              <p><strong className="text-white">Musique &amp; sons :</strong> synthétisés en direct avec l'API Web Audio, aucun fichier audio chargé.</p>
              <p><strong className="text-white">Interactions :</strong> clavier (flèches ou ZQSD pour se déplacer et creuser en poussant contre la terre), espace maintenu pour pomper un ennemi ciblé au harpon jusqu'à ce qu'il explose.</p>
              <p><strong className="text-white">Architecture :</strong> moteur de jeu et rendu séparés (`gameEngine.ts` pur, `renderer.ts` pour le dessin), une seule boucle de jeu qui met à jour la grille de terre, les rochers et chaque ennemi selon son propre état (fantôme traversant la terre, gonflement, fuite).</p>
              <p><strong className="text-white">Algorithmes notables :</strong> les rochers vérifient à chaque tick la case juste en dessous d'eux : creuser cette case déclenche leur chute, qui écrase tout ennemi sur la trajectoire sauf les fantômes (seuls capables de traverser la terre non creusée). Les Fygars crachent du feu en ligne droite si la taupe est alignée avec eux, leur nombre augmentant avec le niveau.</p>
            </div>
            <div className="border-t border-purple-900/30 p-4 text-center">
              <button onClick={() => setShowInfo(false)} className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 active:scale-95 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'playing' && (
        <DigDugGame onGameOver={handleGameOver} highScore={highScore} />
      )}

      {screen === 'gameover' && (
        <div className="text-center relative z-10 max-w-md mx-auto px-4">
          {/* Titre Game Over */}
          <h1
            className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-700 mb-4"
            style={{
              fontFamily: '"Courier New", monospace',
              filter: 'drop-shadow(2px 2px 0 #330000)',
            }}
          >
            FIN DE PARTIE
          </h1>

          {/* Score card */}
          <div className="bg-gradient-to-b from-[#1a1040] to-[#0d0825] border border-purple-800/40 p-5 sm:p-6 rounded-xl mb-6 shadow-lg">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Score final</p>
            <p
              className="text-white text-3xl sm:text-4xl font-bold mb-2"
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              {score.toLocaleString('fr-FR')}
            </p>
            <p className="text-gray-500 text-sm">
              Niveau atteint : <span className="text-green-400 font-bold">{level}</span>
            </p>

            {score >= highScore && score > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-800/30">
                <p
                  className="blink text-yellow-400 text-base font-bold"
                  style={{ fontFamily: '"Courier New", monospace' }}
                >
                  ⭐ NOUVEAU RECORD ! ⭐
                </p>
              </div>
            )}
          </div>

          <p
            className="text-gray-500 mb-6 text-xs"
            style={{ fontFamily: '"Courier New", monospace' }}
          >
            MEILLEUR SCORE : {highScore.toLocaleString('fr-FR')}
          </p>

          <button
            onClick={handleStart}
            className="group px-10 py-3 bg-gradient-to-b from-red-600 to-red-800 text-white font-bold text-lg sm:text-xl rounded-xl
                       hover:from-red-500 hover:to-red-700 transition-all duration-200 cursor-pointer
                       shadow-lg shadow-red-900/40 hover:shadow-red-800/60 hover:scale-105
                       border border-red-500/30 active:scale-95"
            style={{ fontFamily: '"Courier New", monospace', letterSpacing: '3px' }}
          >
            🔄 REJOUER
          </button>

          <p
            className="blink text-yellow-400/60 text-sm mt-5"
            style={{ fontFamily: '"Courier New", monospace' }}
          >
            APPUYEZ SUR ENTRÉE POUR RECOMMENCER
          </p>

          <div className="mt-8 pt-3 border-t border-purple-900/30">
            <p className="text-purple-400/40 text-[10px] uppercase tracking-wider">
              Créé par <span className="text-purple-300/60 font-semibold">Hylst - Geoffroy</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
