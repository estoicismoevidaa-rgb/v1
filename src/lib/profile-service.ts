/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase.ts';
import { UserProfile, UserStats, RankingEntry, Difficulty } from '../types.ts';

/**
 * SCHEMA DE BANCO DE DADOS (SUPABASE SQL EDITOR):
 * 
 * -- Tabela de Perfis
 * create table profiles (
 *   uid text primary key,
 *   username text unique not null,
 *   email text,
 *   avatar_url text,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Tabela de Estatísticas
 * create table stats (
 *   uid text primary key references profiles(uid) on delete cascade,
 *   games_played int default 0,
 *   best_time_easy int,
 *   best_time_medium int,
 *   best_time_hard int,
 *   best_time_extreme int,
 *   total_points int default 0,
 *   achievements text[] default '{}',
 *   last_played_at timestamp with time zone default timezone('utc'::text, now())
 * );
 */

/**
 * Checks if a username already exists.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.warn('Supabase check failed (likely missing table), proceeding with local logic:', error.message);
      return false;
    }

    return !!data;
  } catch (err) {
    console.warn('Unexpected check error:', err);
    return false;
  }
}

/**
 * Verifies credentials and retrieves a profile using Supabase Auth.
 */
export async function loginProfile(email: string, password: string): Promise<UserProfile | null> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        throw new Error('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
      }
      throw authError;
    }
    
    if (!authData.user) return null;

    // Get the associated profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('uid', authData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profileData) return null;

    const profile: UserProfile = {
      uid: profileData.uid,
      username: profileData.username,
      email: profileData.email,
      createdAt: profileData.created_at,
      avatarUrl: profileData.avatar_url
    };

    localStorage.setItem('fruit-memory-user-id', profile.uid);
    localStorage.setItem(`profile_${profile.uid}`, JSON.stringify(profile));
    
    return profile;
  } catch (err: any) {
    console.error('Login error:', err);
    throw err;
  }
}

/**
 * Registers a new user using Supabase Auth.
 * Supabase will automatically send a confirmation email.
 */
export async function registerProfile(username: string, email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  try {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // 2. Create the profile record 
      await supabase.from('profiles').upsert([
        {
          uid: authData.user.id,
          username: username.trim().toLowerCase(),
          email: email.trim()
        }
      ]);

      // 3. Initialize Stats
      await supabase.from('stats').upsert([{
        uid: authData.user.id,
        games_played: 0,
        total_points: 0,
        last_played_at: new Date().toISOString()
      }]);
    }

    return { needsConfirmation: true };
  } catch (err: any) {
    console.error('Registration error:', err);
    throw err;
  }
}

/**
 * Fetches a user profile by UID.
 */
export async function getProfile(uid: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (!error && data) {
      const profile: UserProfile = {
        uid: data.uid,
        username: data.username,
        email: data.email,
        createdAt: data.created_at,
        avatarUrl: data.avatar_url
      };
      localStorage.setItem(`profile_${uid}`, JSON.stringify(profile));
      return profile;
    }
  } catch (err) {
    console.warn('Error fetching remote profile, checking local:', err);
  }

  const local = localStorage.getItem(`profile_${uid}`);
  if (local) return JSON.parse(local);

  return null;
}

/**
 * Updates user stats after a game.
 */
export async function updateUserStats(
  uid: string, 
  difficulty: Difficulty, 
  timeInSeconds: number, 
  points: number
): Promise<void> {
  try {
    // First get current stats to compare best times
    const { data: currentStats, error: fetchError } = await supabase
      .from('stats')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const diffKey = difficulty === 'Fácil' ? 'best_time_easy' :
                    difficulty === 'Médio' ? 'best_time_medium' :
                    difficulty === 'Difícil' ? 'best_time_hard' : 'best_time_extreme';

    const updates: any = {
      uid,
      games_played: (currentStats?.games_played || 0) + 1,
      total_points: (currentStats?.total_points || 0) + points,
      last_played_at: new Date().toISOString()
    };

    // Update best time if it's better (lower)
    const oldBest = currentStats ? currentStats[diffKey] : null;
    if (oldBest === null || timeInSeconds < oldBest) {
      updates[diffKey] = timeInSeconds;
    }

    await supabase.from('stats').upsert([updates]);
    
    // Also save locally for quick access
    localStorage.setItem(`stats_${uid}`, JSON.stringify(updates));
  } catch (err) {
    console.error('Error updating stats:', err);
  }
}

/**
 * Fetches global ranking.
 */
export async function getRanking(): Promise<RankingEntry[]> {
  try {
    // Join profiles and stats
    const { data, error } = await supabase
      .from('stats')
      .select(`
        uid,
        total_points,
        games_played,
        best_time_easy,
        profiles (
          username,
          avatar_url
        )
      `)
      .order('total_points', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      uid: row.uid || 'anon',
      username: row.profiles?.username || 'Anônimo',
      avatarUrl: row.profiles?.avatar_url,
      totalPoints: row.total_points,
      bestTimeEasy: row.best_time_easy,
      gamesPlayed: row.games_played
    }));
  } catch (err) {
    console.error('Error fetching ranking:', err);
    return [];
  }
}

/**
 * Clears the locally stored profile.
 */
export function clearLocalProfile(uid: string) {
  localStorage.removeItem(`profile_${uid}`);
  localStorage.removeItem(`stats_${uid}`);
}
