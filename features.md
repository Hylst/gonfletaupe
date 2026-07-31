# Fonctionnalités de Gonfle-Taupe

## Gameplay

- ✅ Creusage libre de tunnels dans la terre
- ✅ Pompe : accrocher un monstre à distance, le gonfler jusqu'à l'explosion
- ✅ **Rochers qui tombent réellement quand on creuse la case juste dessous** (bug majeur
  corrigé, voir todo.md), écrasent monstres et joueur sur leur trajectoire
- ✅ Deux types de monstres : pooka (classique) et fygar (dragon vert, crache du feu à
  l'horizontale)
- ✅ Mode fantôme temporaire des monstres (traversent la terre, jamais les rochers)
- ✅ Le dernier monstre survivant fuit le joueur au lieu de le poursuivre
- ✅ Système de combo (×1 à ×5) sur les éliminations rapprochées, pompe et rocher confondus
- ✅ Légumes bonus (6 valeurs) et 4 power-ups : vitesse, invincibilité, double points, vie
- ✅ Bonus de temps et bonus « parfait » (aucun monstre manqué) en fin de niveau
- ✅ Mode « dépêchez-vous » : au-delà d'un certain temps, les monstres passent tous fantômes
- ✅ Progression infinie par niveaux, difficulté croissante (nombre de monstres, fygars,
  rochers)
- ✅ Meilleur score sauvegardé en `localStorage`

## Interface

- ✅ Écran d'accueil avec règles complètes illustrées
- ✅ HUD : score, meilleur score, niveau, vies, barre de temps
- ✅ Effets : particules, textes flottants, flash d'écran, secousse caméra, feu du fygar
- ✅ Pause (touche P)
- ✅ Support clavier (flèches/ZQSD), souris et tactile pour creuser
- ✅ Aucun débordement horizontal en 390×844

## Audio

- ✅ Musique chiptune procédurale façon marche entraînante
- ✅ Effets sonores pour creuser, marcher, pomper, accrocher, faire tomber/écraser un
  rocher, pop, mourir, ramasser un légume/bonus, niveau terminé

## Technique

- ✅ Build en un seul fichier (~278 Ko), fonctionne hors ligne
- ✅ TypeScript strict
- ✅ Logique de jeu entièrement pure dans `game/gameEngine.ts` (generation, IA, physique
  des rochers), testable hors navigateur — c'est ce qui a permis de repérer et de vérifier
  le correctif du bug des rochers avant même d'ouvrir un navigateur
- ✅ Bloc SEO complet, favicon, og-image (capture réelle du jeu)
- ⬜ Le canvas reste centré avec des marges sur mobile plutôt que de remplir l'écran
  (cosmétique, sans impact sur la jouabilité)
- ⬜ Pas de tests automatisés embarqués
