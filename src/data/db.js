// ════════════════════════════════════════════════════════════
// SUPABASE — Client singleton + fonctions de sauvegarde des résultats
// Sauvegarde les matchs et récupère les statistiques / classement
// ════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('Supabase non configuré — utilisation du mode mock pour les données')
  // Mode mock léger pour développement local sans clés
  supabase = {
    from: () => ({ select: async () => ({ data: [], error: null }), insert: async () => ({ data: [], error: null }) }),
  }
}

export { supabase }

// Sauvegarde le résultat d'un match
export async function saveMatchResult(result, playerChar, aiChar) {
  const { error } = await supabase.from('match_results').insert({
    player_name: 'Ninja Anonyme',
    player_character_id: playerChar.id,
    player_character_name: playerChar.name,
    ai_character_id: aiChar.id,
    ai_character_name: aiChar.name,
    player_score: result.scoreL,
    ai_score: result.scoreR,
    winner: result.winner,
    duration_seconds: 120,
  })
  if (error) console.warn('Sauvegarde du match échouée', error)
  return !error
}

// Récupère les statistiques de tous les personnages
export async function getCharacterStats() {
  const { data, error } = await supabase
    .from('character_stats')
    .select('*')
    .order('wins', { ascending: false })
  if (error) {
    console.warn('Récupération des stats échouée', error)
    return []
  }
  return data || []
}

// Récupère les derniers matchs (historique récent)
export async function getRecentMatches(limit = 10) {
  const { data, error } = await supabase
    .from('match_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.warn('Récupération de l\'historique échouée', error)
    return []
  }
  return data || []
}
