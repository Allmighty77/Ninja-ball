# Ninja Ball — Ultimate Clash

**Football ninja 3D** dans le navigateur — matchs rapides, combos, jutsu, 1vIA ou 2 joueurs local.

> Fan game **non commercial** et non affilié.  
> **Naruto © Masashi Kishimoto / Shueisha / Pierrot / Bandai Namco**

---

## Jouer en local

```bash
npm install
npm run dev
```

Ouvre `http://localhost:5173`.

### Build production

```bash
npm run build
npm run preview
```

Sortie : dossier `dist/` (hébergeable sur Vercel, Netlify, GitHub Pages…).

---

## Modes de jeu

| Mode | Description |
|------|-------------|
| **VS IA** | 1v1 contre une IA (Facile / Normal / Difficile) |
| **2 Joueurs** | Même clavier, sélection de 2 ninjas |

Match de **2 minutes**. Le plus de buts gagne.

---

## Contrôles

### Joueur 1
| Action | Touches |
|--------|---------|
| Déplacer | ZQSD / WASD |
| Tirer / voler | Espace |
| Dash | E |
| Jutsu | 1 · 2 · 3 |
| Sprint | Shift gauche |
| Pause | Échap ou P |

### Joueur 2 (mode 2 joueurs)
| Action | Touches |
|--------|---------|
| Déplacer | Flèches |
| Tirer / voler | Entrée |
| Dash | Shift droit |
| Jutsu | 7 · 8 · 9 |

### Mobile
Joystick virtuel + boutons TIR / DASH / J1–J3.

---

## Progression

- Stats locales (victoires, séries, combos)
- **8 achievements** déblocables
- Classement online optionnel (Supabase — nécessite `.env`)

Sans clés Supabase, le jeu fonctionne **entièrement offline**.

---

## Options graphiques

| Preset | Usage |
|--------|--------|
| **Low** | Téléphones modestes, batterie |
| **Medium** | Équilibre |
| **High** | Desktop / tablettes puissantes |

Les presets changent réellement : résolution (DPR), ombres, densité de particules, anti-aliasing.

---

## Architecture

```
src/
├── data/          # personnages, progression, achievements, db
├── engine/        # Renderer, Physics, Input, Audio, GraphicsQuality
├── entities/      # Stadium, Ball, Player, Effects
├── systems/       # Match, AI, HUD
└── ui/            # écrans (titre, sélection, fin, options…)
```

- Physique **timestep fixe 60 Hz** (Cannon-es)
- Rendu **cel-shaded** (Three.js) + caméra cinématique
- PWA (`manifest` + service worker)

---

## Configuration Supabase (optionnel)

```bash
cp .env.example .env
# renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
```

**Ne committe jamais `.env`.**

---

## Mentions légales

Produit fan, **sans monétisation** liée à la franchise Naruto.  
Tous les droits sur les personnages et l’univers appartiennent à leurs ayants droit.
