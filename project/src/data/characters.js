// ════════════════════════════════════════════════════════════
// DONNÉES DES PERSONNAGES — Ninja Ball Ultimate Clash
// Personnages Naruto (fan game non commercial)
// Chaque perso : stats + 3 jutsu canoniques
// ════════════════════════════════════════════════════════════

export const CHARACTERS = [
  {
    id: 'naruto',
    name: 'Naruto Uzumaki',
    clan: 'Uzumaki',
    color: 0xff6b1a,
    accentColor: 0xffaa3a,
    village: 'Konoha',
    speed: 8.5,
    shotPower: 9.0,
    chakraMax: 100,
    description: 'Ninja du Chakra Inépuisable — puissant et rapide',
    jutsus: [
      {
        id: 'rasengan_shot',
        name: 'Rasengan Shot',
        cost: 40,
        cooldown: 3.0,
        type: 'shot',
        description: 'Tir surpuissant en boule de chakra',
      },
      {
        id: 'kage_bunshin_pass',
        name: 'Kage Bunshin Pass',
        cost: 25,
        cooldown: 4.0,
        type: 'pass',
        description: 'Passe multi-cible style clone',
      },
      {
        id: 'mode_ermite',
        name: 'Mode Ermite',
        cost: 60,
        cooldown: 8.0,
        type: 'boost',
        description: 'Boost de vitesse + puissance 5s',
      },
    ],
  },
  {
    id: 'sasuke',
    name: 'Sasuke Uchiha',
    clan: 'Uchiha',
    color: 0x2b6fff,
    accentColor: 0x6aa0ff,
    village: 'Konoha',
    speed: 9.0,
    shotPower: 8.5,
    chakraMax: 100,
    description: 'Ninja Foudroyant — vitesse extrême',
    jutsus: [
      {
        id: 'chidori_tackle',
        name: 'Chidori Tackle',
        cost: 35,
        cooldown: 3.0,
        type: 'tackle',
        description: 'Dash foudroyant pour voler le ballon',
      },
      {
        id: 'katon_fireball_cross',
        name: 'Katon Fireball Cross',
        cost: 45,
        cooldown: 4.0,
        type: 'shot',
        description: 'Tir en boule de feu dévastateur',
      },
      {
        id: 'sharingan_read',
        name: 'Sharingan Read',
        cost: 50,
       cooldown: 6.0,
        type: 'slowmo',
        description: 'Ralentit l\'adversaire (slow-mo)',
      },
    ],
  },
  {
    id: 'sakura',
    name: 'Sakura Haruno',
    clan: 'Haruno',
    color: 0xff4b8b,
    accentColor: 0xff8bb5,
    village: 'Konoha',
    speed: 7.5,
    shotPower: 7.0,
    chakraMax: 120,
    description: 'Ninja Médicale — résistante et précise',
    jutsus: [
      {
        id: 'cherry_blossom_strike',
        name: 'Cherry Blossom Strike',
        cost: 30,
        cooldown: 3.0,
        type: 'tackle',
        description: 'Frappe surpuissante pour voler le ballon',
      },
      {
        id: 'soin_defense',
        name: 'Soin Défense',
        cost: 40,
        cooldown: 5.0,
        type: 'heal',
        description: 'Régénère du chakra + résistance',
      },
      {
        id: 'blossom_shot',
        name: 'Blossom Shot',
        cost: 45,
        cooldown: 4.0,
        type: 'shot',
        description: 'Tir précis pétales de cerisier',
      },
    ],
  },
  {
    id: 'kakashi',
    name: 'Kakashi Hatake',
    clan: 'Hatake',
    color: 0x9aa0b0,
    accentColor: 0xc0c8d8,
    village: 'Konoha',
    speed: 8.0,
    shotPower: 8.5,
    chakraMax: 110,
    description: 'Ninja Copiste — polyvalent et rusé',
    jutsus: [
      {
        id: 'raikiri_dash',
        name: 'Raikiri Dash',
        cost: 40,
        cooldown: 3.5,
        type: 'dash',
        description: 'Dash éclair transperce les défenses',
      },
      {
        id: 'kamui_zone',
        name: 'Kamui Zone',
        cost: 55,
        cooldown: 6.0,
        type: 'zone',
        description: 'Ralentit le ballon adverse',
      },
      {
        id: 'copy_technique',
        name: 'Copy Technique',
        cost: 35,
        cooldown: 5.0,
        type: 'copy',
        description: 'Copie le prochain jutsu adverse',
      },
    ],
  },
]

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0]
}
