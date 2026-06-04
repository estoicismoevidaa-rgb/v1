import { supabase } from './supabase';
import { UserStats } from '../types';

export function calcularXPParaProximoLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.25, level - 1));
}

export function podeGanharXP(params: {
  partidaFinalizada: boolean;
  participouAteFinal: boolean;
  paresEncontrados: number;
  tempoEmSegundos: number;
}): boolean {
  return (
    params.partidaFinalizada === true &&
    params.participouAteFinal === true &&
    params.paresEncontrados >= 1 &&
    params.tempoEmSegundos >= 30
  );
}

export function calcularXPSolo(params: {
  pontuacaoFinal: number;
  venceu: boolean;
  tempoEmSegundos: number;
  erros: number;
  comboMaximo: number;
}): number {
  let xp = Math.floor(params.pontuacaoFinal * 0.10);

  if (params.venceu) xp += 50;

  if (params.tempoEmSegundos <= 120) {
    xp += 40;
  } else if (params.tempoEmSegundos <= 240) {
    xp += 25;
  } else if (params.tempoEmSegundos <= 360) {
    xp += 10;
  }

  if (params.erros <= 3) {
    xp += 30;
  } else if (params.erros <= 7) {
    xp += 15;
  } else if (params.erros <= 12) {
    xp += 5;
  }

  if (params.comboMaximo >= 8) {
    xp += 35;
  } else if (params.comboMaximo >= 5) {
    xp += 20;
  } else if (params.comboMaximo >= 3) {
    xp += 10;
  }

  return xp;
}

export function calcularXPMultiplayer(params: {
  pontuacaoIndividual: number;
  posicaoFinal: number;
  totalJogadores: number;
  paresEncontrados: number;
  comboMaximo: number;
  participouAteFinal: boolean;
}): number {
  let xp = Math.floor(params.pontuacaoIndividual * 0.10);

  if (params.totalJogadores === 2) {
    if (params.posicaoFinal === 1) xp += 80;
    if (params.posicaoFinal === 2) xp += 20;
  } else if (params.totalJogadores === 3) {
    if (params.posicaoFinal === 1) xp += 100;
    if (params.posicaoFinal === 2) xp += 60;
    if (params.posicaoFinal === 3) xp += 25;
  } else if (params.totalJogadores >= 4) {
    if (params.posicaoFinal === 1) xp += 120;
    if (params.posicaoFinal === 2) xp += 80;
    if (params.posicaoFinal === 3) xp += 40;
    if (params.posicaoFinal >= 4) xp += 20;
  }

  xp += params.paresEncontrados * 8;

  if (params.comboMaximo >= 8) {
    xp += 35;
  } else if (params.comboMaximo >= 5) {
    xp += 20;
  } else if (params.comboMaximo >= 3) {
    xp += 10;
  }

  if (params.participouAteFinal) {
    xp += 20;
  }

  return xp;
}

export async function adicionarXP(
  userId: string,
  xpGanho: number,
  pontuacao: number,
  modo: string,
  ganhouPartida: boolean,
  currentStats?: UserStats
) {
  if (userId.startsWith('user_')) return null; // Ignore guests
  
  // BLOQUEIO: Só ganha XP nos modos Online (Lobby ou Versus/Online)
  if (modo === 'solo' || modo === 'local' || modo === 'solo_local') return null;
  
  // Get current stats if not provided
  let statsRow = currentStats;
  if (!statsRow) {
    const { data } = await supabase.from('stats').select('*').eq('uid', userId).maybeSingle();
    if (data) {
      statsRow = {
        uid: data.uid,
        gamesPlayed: data.games_played,
        totalPoints: data.total_points,
        soloPoints: data.solo_points,
        versusPoints: data.versus_points,
        achievements: data.achievements,
        lastPlayedAt: data.last_played_at,
        level: data.level || 1,
        currentXp: data.current_xp || 0,
        totalXp: data.total_xp || 0,
        nextLevelXp: data.next_level_xp || 100,
        gamesWon: data.games_won || 0,
        gamesLost: data.games_lost || 0,
      };
    }
  }

  if (!statsRow) return null;

  const levelAntes = statsRow.level || 1;
  let currentXp = statsRow.currentXp || 0;
  let totalXp = statsRow.totalXp || 0;
  let nextLevelXp = statsRow.nextLevelXp || 100;
  let level = statsRow.level || 1;

  currentXp += xpGanho;
  totalXp += xpGanho;

  let leveledUp = false;
  while (currentXp >= nextLevelXp) {
    currentXp -= nextLevelXp;
    level += 1;
    nextLevelXp = calcularXPParaProximoLevel(level);
    leveledUp = true;
  }

  const updates = {
    level,
    current_xp: currentXp,
    total_xp: totalXp,
    next_level_xp: nextLevelXp,
    games_won: (statsRow.gamesWon || 0) + (ganhouPartida ? 1 : 0),
    games_lost: (statsRow.gamesLost || 0) + (ganhouPartida ? 0 : 1)
  };

  const { error: updateError } = await supabase.from('stats').update(updates).eq('uid', userId);
  
  if (updateError) {
    console.error('Error updating stats with XP:', updateError);
  } else {
    // Save history
    const { error: historyError } = await supabase.from('xp_history').insert([{
      player_id: userId,
      mode: modo,
      xp_ganho: xpGanho,
      pontuacao: pontuacao,
      level_antes: levelAntes,
      level_depois: level,
      created_at: new Date().toISOString()
    }]);
    
    if (historyError) {
      console.warn('Error saving XP history (table might be missing):', historyError);
    }
  }

  return {
    leveledUp,
    levelAntes,
    level,
    xpAtual: currentXp,
    xpParaProximoLevel: nextLevelXp,
    xpGanho
  };
}
