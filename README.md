# 🎮 NINJA BALL — Ultimate Clash

**Fan game non commercial — Football Ninja Clash en 3D cel-shaded.**

Fusion de FIFA (match, score, chrono) et Naruto Storm (ninja, jutsu, chakra). Jouable au clavier ou au tactile, PWA installable.

> **Fan game non commercial — Naruto © Masashi Kishimoto / Shueisha / Pierrot / Bandai Namco**

---

## 🚀 Installation

```bash
npm install
npm run dev
```

Le jeu s'ouvre sur `http://localhost:5173`.

### Build de production

```bash
npm run build
npm run preview
```

---

## ✨ Nouveautés

### v1.2 — Polish AAA / performances fluides
- **Boucle de jeu** découplée + physique en **timestep fixe 60 Hz** (plus de jitter)
- **Caméra cinématique** : damping, look-ahead sur la vitesse du ballon, FOV punch sur tirs / dash / jutsu / buts
- **Screen shake** + feedback impact style console
- **Cache de matériaux** toon (moins de GC)
- **Ombres adaptatives** (désactivées auto sur machines faibles)
- **Trail de ballon** sans allocation chaque frame
- **Particules** optimisées (depthWrite off, dispose propre)
- Fog exponentiel + tone mapping ACES pour un rendu plus ciné

### v1.1 — Personnages + bugs
- Personnages low-poly stylisés (corps, cheveux uniques, bandeau)
- Bugs buts / tir / IA corrigés

---

## 🎯 Contrôles

### Desktop (clavier)

| Touche | Action |
|---|---|
| **ZQSD / WASD / Flèches** | Déplacer le ninja |
| **Espace** | Tirer (si vous avez le ballon) / Voler le ballon (près de l'adversaire) |
| **E** | Dash (consomme du chakra) |
| **1 / 2 / 3** | Jutsu (chacun a un coût en chakra + un cooldown) |
| **Shift** | Sprint |

### Mobile (tactile)

- **Joystick virtuel** en bas à gauche pour se déplacer
- **Boutons** en bas à droite : TIR, DASH, J1, J2, J3

---

## ⚽ Gameplay

- Match **1v1** sur un stade ninja cel-shaded, chrono **2 minutes**
- **Score style FIFA** — le ballon doit entrer dans le but adverse
- **Jauge de chakra** (0–100) qui se régénère avec le temps
- Chaque personnage a **3 jutsu** uniques avec coût en chakra et cooldown
- **IA adversaire** : poursuit le ballon, dribble vers votre but, tire de près, utilise des jutsu aléatoires
- **But = cinématique** : slow-mo + FOV punch + particules + screen shake

---

## 🥷 Personnages

| Ninja | Couleur | Jutsu 1 | Jutsu 2 | Jutsu 3 |
|---|---|---|---|---|
| **Naruto Uzumaki** | Orange | Rasengan Shot | Kage Bunshin Pass | Mode Ermite (boost) |
| **Sasuke Uchiha** | Bleu | Chidori Tackle | Katon Fireball Cross | Sharingan Read (slow-mo) |
| **Sakura Haruno** | Rose | Cherry Blossom Strike | Soin Défense | Blossom Shot |
| **Kakashi Hatake** | Gris | Raikiri Dash | Kamui Zone (ralentit le ballon) | Copy Technique |

---

## 🎨 Ajouter vos propres assets

### Modèles 3D `.glb`

1. Placez vos fichiers `.glb` dans `public/models/`
2. Le chargement est déjà branché dans `Match.js` (`/models/<id>.glb`)

### Fichiers audio `.mp3`

Placez-les dans `public/sounds/` et chargez-les via `Audio.js` (noms : `shoot`, `jutsu`, `goal`, `whistle`, `dash`, `hit`, `select`, `menu`).

---

## 📱 PWA

- `public/manifest.json` — thème `#ff6b1a`
- `public/sw.js` — cache offline
- Icônes SVG dans `public/`

---

## 🌐 Déploiement sur Vercel

```bash
npm i -g vercel
vercel
```

Build : `npm run build` — Output : `dist`

---

## 🏗️ Architecture

```
src/
├── data/characters.js
├── engine/   # Renderer, Physics, Input, Audio
├── entities/ # Stadium, Ball, Player, Effects
├── systems/  # AI, HUD, Match
└── ui/screens.js
```

---

## ⚠️ Mention légale

**Fan game non commercial.** Non affilié aux ayants droit.  
**Naruto © Masashi Kishimoto / Shueisha / Pierrot / Bandai Namco.**
