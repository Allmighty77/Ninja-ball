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
- **But = cinématique** : slow-mo + zoom + particules + screen shake

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

Les joueurs sont actuellement des **capsules colorées** (placeholders procéduraux). Pour remplacer par vos modèles :

1. Placez vos fichiers `.glb` dans `public/models/`
2. Dans `src/entities/Player.js`, la fonction `loadCharacterModel(url)` est déjà prête :

```javascript
// Exemple dans Match.js après création du joueur :
await player.loadCharacterModel('/models/naruto.glb')
```

La fonction cache automatiquement le placeholder et charge le modèle avec les ombres activées.

### Fichiers audio `.mp3`

Le système audio utilise **Web Audio API** avec des SFX synthétisés. Pour ajouter vos propres sons :

1. Placez vos `.mp3` dans `public/sounds/`
2. Dans `src/engine/Audio.js`, chargez-les au démarrage :

```javascript
await audio.loadSound('shoot', '/sounds/shoot.mp3')
await audio.loadSound('goal', '/sounds/goal.mp3')
```

Les sons chargés remplacent automatiquement les SFX synthétisés correspondants (noms : `shoot`, `jutsu`, `goal`, `whistle`, `dash`, `hit`, `select`, `menu`).

---

## 📱 PWA

Le jeu est installable comme application :

- `public/manifest.json` — configuration PWA (thème `#ff6b1a`)
- `public/sw.js` — service worker (cache shell offline)
- Icônes SVG 192×192 et 512×512 dans `public/`

Sur mobile/desktop, cliquez "Installer" / "Add to Home Screen" depuis le navigateur.

---

## 🌐 Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ou connecter le repo GitHub sur vercel.com
# Build command : npm run build
# Output dir : dist
```

---

## 🏗️ Architecture du code

```
src/
├── data/
│   └── characters.js      # Données des 4 personnages + jutsu
├── engine/
│   ├── Renderer.js         # Three.js + cel-shading (toon) + caméra
│   ├── Physics.js          # Cannon-es (monde physique, ballon, murs)
│   ├── Input.js            # Clavier + joystick virtuel mobile
│   └── Audio.js            # Web Audio API (SFX synthétisés + mp3)
├── entities/
│   ├── Stadium.js          # Stade cel-shaded + ciel + lune + sceau
│   ├── Ball.js             # Ballon physique + traînée de chakra
│   ├── Player.js           # Capsule ninja + déplacement + jutsu + chakra
│   └── Effects.js          # Particules, auras, sceaux, trails
├── systems/
│   ├── AI.js               # IA adverse (poursuite, tir, jutsu)
│   ├── HUD.js              # Interface (score, chrono, chakra, jutsu, mobile)
│   └── Match.js            # Boucle de partie (chrono, buts, possession)
└── ui/
    └── screens.js          # Menus (Titre, Sélection, Fin)
```

---

## ⚠️ Mention légale

**Fan game non commercial.** Ce projet n'est pas affilié à ni approuvé par les ayants droit.
**Naruto © Masashi Kishimoto / Shueisha / Pierrot / Bandai Namco.** Tous les noms de personnages et jutsu appartiennent à leurs propriétaires respectifs.
