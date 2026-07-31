# TODO de Gonfle-Taupe

Audit fait le 2026-07-31 sur l'export brut (`build-dig-dug-game (2).zip`), suivi d'une
passe QA navigateur (Playwright + Chromium) avec vérification réelle des deux mécaniques
centrales du jeu (chute des rochers, gonflage des ennemis à la pompe).

---

## ✅ Corrigé — bug majeur

- [x] **Creuser directement sous un rocher ne le faisait jamais tomber — la mécanique la
  plus emblématique du jeu, celle-là même que le mode d'emploi affiché au joueur décrit
  (« Rochers : creusez juste dessous pour les lâcher sur les ennemis ! »), était cassée.**
  Dans `gameEngine.ts`, `updateRocks()` calcule `belowY = Math.floor(rock.y + 0.5)`, qui
  vaut déjà l'indice de la ligne juste sous le rocher. Mais le test de stabilité lisait
  `state.grid[belowY + 1][belowX]`, c'est-à-dire la ligne **deux crans plus bas**. Résultat
  mesuré hors navigateur (`updateRocks` appelée directement, sans rendu) : creuser
  exactement sous un rocher stable le laissait `stable` après 200 frames ; creuser deux
  cases plus bas le faisait tomber **même si la case immédiatement sous lui était restée
  intacte** — un rocher pouvait ainsi s'enfoncer à travers de la terre non creusée. Le
  test d'atterrissage plus bas dans la même fonction (`landY`/`landY + 1`) utilise le même
  motif mais reste correct : il est décalé d'un cran par construction, car il suit un
  rocher **déjà en mouvement** (la ligne qu'il est en train de quitter n'est pas encore
  celle qu'il teste). Ce n'est pas le cas d'un rocher `stable` à l'arrêt, qui n'a pas
  besoin de ce décalage — c'est très probablement un copier-coller du calcul
  d'atterrissage appliqué sans l'adapter au test de stabilité.
  Corrigé en retirant le `+ 1` en trop (`belowY` directement, plus `oy === belowY` pour la
  détection d'un rocher support). **Vérifié dans le navigateur, sur l'état réel du jeu en
  cours** (pas une copie isolée) : un rocher stable authentique du niveau 1, avec la case
  sous lui creusée, passe bien de `stable` à `landed` ; un ennemi placé sur sa trajectoire
  de chute passe en `crushed` et le score encaisse +1000 (`ROCK_CRUSH_POINTS`), avec le
  texte flottant et les particules correspondants visibles à l'écran.

## ✅ La passe QA navigateur

- [x] 0 erreur console, 0 exception non gérée
- [x] Écran d'accueil ("GONFLE-TAUPE"), lancement, écran de jeu
- [x] **Mécanique des rochers observée réellement** (voir ci-dessus) : chute déclenchée
  par un creusage direct, écrasement d'ennemi confirmé avec gain de score réel
- [x] **Mécanique de la pompe observée réellement, au clavier** (pas de manipulation
  directe de l'état) : joueur positionné face à un ennemi de test, tunnel dégagé entre
  eux, appuis répétés sur Espace envoyés comme de vrais événements clavier pendant que la
  vraie boucle `requestAnimationFrame` du jeu tournait. Résultat : le tuyau s'étend,
  s'accroche à l'ennemi (`state: 'inflating'`), chaque appui suivant l'inflate jusqu'à
  `maxInflation` (4), puis il explose (`state: 'popped'`). Score et écran « NIVEAU
  TERMINÉ ! » avec bonus de temps confirmés à l'écran, valeur du bonus recalculée à la
  main et retrouvée exactement (2620).
- [x] Déplacement et creusage réels au clavier (flèches + Maj), capture d'écran avec
  ennemis (pooka, fygar), rochers et tunnels visibles et bien rendus
- [x] Pause (touche P) fonctionnelle
- [x] Viewport mobile 390×844 : aucun débordement horizontal, le canvas se redimensionne

## Vérification complémentaire hors navigateur

Avant même de toucher au rendu, la fonction `updateRocks` a été copiée dans un script
Node isolé pour reproduire les trois scénarios (creuser directement sous le rocher /
creuser deux cases plus bas / ne rien creuser). Cela a permis de confirmer précisément
la cause du bug avant de corriger, puis de vérifier que le correctif ne cassait pas
la logique d'atterrissage (un rocher qui tombe à travers une colonne dégagée s'arrête
bien exactement une ligne au-dessus du premier sol rencontré, avant et après le correctif).

---

## ⬜ Idées d'amélioration

### Cohérence mineure
- [ ] Un ennemi en cours de gonflage (`inflating`) au moment où le joueur meurt reste figé
  jusqu'à la fin du temps de réapparition (~2,5 s), puis revient à `normal` sans
  dégonflage progressif ni pénalité. Comportement mineur, jamais gênant en pratique.
- [ ] Le canvas est centré verticalement sur mobile avec une marge assez large en haut et
  en bas plutôt que d'occuper tout l'espace disponible ; purement cosmétique, le jeu reste
  pleinement jouable et rien ne dépasse de l'écran.

### Technique
- [ ] `state.grid` n'est jamais mis à `'rock'` pour un rocher qui atterrit par la voie
  normale (chute → `shattered` → `landed`) ; seul le cas où un rocher tombe exactement sur
  un autre rocher déjà posé met à jour la grille. Sans conséquence observée : les
  collisions joueur/ennemis avec les rochers passent systématiquement par la liste
  `state.rocks` (test de distance), jamais par le type de cellule de la grille. Mais c'est
  fragile si une future fonctionnalité venait à s'appuyer sur `grid` pour détecter un
  rocher.
- [ ] `enemy.hookedBy` est un champ `number | null` mais ne reçoit jamais que `0` (jeu à un
  seul joueur) : autant en faire un booléen.
