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
  
  // Use a unique sub-header to avoid "already subscribed" errors if reused
  const speedChannelId = `speed-room-${roomId}-${Math.random().toString(36).substring(7)}`;
  const speedChannel = supabase.channel(speedChannelId)
    .on('presence', { event: 'sync' }, () => {
      const state = speedChannel.presenceState();
      // Map presence to UIDs
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
    .on('broadcast', { event: 'player_joined' }, async () => {
      // Force refresh data from DB when someone joins
      if (isDBActive) {
        const room = await getRoom(roomId);
        if (room) callback(room);
      }
    })
    .on('broadcast', { event: 'player_left' }, async () => {
      if (isDBActive) {
        const room = await getRoom(roomId);
        if (room) callback(room);
      }
    })
    .on('broadcast', { event: 'state_pushed' }, (payload) => {
      // Partially merge updates received via broadcast if we have current state
      if (currentLocalRoomState) {
        currentLocalRoomState = { ...currentLocalRoomState, ...payload.payload };
        callback(currentLocalRoomState);
      }
    })
    .on('broadcast', { event: 'room_deleted' }, () => {
      // Room was deleted, trigger exit
      callback({ id: roomId, ownerId: '', status: 'finished', difficulty: 'Fácil', players: [], cards: [], currentPlayerIndex: 0, createdAt: '', updatedAt: '', maxPlayers: 2, isPublic: false });
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        const uid = getOrCreateUserId();
        await speedChannel.track({
          uid,
          online_at: new Date().toISOString(),
        });
      }
    });

  if (isDBActive) {
    // Standard Supabase DB Change Listener
    const dbChannelId = `db-rooms-${roomId}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(dbChannelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            const room = parseDBRoom(payload.new);
            currentLocalRoomState = room;
            callback(room);
          } else if (payload.eventType === 'DELETE') {
            // Room deleted
            callback({ id: roomId, ownerId: '', status: 'finished', difficulty: 'Fácil', players: [], cards: [], currentPlayerIndex: 0, createdAt: '', updatedAt: '', maxPlayers: 2, isPublic: false });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(speedChannel);
    };
  } else {
    // Direct Broadcast fallback channel
    broadcastCallback = callback;
    broadcastChannel = supabase.channel(`room_broadcast_${roomId}`, {
      config: { broadcast: { self: true } }
    });

    broadcastChannel
      .on('broadcast', { event: 'state_changed' }, ({ payload }: any) => {
        if (payload) {
          currentLocalRoomState = payload;
          if (broadcastCallback) broadcastCallback(payload);
        }
      })
      .on('broadcast', { event: 'player_joined' }, ({ payload }: any) => {
        // Only the room owner (host) processes player joining and publishes the updated state
        const currentUid = getOrCreateUserId();
        if (currentLocalRoomState && currentLocalRoomState.ownerId === currentUid) {
          const exists = currentLocalRoomState.players.some((p: Player) => p.uid === payload.uid);
          if (!exists) {
            const updatedPlayers = [...currentLocalRoomState.players, payload];
            const updatedState = {
              ...currentLocalRoomState,
              players: updatedPlayers,
              updatedAt: new Date().toISOString()
            };
            currentLocalRoomState = updatedState;
            broadcastRoomState(roomId, updatedState);
          }
        }
      })
      .on('broadcast', { event: 'player_left' }, ({ payload }: any) => {
        const currentUid = getOrCreateUserId();
        if (currentLocalRoomState && currentLocalRoomState.ownerId === currentUid) {
          const updatedPlayers = currentLocalRoomState.players.filter((p: Player) => p.uid !== payload.uid);
          const updatedState = {
            ...currentLocalRoomState,
            players: updatedPlayers,
            updatedAt: new Date().toISOString()
          };
          currentLocalRoomState = updatedState;
          broadcastRoomState(roomId, updatedState);
        }
      })
      .on('broadcast', { event: 'request_state' }, () => {
        // When someone requests the current state, if we are the host, we send it
        const currentUid = getOrCreateUserId();
        if (currentLocalRoomState && currentLocalRoomState.ownerId === currentUid) {
          broadcastRoomState(roomId, currentLocalRoomState);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          // If we joined, request the state from the host
          broadcastChannel.send({
            type: 'broadcast',
            event: 'request_state',
            payload: {}
          });
        }
      });

    return () => {
      supabase.removeChannel(broadcastChannel);
      broadcastChannel = null;
      broadcastCallback = null;
    };
  }
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
    // Map properties back to DB snake_case fields
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
    if (updates.players !== undefined) dbUpdates.players = updates.players;
    if (updates.cards !== undefined) dbUpdates.cards = updates.cards;
    if (updates.currentPlayerIndex !== undefined) dbUpdates.current_player_index = updates.currentPlayerIndex;
    if (updates.gameStartedAt !== undefined) dbUpdates.game_started_at = updates.gameStartedAt;
    dbUpdates.updated_at = new Date().toISOString();

    await supabase.from('rooms').update(dbUpdates).eq('id', roomId);
    
    // Notify via broadcast too for speed
    const msgChannelId = `state-msg-${roomId}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(msgChannelId);
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'state_pushed',
          payload: updates
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
  const currentRoom = await getRoom(roomId);
  if (!currentRoom) throw new Error('Sala não encontrada');
  
  const isDBActive = !useBroadcastMode;
  if (isDBActive) {
    // Check if player already added
    const exists = currentRoom.players.some(p => p.uid === player.uid);
    if (!exists) {
      const updatedPlayers = [...currentRoom.players, player];
      await supabase
        .from('rooms')
        .update({ players: updatedPlayers, updated_at: new Date().toISOString() })
        .eq('id', roomId);
        
      // Crucial: Send broadcast to wake up host
      const joinChannelId = `join-msg-${roomId}-${Math.random().toString(36).substring(7)}`;
      const channel = supabase.channel(joinChannelId);
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'player_joined',
            payload: player
          });
          setTimeout(() => supabase.removeChannel(channel), 1000);
        }
      });
    }
  } else {
    // Broadcast fallback
    const fallbackChannelId = `room_broadcast_${roomId}`;
    const channel = supabase.channel(fallbackChannelId);
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'player_joined',
          payload: player
        });
      }
    });
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
    // Host leaves, delete the room so it "disappears"
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
    
    // Notify via broadcast
    const leaveChannelId = `leave-msg-${roomId}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(leaveChannelId);
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'player_left',
          payload: { uid: userId }
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
