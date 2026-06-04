import { supabase } from './supabase';
import { UserProfile } from '../types';

export const levelRewards = [
  {
    id: "frame_bronze",
    name: "Moldura Bronze",
    type: "profile_frame",
    requiredLevel: 10,
    color: "bronze",
    description: "Primeira conquista de evolução."
  },
  {
    id: "frame_silver",
    name: "Moldura Prata",
    type: "profile_frame",
    requiredLevel: 20,
    color: "silver",
    description: "Jogador dedicado."
  },
  {
    id: "frame_gold",
    name: "Moldura Ouro",
    type: "profile_frame",
    requiredLevel: 30,
    color: "gold",
    description: "Jogador experiente."
  },
  {
    id: "frame_diamond",
    name: "Moldura Diamante",
    type: "profile_frame",
    requiredLevel: 40,
    color: "diamond",
    description: "Jogador avançado."
  },
  {
    id: "frame_master",
    name: "Moldura Mestre",
    type: "profile_frame",
    requiredLevel: 50,
    color: "purple",
    description: "Mestre da Memória."
  },
  {
    id: "frame_legendary",
    name: "Moldura Lendária",
    type: "profile_frame",
    requiredLevel: 60,
    color: "red_gold",
    description: "Lenda do jogo."
  },
  {
    id: "frame_epic",
    name: "Moldura Épica",
    type: "profile_frame",
    requiredLevel: 70,
    color: "green_neon",
    description: "Jogador épico."
  },
  {
    id: "frame_mythic",
    name: "Moldura Mítica",
    type: "profile_frame",
    requiredLevel: 80,
    color: "blue_purple",
    description: "Jogador mítico."
  },
  {
    id: "frame_immortal",
    name: "Moldura Imortal",
    type: "profile_frame",
    requiredLevel: 90,
    color: "white_silver",
    description: "Jogador imortal."
  },
  {
    id: "frame_supreme_master",
    name: "Moldura Supremo Mestre",
    type: "profile_frame",
    requiredLevel: 100,
    color: "gold_blue_purple",
    description: "Um dos maiores mestres do jogo."
  }
];

export async function getPlayerRewards(userId: string) {
  if (userId.startsWith('user_')) return [];
  
  const { data, error } = await supabase
    .from('player_rewards')
    .select('*')
    .eq('player_id', userId);
    
  if (error) {
    if (error.code === '42P01') {
      // Table doesn't exist yet, return empty
      return [];
    }
    console.error("Error fetching player rewards", error);
    return [];
  }
  return data || [];
}

export async function equiparMoldura(userId: string, rewardId: string) {
  if (userId.startsWith('user_') || !rewardId) return;

  // 1. Set all to equipped = false
  await supabase
    .from('player_rewards')
    .update({ equipped: false })
    .eq('player_id', userId)
    .eq('reward_type', 'profile_frame');

  // 2. Set chosen to equipped = true
  const { error: equipError } = await supabase
    .from('player_rewards')
    .update({ equipped: true, seen: true })
    .eq('player_id', userId)
    .eq('reward_id', rewardId);
    
  if (equipError) {
    console.error("Error equipping frame in player_rewards", equipError);
  }

  // 3. Update profiles table so it's easy to fetch in rankings/lobbies
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ equipped_frame: rewardId })
    .eq('uid', userId);

  if (profileError) {
    console.error("Error updating equipped_frame in profiles", profileError);
  }
}

export async function marcarRecompensaComoVista(userId: string, id: number) {
  if (userId.startsWith('user_')) return;
  
  await supabase
    .from('player_rewards')
    .update({ seen: true })
    .eq('player_id', userId)
    .eq('id', id);
}

// Function to call when Level changes
export async function verificarRecompensasDeNivel(
  userId: string, 
  newLevel: number, 
  existingRewards: any[]
) {
  if (userId.startsWith('user_')) return [];
  
  const unlockedRewardIds = existingRewards.map(r => r.reward_id);
  
  const novasRecompensas = levelRewards.filter(reward => {
    return newLevel >= reward.requiredLevel && !unlockedRewardIds.includes(reward.id);
  });

  const recompensasDesbloqueadasNesteMomento = [];

  for (const reward of novasRecompensas) {
    // Insert into db
    const { data, error } = await supabase
      .from('player_rewards')
      .insert([{
        player_id: userId,
        reward_id: reward.id,
        reward_name: reward.name,
        reward_type: reward.type,
        required_level: reward.requiredLevel,
        unlocked: true,
        equipped: false,
        seen: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (!error && data) {
      recompensasDesbloqueadasNesteMomento.push(reward);
    } else {
      console.error('Error unlocking reward:', error, reward);
    }
  }

  return recompensasDesbloqueadasNesteMomento;
}
