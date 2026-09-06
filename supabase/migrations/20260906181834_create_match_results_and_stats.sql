/*
# Ninja Ball — Tables de résultats et statistiques

1. Nouvelles Tables
- `match_results` : journal de chaque match joué (perso du joueur, perso IA, scores, vainqueur, durée, date)
  - id (uuid, clé primaire)
  - player_name (text, nom du joueur, défaut 'Ninja Anonyme')
  - player_character_id (text, identifiant du perso du joueur)
  - player_character_name (text, nom du perso du joueur)
  - ai_character_id (text, identifiant du perso IA)
  - ai_character_name (text, nom du perso IA)
  - player_score (int, score du joueur)
  - ai_score (int, score de l'IA)
  - winner (text, 'player' / 'ai' / 'draw')
  - duration_seconds (int, durée du match en secondes)
  - created_at (timestamptz, date du match)
- `character_stats` : statistiques agrégées par personnage (victoires, défaites, nuls, buts marqués/encaissés, matchs joués)
  - character_id (text, clé primaire)
  - character_name (text, nom du personnage)
  - wins (int, victoires)
  - losses (int, défaites)
  - draws (int, matchs nuls)
  - goals_scored (int, buts marqués)
  - goals_conceded (int, buts encaissés)
  - matches_played (int, matchs joués)

2. Sécurité
- RLS activé sur les deux tables.
- Accès anon + authenticated en lecture/écriture (pas de sign-in dans le jeu, données intentionnellement partagées/publiques pour le classement).

3. Trigger
- `update_character_stats_on_insert` : met à jour automatiquement `character_stats` quand un match est inséré dans `match_results`.

4. Notes importantes
- Pas de user_id ni d'auth — le jeu n'a pas d'écran de connexion.
- Les stats du perso IA sont aussi suivies (victoires/défaites du côté IA).
- Le trigger gère l'upsert automatique des stats.
*/

-- Table des résultats de match
CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL DEFAULT 'Ninja Anonyme',
  player_character_id text NOT NULL,
  player_character_name text NOT NULL,
  ai_character_id text NOT NULL,
  ai_character_name text NOT NULL,
  player_score int NOT NULL DEFAULT 0,
  ai_score int NOT NULL DEFAULT 0,
  winner text NOT NULL CHECK (winner IN ('player', 'ai', 'draw')),
  duration_seconds int NOT NULL DEFAULT 120,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des statistiques par personnage
CREATE TABLE IF NOT EXISTS character_stats (
  character_id text PRIMARY KEY,
  character_name text NOT NULL,
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  draws int NOT NULL DEFAULT 0,
  goals_scored int NOT NULL DEFAULT 0,
  goals_conceded int NOT NULL DEFAULT 0,
  matches_played int NOT NULL DEFAULT 0
);

-- Activer RLS
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;

-- Politiques match_results (publique, pas d'auth)
DROP POLICY IF EXISTS "anon_select_match_results" ON match_results;
CREATE POLICY "anon_select_match_results" ON match_results
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_match_results" ON match_results;
CREATE POLICY "anon_insert_match_results" ON match_results
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_match_results" ON match_results;
CREATE POLICY "anon_update_match_results" ON match_results
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_match_results" ON match_results;
CREATE POLICY "anon_delete_match_results" ON match_results
  FOR DELETE TO anon, authenticated USING (true);

-- Politiques character_stats (publique, pas d'auth)
DROP POLICY IF EXISTS "anon_select_character_stats" ON character_stats;
CREATE POLICY "anon_select_character_stats" ON character_stats
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_character_stats" ON character_stats;
CREATE POLICY "anon_insert_character_stats" ON character_stats
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_character_stats" ON character_stats;
CREATE POLICY "anon_update_character_stats" ON character_stats
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_character_stats" ON character_stats;
CREATE POLICY "anon_delete_character_stats" ON character_stats
  FOR DELETE TO anon, authenticated USING (true);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_match_results_created_at ON match_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_results_player_char ON match_results (player_character_id);
CREATE INDEX IF NOT EXISTS idx_match_results_winner ON match_results (winner);

-- Fonction trigger : met à jour character_stats automatiquement
CREATE OR REPLACE FUNCTION update_character_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Stats du perso du joueur
  INSERT INTO character_stats (character_id, character_name, wins, losses, draws, goals_scored, goals_conceded, matches_played)
  VALUES (
    NEW.player_character_id,
    NEW.player_character_name,
    CASE WHEN NEW.winner = 'player' THEN 1 ELSE 0 END,
    CASE WHEN NEW.winner = 'ai' THEN 1 ELSE 0 END,
    CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
    NEW.player_score,
    NEW.ai_score,
    1
  )
  ON CONFLICT (character_id) DO UPDATE SET
    wins = character_stats.wins + CASE WHEN NEW.winner = 'player' THEN 1 ELSE 0 END,
    losses = character_stats.losses + CASE WHEN NEW.winner = 'ai' THEN 1 ELSE 0 END,
    draws = character_stats.draws + CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
    goals_scored = character_stats.goals_scored + NEW.player_score,
    goals_conceded = character_stats.goals_conceded + NEW.ai_score,
    matches_played = character_stats.matches_played + 1;

  -- Stats du perso IA
  INSERT INTO character_stats (character_id, character_name, wins, losses, draws, goals_scored, goals_conceded, matches_played)
  VALUES (
    NEW.ai_character_id,
    NEW.ai_character_name,
    CASE WHEN NEW.winner = 'ai' THEN 1 ELSE 0 END,
    CASE WHEN NEW.winner = 'player' THEN 1 ELSE 0 END,
    CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
    NEW.ai_score,
    NEW.player_score,
    1
  )
  ON CONFLICT (character_id) DO UPDATE SET
    wins = character_stats.wins + CASE WHEN NEW.winner = 'ai' THEN 1 ELSE 0 END,
    losses = character_stats.losses + CASE WHEN NEW.winner = 'player' THEN 1 ELSE 0 END,
    draws = character_stats.draws + CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
    goals_scored = character_stats.goals_scored + NEW.ai_score,
    goals_conceded = character_stats.goals_conceded + NEW.player_score,
    matches_played = character_stats.matches_played + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trg_update_character_stats ON match_results;
CREATE TRIGGER trg_update_character_stats
  AFTER INSERT ON match_results
  FOR EACH ROW EXECUTE FUNCTION update_character_stats_on_insert();
