# Structure de Gonfle-Taupe

## Arborescence

```
gonfle-taupe-game-development/
├── index.html              # template Vite + bloc SEO (lang=fr)
├── package.json            # gonfle-taupe v1.0.0
├── vite.config.ts          # base '/gonfletaupe/', react + tailwind + singlefile
├── tsconfig.json
├── .gitignore                 # deps, secrets, fichiers d'agents IA
├── about.md / README.md / structure.md / features.md / todo.md / changelog.md
├── og-image.png / favicon.png
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp             # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── App.tsx                 # ecrans menu/jeu/game over, gestion du high score
    ├── utils/cn.ts
    └── game/
        ├── DigDugGame.tsx       # composant canvas, boucle requestAnimationFrame, inputs
        ├── gameEngine.ts        # LOGIQUE PURE (voir ci-dessous), 1450 lignes
        ├── renderer.ts          # tout le rendu Canvas 2D, 1868 lignes
        └── audio.ts             # synthese Web Audio (musique + SFX)
```

## `game/gameEngine.ts` : toute la logique, en fonctions pures

Aucune dependance a React ni au DOM (a part `Audio.*`, qui echoue silencieusement hors
navigateur grace a ses propres try/catch) : c'est ce qui a permis de copier ce fichier
dans un script Node isole pendant l'audit et de reproduire le bug des rochers avant meme
d'ouvrir un navigateur.

| Fonction | Role |
|----------|------|
| `generateLevel(level)` | grille, tunnels pre-creuses, rochers, points de spawn |
| `createGameState(...)` | assemble un `GameState` complet pour un niveau |
| `updatePlayer(state, keys)` | deplacement, creusage, collisions terre/rochers |
| `updateEnemies(state)` | IA de poursuite/fuite, mode fantome, feu du fygar |
| `updatePump(state, spaceJustPressed)` | extension du tuyau, accrochage, gonflage |
| `updateRocks(state)` | stabilite, chute, ecrasement, atterrissage (voir piege ci-dessous) |
| `checkCollisions(state)` | joueur vs ennemi, legumes, power-ups |
| `checkWinCondition(state)` | tous les ennemis elimines -> niveau termine + bonus |

### Le piege du decalage de ligne (corrige pendant l'audit)

Deux endroits de `updateRocks` calculent "quelle ligne de la grille regarder" a partir de
`Math.floor(rock.y + 0.5)` :

- **`landY`**, pour un rocher **deja en train de tomber** : comme `rock.y` augmente en
  continu frame par frame, `landY` represente en pratique "la ligne que le rocher est en
  train d'atteindre". Le code doit alors regarder UNE ligne plus loin (`landY + 1`) pour
  savoir s'il y a du sol solide juste en dessous de la ou il va s'arreter. C'est correct.
- **`belowY`**, pour un rocher **`stable`, immobile** : `belowY` vaut deja directement
  "la ligne juste sous le rocher". Le code reprenait pourtant le meme `+ 1` que pour
  `landY`, et regardait donc deux lignes sous le rocher au lieu d'une. Un rocher ne
  devenait jamais instable quand on creusait juste dessous (la case reellement testee etait
  plus bas), et pouvait a l'inverse tomber a travers une case de terre intacte si on
  creusait deux cases sous lui.

**Ne pas reintroduire ce `+ 1`** dans le test de stabilite (`if (rock.state === 'stable')`) :
`belowY` n'a besoin d'aucun decalage, contrairement a `landY` qui, lui, en a besoin. Verifie
par un test Node isole (`updateRocks` appelee directement sur un etat fabrique a la main),
puis confirme dans le navigateur sur l'etat reel du jeu en cours.

## `game/renderer.ts`

Un unique point d'entree `render(ctx, state, frame)` qui dessine, dans l'ordre : ciel, grille
(terre/tunnels), aide contextuelle au creusage, poussiere ambiante, herbe, fleurs, legumes,
power-ups, tuyau de pompe, ennemis (tries par profondeur), joueur, particules, textes
flottants, HUD, ecrans de fin. Aucune logique de jeu n'y vit : il ne fait que lire `GameState`.

## Build

`vite-plugin-singlefile` inline le JS et le CSS dans `index.html` (~278 Ko). Le `dist/`
contient en plus `favicon.png`, `og-image.png/webp` et `icon.webp` copies depuis `public/`.
`base: '/gonfletaupe/'` fait resoudre ces assets sous `https://games.hylst.fr/gonfletaupe/`.
