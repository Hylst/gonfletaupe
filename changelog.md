# Changelog de Gonfle-Taupe

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnage
[SemVer](https://semver.org/lang/fr/).

## [1.0.0] 2026-07-31

Première version intégrable à Hylst.Games, partie d'un export brut audité puis corrigé.

### Ajouté
- Bloc SEO complet dans `index.html` (description, keywords, og, twitter, robots, canonical,
  theme-color) et `<link rel="icon">`
- `favicon.png` 32×32, `og-image.png` 1024×576 (capture réelle du jeu) et sa variante
  `og-image.webp`, `icon.webp` 128×128 pour la carte du menu
- `base: '/gonfletaupe/'` dans `vite.config.ts`
- La doc : `about.md`, `README.md`, `structure.md`, `features.md`, `todo.md`, `changelog.md`

### Modifié
- Renommé en **Gonfle-Taupe**. Le nom précédent, « Dig Dug », est une marque déposée
  (Namco). Titre affiché, titre de page, commentaires de code, clé `localStorage`
  (`digdug_hylst_highscore` → `gonfletaupe_hylst_highscore`).
- `package.json` : `react-vite-tailwind` v0.0.0 devenu `gonfle-taupe` v1.0.0
- Tirets longs retirés du code et des libellés

### Corrigé
- **La mécanique la plus emblématique du jeu était cassée : creuser directement sous un
  rocher ne le faisait jamais tomber**, contrairement à ce que l'écran d'accueil lui-même
  explique au joueur (« Rochers : creusez juste dessous pour les lâcher sur les ennemis ! »).
  `updateRocks()` testait la stabilité du rocher sur la case **deux lignes** sous lui au
  lieu d'une seule (décalage copié depuis le test d'atterrissage d'un rocher déjà en
  chute, où ce décalage supplémentaire est en revanche nécessaire et correct). Un rocher
  pouvait même tomber à travers une case de terre intacte si l'on creusait deux cases plus
  bas. Vérifié après correction, sur l'état réel du jeu en cours dans le navigateur : un
  rocher stable devient bien instable puis tombe quand on creuse la case juste sous lui, et
  écrase un ennemi placé sur sa trajectoire avec le score et les effets correspondants.
