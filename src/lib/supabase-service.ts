/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, getOrCreateUserId } from './supabase.ts';
import { GameRoom, Player } from '../types.ts';

// Realtime fallback listeners & local copies
let broadcastChannel: any = null;
let broadcastCallback: ((room: GameRoom) => void) | null = null;
let currentLocalRoomState: GameRoom | null = null;
let useBroadcastMode = false;

// Attempt DB check to see if database table "rooms" exists
let checkCompleted = false;
async function checkTableExistence(): Promise<boolean> {
  if (checkCompleted) return !useBroadcastMode;
  try {
    console.log('Checking if "rooms" table exists in Supabase...');
    const { error } = await supabase.from('rooms').select('id').limit(1);
    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      console.warn('Supabase "rooms" table does not exist. Switching to Realtime Broadcast mode.');
      useBroadcastMode = true;
    } else if (error) {
      console.error('Supabase connection error:', error);
      // If it's a connection error rather than "table missing", still try broadcast but log it
      useBroadcastMode = true;
    } else {
      console.log('Supabase "rooms" table confirmed active.');
      useBroadcastMode = false;
    }
  } catch (err) {
    console.error('Unexpected error checking table existence:', err);
    useBroadcastMode = true;
  }
  checkCompleted = true;
  return !useBroadcastMode;
}

// Convert DB schema format (snake_case/flat fields) to GameRoom frontend format
function parseDBRoom(data: any): GameRoom {
  return {
    id: data.id,
    ownerId: data.owner_id,
    status: data.status,
    difficulty: data.difficulty,
    players: typeof data.players === 'string' ? JSON.parse(data.players) : (data.players || []),
    cards: typeof data.cards === 'string' ? JSON.parse(data.cards) : (data.cards || []),
    currentPlayerIndex: data.current_player_index || 0,
    password: data.password,
    maxPlayers: data.max_players || 2,
    isPublic: data.is_public || false,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    gameStartedAt: data.game_started_at
  };
}

// Subscribe to room changes: Either via Postgres changes or Broadcast channel
export async function subscribeToRoom(roomId: string, callback: (room: GameRoom) => void): Promise<() => void> {
  const isDBActive = await checkTableExistence();
  const userId = getOrCreateUserId();
  
  // 1. Initial Fetch to populate local state
  const initialRoom = await getRoom(roomId);
  if (initialRoom) {
    currentLocalRoomState = initialRoom;
    callback(initialRoom);
  }

  // 2. Setup Realtime Channel for Presence and Fast Signaling
  const channelId = `room:${roomId}`;
  const channel = supabase.channel(channelId);

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineUids = Object.values(state).flat().map((p: any) => p.uid);
      
      if (currentLocalRoomState) {
        const updatedPlayers = currentLocalRoomState.players.map(p => ({
          ...p,
          isOnline: onlineUids.includes(p.uid)
        }));
        currentLocalRoomState = { ...currentLocalRoomState, players: updatedPlayers };
        callback(currentLocalRoomState);
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
      if (payload.new && Object.keys(payload.new).length > 0) {
        const room = parseDBRoom(payload.new);
        // Preserve online status from current local state when merging DB update
        const onlineUids = Object.values(channel.presenceState()).flat().map((p: any) => p.uid);
        room.players = room.players.map(p => ({
          ...p,
          isOnline: onlineUids.includes(p.uid)
        }));
        currentLocalRoomState = room;
        callback(room);
      } else if (payload.eventType === 'DELETE') {
        callback({ id: roomId, ownerId: '', status: 'finished', difficulty: 'Fácil', players: [], cards: [], currentPlayerIndex: 0, createdAt: '', updatedAt: '', maxPlayers: 2, isPublic: false });
      }
    })
    .on('broadcast', { event: 'force_refresh' }, async () => {
      const room = await getRoom(roomId);
      if (room) {
        currentLocalRoomState = room;
        callback(room);
      }
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          uid: userId,
          online_at: new Date().toISOString(),
        });
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// Safely broadcast the state manually for broadcast Fallback
function broadcastRoomState(roomId: string, state: GameRoom) {
  if (broadcastChannel) {
    broadcastChannel.send({
      type: 'broadcast',
      event: 'state_changed',
      payload: state
    });
  }
}

// Setup a room
export async function createRoom(roomId: string, room: GameRoom): Promise<void> {
  const isDBActive = await checkTableExistence();
  if (isDBActive) {
    const { error } = await supabase.from('rooms').insert([{
      id: roomId,
      owner_id: room.ownerId,
      status: room.status,
      difficulty: room.difficulty,
      players: room.players,
      cards: room.cards,
      current_player_index: room.currentPlayerIndex,
      password: room.password,
      max_players: room.maxPlayers,
      is_public: room.isPublic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);
    if (error) {
      // If columns missing, try to insert with minimal set
      await supabase.from('rooms').insert([{
        id: roomId,
        owner_id: room.ownerId,
        status: room.status,
        difficulty: room.difficulty,
        players: room.players,
        cards: room.cards,
        current_player_index: room.currentPlayerIndex,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    }
  } else {
    // Store locally on this host, broadcast to players
    currentLocalRoomState = { ...room, id: roomId };
    console.log('Room created (Broadcast mode):', roomId);
  }
  
  // Always join a broadcast channel even in DB mode for fast signaling
  const channelId = `signal-trigger-${roomId}-${Math.random().toString(36).substring(7)}`;
  const channel = supabase.channel(channelId);
  channel.subscribe((status: string) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event: 'room_ready',
        payload: { roomId }
      });
      // Cleanup signaling channel after send
      setTimeout(() => supabase.removeChannel(channel), 2000);
    }
  });
}

// Fetch room to inspect status (primarily for join check)
export async function getRoom(roomId: string): Promise<GameRoom | null> {
  const normalizedId = roomId.toUpperCase().trim();
  try {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', normalizedId).maybeSingle();
    if (error) {
      console.error('getRoom DB Error:', error);
      if (useBroadcastMode) {
        return {
          id: normalizedId,
          ownerId: '',
          status: 'waiting',
          difficulty: 'Fácil',
          players: [],
          cards: [],
          currentPlayerIndex: 0,
          maxPlayers: 2,
          isPublic: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return null;
    }
    if (!data) return null;
    return parseDBRoom(data);
  } catch (err) {
    console.error('getRoom Catch Error:', err);
    return null;
  }
}

// Update room fields
export async function updateRoom(roomId: string, updates: Partial<GameRoom>): Promise<void> {
  const isDBActive = await checkTableExistence();
  if (isDBActive) {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
    if (updates.players !== undefined) dbUpdates.players = updates.players;
    if (updates.cards !== undefined) dbUpdates.cards = updates.cards;
    if (updates.currentPlayerIndex !== undefined) dbUpdates.current_player_index = updates.currentPlayerIndex;
    if (updates.gameStartedAt !== undefined) dbUpdates.game_started_at = updates.gameStartedAt;
    dbUpdates.updated_at = new Date().toISOString();

    await supabase.from('rooms').update(dbUpdates).eq('id', roomId);
    
    // Notify via broadcast for immediate refresh on all clients
    const channel = supabase.channel(`room:${roomId}`);
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'force_refresh',
          payload: {}
        });
        setTimeout(() => supabase.removeChannel(channel), 1000);
      }
    });
  } else {
    if (currentLocalRoomState) {
      currentLocalRoomState = {
        ...currentLocalRoomState,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      broadcastRoomState(roomId, currentLocalRoomState);
    }
  }
}

// Join a room
export async function joinRoom(roomId: string, player: Player): Promise<void> {
  const isDBActive = await checkTableExistence();
  
  if (isDBActive) {
    // Force fresh fetch to avoid overwriting other recently joined players
    const { data } = await supabase.from('rooms').select('players').eq('id', roomId).single();
    if (!data) throw new Error('Sala não encontrada');
    
    const currentPlayers: Player[] = typeof data.players === 'string' ? JSON.parse(data.players) : (data.players || []);
    const exists = currentPlayers.some(p => p.uid === player.uid);
    
    if (!exists) {
      const updatedPlayers = [...currentPlayers, player];
      await supabase
        .from('rooms')
        .update({ players: updatedPlayers, updated_at: new Date().toISOString() })
        .eq('id', roomId);
        
      // Broadcast force refresh
      const channel = supabase.channel(`room:${roomId}`);
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'force_refresh',
            payload: {}
          });
          setTimeout(() => supabase.removeChannel(channel), 1000);
        }
      });
    }
  } else {
    // Broadcast fallback for non-DB mode
    if (currentLocalRoomState) {
      const exists = currentLocalRoomState.players.some(p => p.uid === player.uid);
      if (!exists) {
        currentLocalRoomState.players.push(player);
        broadcastRoomState(roomId, currentLocalRoomState);
      }
    }
  }
}

// Delete room permanently
export async function deleteRoom(roomId: string): Promise<void> {
  await supabase.from('rooms').delete().eq('id', roomId);
  const delChannelId = `del-msg-${roomId}-${Math.random().toString(36).substring(7)}`;
  const channel = supabase.channel(delChannelId);
  channel.subscribe((status: string) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event: 'room_deleted',
        payload: { roomId }
      });
      setTimeout(() => supabase.removeChannel(channel), 1000);
    }
  });
}

// Leave room
export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  const currentRoom = await getRoom(roomId);
  if (!currentRoom) return;
  
  if (currentRoom.ownerId === userId) {
    // Host leaves, delete the room
    await deleteRoom(roomId);
  } else {
    const updatedPlayers = currentRoom.players.filter(p => p.uid !== userId);
    const isDBActive = !useBroadcastMode;
    if (isDBActive) {
      await supabase
        .from('rooms')
        .update({ players: updatedPlayers, updated_at: new Date().toISOString() })
        .eq('id', roomId);
    }
    
    // Broadcast force refresh
    const channel = supabase.channel(`room:${roomId}`);
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'force_refresh',
          payload: {}
        });
        setTimeout(() => supabase.removeChannel(channel), 1000);
      }
    });
  }
}

/** 
 * NEW: Online Public Lobby Logic
 */

// Get all public rooms that are waiting for players
export async function getPublicRooms(): Promise<GameRoom[]> {
  const isDBActive = await checkTableExistence();
  if (!isDBActive) return [];
  
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });
    
  if (error || !data) return [];
  return data.map(parseDBRoom);
}

// Find or Create a public room for a specific player count
export async function findOrCreatePublicRoom(maxPlayers: number, difficulty: string, cards: any[]): Promise<string> {
  const rooms = await getPublicRooms();
  const availableRoom = rooms.find(r => r.maxPlayers === maxPlayers && r.players.length < maxPlayers && r.difficulty === difficulty);
  
  if (availableRoom) {
    return availableRoom.id!;
  }
  
  // Create a new one
  const roomId = `PUB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const userId = getOrCreateUserId();
  const room: GameRoom = {
    ownerId: userId,
    status: 'waiting',
    difficulty: difficulty as any,
    players: [], // Will join immediately after
    cards: cards,
    currentPlayerIndex: 0,
    maxPlayers: maxPlayers,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await createRoom(roomId, room);
  return roomId;
}

/**
 * NEW: Ranking & Stats Logic
 */

// Submit a solo time to global ranking
export async function submitSoloTime(userId: string, username: string, difficulty: string, time: number): Promise<void> {
  const isDBActive = await checkTableExistence();
  if (!isDBActive) return;

  // 1. Ensure profile exists (update username if needed)
  await supabase.from('profiles').upsert([{ 
    uid: userId, 
    username: username,
    updated_at: new Date().toISOString()
  }], { onConflict: 'uid' });

  // 2. Fetch current stats
  const { data: stats } = await supabase
    .from('stats')
    .select('*')
    .eq('uid', userId)
    .maybeSingle();

  const points = Math.max(10, 1000 - time * 2); // Simple points calculation
  
  const updates: any = {
    uid: userId,
    games_played: (stats?.games_played || 0) + 1,
    total_points: (stats?.total_points || 0) + points,
    last_played_at: new Date().toISOString()
  };

  // Update best time for difficulty
  const timeField = difficulty === 'Fácil' ? 'best_time_easy' : 
                   difficulty === 'Médio' ? 'best_time_medium' : 
                   difficulty === 'Difícil' ? 'best_time_hard' : 'best_time_extreme';
  
  if (!stats?.[timeField] || time < stats[timeField]) {
    updates[timeField] = time;
  }

  await supabase.from('stats').upsert([updates]);
}

// Get global ranking (ordered by total points or best time)
export async function getGlobalRanking(limit: number = 20): Promise<any[]> {
  const isDBActive = await checkTableExistence();
  if (!isDBActive) return [];

  const { data, error } = await supabase
    .from('stats')
    .select(`
      uid,
      total_points,
      best_time_easy,
      games_played,
      profiles:uid (
        username,
        avatar_url
      )
    `)
    .order('total_points', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  
  return data.map((item: any) => ({
    uid: item.uid,
    username: item.profiles?.username || 'Anônimo',
    avatarUrl: item.profiles?.avatar_url,
    totalPoints: item.total_points,
    bestTimeEasy: item.best_time_easy,
    gamesPlayed: item.games_played
  }));
}
