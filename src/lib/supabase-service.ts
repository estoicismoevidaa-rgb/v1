/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, getOrCreateUserId } from './supabase.ts';
import { GameRoom, Player } from '../types.ts';
import { calculateSoloRankingPoints } from './game-logic.ts';

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

// Global Lobby State
let lobbyChannel: any = null;
let lobbyUsers: any[] = [];
let lobbyMessages: any[] = [];
let lobbyCallback: ((users: any[], messages: any[]) => void) | null = null;

// Room Chat State
let roomChatChannel: any = null;
let roomMessages: any[] = [];
let roomMessagesCallback: ((messages: any[]) => void) | null = null;

export async function subscribeToLobby(callback: (users: any[], messages: any[]) => void): Promise<() => void> {
  const userId = getOrCreateUserId();
  const { data: profile } = await supabase.from('profiles').select('username').eq('uid', userId).maybeSingle();
  const username = profile?.username || 'Jogador';

  const channelId = 'global-lobby';
  
  // Cleanup
  const existing = (supabase as any).getChannels?.().find((c: any) => c.topic === `realtime:${channelId}` || c.name === channelId);
  if (existing) {
    await supabase.removeChannel(existing);
  }

  lobbyCallback = callback;
  lobbyChannel = supabase.channel(channelId);

  lobbyChannel
    .on('presence', { event: 'sync' }, () => {
      const state = lobbyChannel.presenceState();
      const users = Object.values(state).flat().map((p: any) => ({
        uid: p.uid,
        name: p.name,
        online_at: p.online_at
      }));
      // Remove duplicates by UID
      const uniqueUsers = Array.from(new Map(users.map((u: any) => [u.uid, u])).values());
      lobbyUsers = uniqueUsers;
      if (lobbyCallback) lobbyCallback(lobbyUsers, lobbyMessages);
    })
    .on('broadcast', { event: 'chat' }, (payload: any) => {
      const newMessage = {
        id: Math.random().toString(36).substring(7),
        sender: payload.payload.name,
        senderId: payload.payload.uid,
        text: payload.payload.text,
        timestamp: new Date().toISOString()
      };
      lobbyMessages = [...lobbyMessages.slice(-49), newMessage];
      if (lobbyCallback) lobbyCallback(lobbyUsers, lobbyMessages);
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await lobbyChannel.track({
          uid: userId,
          name: username,
          online_at: new Date().toISOString()
        });
      }
    });

  return () => {
    supabase.removeChannel(lobbyChannel);
    lobbyChannel = null;
    lobbyCallback = null;
  };
}

export async function sendLobbyMessage(text: string): Promise<void> {
  if (!lobbyChannel) return;
  const userId = getOrCreateUserId();
  const { data: profile } = await supabase.from('profiles').select('username').eq('uid', userId).maybeSingle();
  const username = profile?.username || 'Jogador';

  await lobbyChannel.send({
    type: 'broadcast',
    event: 'chat',
    payload: {
      uid: userId,
      name: username,
      text: text
    }
  });

  // Also add locally for the sender
  const newMessage = {
    id: Math.random().toString(36).substring(7),
    sender: username,
    senderId: userId,
    text: text,
    timestamp: new Date().toISOString()
  };
  lobbyMessages = [...lobbyMessages.slice(-49), newMessage];
  if (lobbyCallback) lobbyCallback(lobbyUsers, lobbyMessages);
}

export async function subscribeToRoomChat(roomId: string, callback: (messages: any[]) => void): Promise<() => void> {
  const channelId = `chat:${roomId}`;
  const existing = (supabase as any).getChannels?.().find((c: any) => c.topic === `realtime:${channelId}` || c.name === channelId);
  if (existing) {
    await supabase.removeChannel(existing);
  }

  roomMessages = []; // Clear for new room
  roomMessagesCallback = callback;
  roomChatChannel = supabase.channel(channelId);

  roomChatChannel
    .on('broadcast', { event: 'message' }, (payload: any) => {
      const newMessage = {
        id: Math.random().toString(36).substring(7),
        sender: payload.payload.name,
        senderId: payload.payload.uid,
        text: payload.payload.text,
        timestamp: new Date().toISOString()
      };
      roomMessages = [...roomMessages.slice(-49), newMessage];
      if (roomMessagesCallback) roomMessagesCallback(roomMessages);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(roomChatChannel);
    roomChatChannel = null;
    roomMessagesCallback = null;
  };
}

export async function sendRoomMessage(roomId: string, text: string): Promise<void> {
  if (!roomChatChannel) return;
  const userId = getOrCreateUserId();
  const { data: profile } = await supabase.from('profiles').select('username').eq('uid', userId).maybeSingle();
  const username = profile?.username || 'Jogador';

  await roomChatChannel.send({
    type: 'broadcast',
    event: 'message',
    payload: {
      uid: userId,
      name: username,
      text: text
    }
  });

  // Local add
  const newMessage = {
    id: Math.random().toString(36).substring(7),
    sender: username,
    senderId: userId,
    text: text,
    timestamp: new Date().toISOString()
  };
  roomMessages = [...roomMessages.slice(-49), newMessage];
  if (roomMessagesCallback) roomMessagesCallback(roomMessages);
}

let activeRoomChannel: any = null;

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
  const channelId = `room-signal:${roomId}`;
  
  // Cleanup any existing channel with this ID in this client
  const existingChannel = (supabase as any).getChannels?.().find((c: any) => c.topic === `realtime:${channelId}` || c.name === channelId);
  if (existingChannel) {
    await supabase.removeChannel(existingChannel);
  }

  const channel = supabase.channel(channelId, {
    config: {
      broadcast: { ack: true }
    }
  });
  activeRoomChannel = channel;

  const refreshRoom = async () => {
    const room = await getRoom(roomId);
    if (room) {
      // Preserve online status from current local state when merging DB update
      const state = channel.presenceState();
      const onlineUids = Object.values(state).flat().map((p: any) => p.uid);
      room.players = room.players.map(p => ({
        ...p,
        isOnline: onlineUids.includes(p.uid)
      }));
      currentLocalRoomState = room;
      callback(room);
    } else {
      callback(null as any);
    }
  };

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineUids = Object.values(state).flat().map((p: any) => p.uid);
      
      if (currentLocalRoomState) {
        const updatedPlayers = currentLocalRoomState.players.map(p => ({
          ...p,
          isOnline: onlineUids.includes(p.uid)
        }));
        // Create a completely new room object to trigger React update
        const updatedRoom = { ...currentLocalRoomState, players: updatedPlayers };
        currentLocalRoomState = updatedRoom;
        callback(updatedRoom);
      }
      
      // Always trigger a background refresh to catch any DB changes (new players)
      refreshRoom();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, () => {
      refreshRoom();
    })
    .on('broadcast', { event: 'force_refresh' }, () => {
      refreshRoom();
    })
    .on('broadcast', { event: 'card_flip' }, (payload: any) => {
      if (currentLocalRoomState && payload.payload?.index !== undefined) {
        const index = payload.payload.index;
        if (currentLocalRoomState.cards[index] && !currentLocalRoomState.cards[index].isFlipped) {
          // Immutable update for cards array
          const newCards = [...currentLocalRoomState.cards];
          newCards[index] = { ...newCards[index], isFlipped: true };
          currentLocalRoomState = { ...currentLocalRoomState, cards: newCards };
          callback(currentLocalRoomState);
        }
      }
    })
    .on('broadcast', { event: 'card_reset' }, (payload: any) => {
      if (currentLocalRoomState && payload.payload?.indices) {
        const indices = payload.payload.indices;
        const newCards = [...currentLocalRoomState.cards];
        let changed = false;
        indices.forEach((idx: number) => {
          if (newCards[idx] && newCards[idx].isFlipped) {
            newCards[idx] = { ...newCards[idx], isFlipped: false };
            changed = true;
          }
        });
        if (changed) {
          currentLocalRoomState = { ...currentLocalRoomState, cards: newCards };
          callback(currentLocalRoomState);
        }
      }
    })
    .on('broadcast', { event: 'room_deleted' }, () => {
      callback(null as any);
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          uid: userId,
          online_at: new Date().toISOString(),
        });
        // Immediate safety refresh and another after 1s for slow DB nodes
        refreshRoom();
        setTimeout(refreshRoom, 1500);
      }
    });

  return () => {
    supabase.removeChannel(channel);
    if (activeRoomChannel === channel) {
      activeRoomChannel = null;
    }
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

// Send a fast signal for a card flip to bypass DB delay
export async function sendCardFlip(roomId: string, index: number): Promise<void> {
  if (activeRoomChannel) {
    activeRoomChannel.send({
      type: 'broadcast',
      event: 'card_flip',
      payload: { index }
    }).catch((e: any) => console.warn('Broadcast send failed:', e));
  }
}

// Send a fast signal for cards flipping back on mismatch
export async function sendCardReset(roomId: string, indices: number[]): Promise<void> {
  if (activeRoomChannel) {
    activeRoomChannel.send({
      type: 'broadcast',
      event: 'card_reset',
      payload: { indices }
    }).catch((e: any) => console.warn('Broadcast send failed:', e));
  }
}

// Update room fields
export async function updateRoom(roomId: string, updates: Partial<GameRoom>): Promise<void> {
  const isDBActive = await checkTableExistence();
  if (isDBActive) {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
    if (updates.players !== undefined) dbUpdates.players = JSON.stringify(updates.players);
    if (updates.cards !== undefined) dbUpdates.cards = JSON.stringify(updates.cards);
    if (updates.currentPlayerIndex !== undefined) dbUpdates.current_player_index = updates.currentPlayerIndex;
    if (updates.gameStartedAt !== undefined) dbUpdates.game_started_at = updates.gameStartedAt;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase.from('rooms').update(dbUpdates).eq('id', roomId);
    if (error) {
      console.error('Error updating room:', error);
    }
    
    // Notify via broadcast for immediate refresh on all clients
    if (activeRoomChannel) {
      activeRoomChannel.send({
        type: 'broadcast',
        event: 'force_refresh',
        payload: {}
      }).catch((e: any) => console.warn('Broadcast send failed:', e));
    }
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
      if (activeRoomChannel) {
        activeRoomChannel.send({
          type: 'broadcast',
          event: 'force_refresh',
          payload: {}
        });
      } else {
        const sigId = `room-signal:${roomId}`;
        const channel = supabase.channel(sigId);
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
  if (activeRoomChannel) {
    activeRoomChannel.send({
      type: 'broadcast',
      event: 'room_deleted',
      payload: { roomId }
    });
  } else {
    const sigId = `room-signal:${roomId}`;
    const channel = supabase.channel(sigId);
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
    if (activeRoomChannel) {
      activeRoomChannel.send({
        type: 'broadcast',
        event: 'force_refresh',
        payload: {}
      });
    } else {
      const sigId = `room-signal:${roomId}`;
      const channel = supabase.channel(sigId);
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
}

/** 
 * NEW: Online Public Lobby Logic
 */

// Get all public rooms that are waiting for players
export async function getPublicRooms(): Promise<GameRoom[]> {
  const isDBActive = await checkTableExistence();
  if (!isDBActive) return [];
  
  // Only show rooms that were updated in the last 5 minutes to avoid ghost rooms from crashed sessions
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'waiting')
    .gt('updated_at', staleThreshold)
    .order('created_at', { ascending: false });
    
  if (error || !data) return [];

  // Filter in memory to ensure we only show rooms with space and at least one player
  return data
    .map(parseDBRoom)
    .filter(r => r.players.length > 0 && r.players.length < r.maxPlayers);
}

// Find or Create a public room for a specific player count
export async function findOrCreatePublicRoom(maxPlayers: number, difficulty: string, cards: any[]): Promise<string> {
  // Try twice with a small delay to avoid simultaneous creation race conditions
  const findRoom = async () => {
    const rooms = await getPublicRooms();
    return rooms.find(r => r.maxPlayers === maxPlayers && r.players.length < maxPlayers && r.difficulty === difficulty);
  };

  let availableRoom = await findRoom();
  if (availableRoom) return availableRoom.id!;

  // Random delay 500-1500ms
  await new Promise(res => setTimeout(res, 500 + Math.random() * 1000));

  availableRoom = await findRoom();
  if (availableRoom) return availableRoom.id!;
  
  // Create a new one
  const roomId = `PUB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const userId = getOrCreateUserId();
  const { data: profile } = await supabase.from('profiles').select('username').eq('uid', userId).maybeSingle();
  const username = profile?.username || 'Jogador';
  
  const room: GameRoom = {
    ownerId: userId,
    status: 'waiting',
    difficulty: difficulty as any,
    players: [{ uid: userId, name: username, score: 0, isHost: true }],
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
export async function submitSoloTime(userId: string, username: string, difficulty: string, time: number, errors: number): Promise<void> {
  const isDBActive = await checkTableExistence();
  if (!isDBActive || userId.startsWith('user_')) return;

  // 1. Ensure profile exists
  const { data: profile } = await supabase.from('profiles').select('uid').eq('uid', userId).maybeSingle();
  if (profile) {
    await supabase.from('profiles').update({ username, updated_at: new Date().toISOString() }).eq('uid', userId);
  } else {
    await supabase.from('profiles').insert([{ uid: userId, username, updated_at: new Date().toISOString() }]);
  }

  // 2. Fetch current stats
  const { data: stats } = await supabase
    .from('stats')
    .select('*')
    .eq('uid', userId)
    .maybeSingle();

  const soloResult = calculateSoloRankingPoints(difficulty as any, time, errors);
  const points = soloResult.totalPoints;
  
  const updates: any = {
    ...(stats || {}),
    uid: userId,
    games_played: (stats?.games_played || 0) + 1,
    total_points: (stats?.total_points || 0) + points,
    solo_points: (stats?.solo_points || 0) + points,
    last_played_at: new Date().toISOString()
  };

  // Update best time for difficulty
  const timeField = difficulty === 'Fácil' ? 'best_time_easy' : 
                   difficulty === 'Médio' ? 'best_time_medium' : 
                   difficulty === 'Difícil' ? 'best_time_hard' : 'best_time_extreme';
  
  if (!stats?.[timeField] || time < stats[timeField]) {
    updates[timeField] = time;
  }

  if (stats && stats.uid) {
    const { error } = await supabase.from('stats').update(updates).eq('uid', userId);
    if (error) console.error('Error in submitSoloTime update:', error);
  } else {
    // Need to ensure uid is present
    updates.uid = userId;
    const { error } = await supabase.from('stats').insert([updates]);
    if (error) console.error('Error in submitSoloTime insert:', error);
  }
}

// Submit online points to global ranking
export async function submitOnlineScore(userId: string, points: number, username: string = 'Jogador', isSolo: boolean = false): Promise<void> {
  const isDBActive = await checkTableExistence();
  if (!isDBActive || userId.startsWith('user_')) return;

  // 1. Ensure profile exists
  const { data: profile } = await supabase.from('profiles').select('uid').eq('uid', userId).maybeSingle();
  if (profile) {
    await supabase.from('profiles').update({ username, updated_at: new Date().toISOString() }).eq('uid', userId);
  } else {
    await supabase.from('profiles').insert([{ uid: userId, username, updated_at: new Date().toISOString() }]);
  }

  const { data: stats } = await supabase
    .from('stats')
    .select('*')
    .eq('uid', userId)
    .maybeSingle();

  const updates: any = {
    ...(stats || {}),
    uid: userId,
    total_points: (stats?.total_points || 0) + points,
    games_played: (stats?.games_played || 0) + 1,
    last_played_at: new Date().toISOString()
  };

  if (isSolo) {
    updates.solo_points = (stats?.solo_points || 0) + points;
  } else {
    updates.versus_points = (stats?.versus_points || 0) + points;
  }

  if (stats && stats.uid) {
    const { error } = await supabase.from('stats').update(updates).eq('uid', userId);
    if (error) console.error('Error in submitOnlineScore update:', error);
  } else {
    updates.uid = userId;
    const { error } = await supabase.from('stats').insert([updates]);
    if (error) console.error('Error in submitOnlineScore insert:', error);
  }
}

// Get global ranking (ordered by solo points, versus points or total points)
export async function getGlobalRanking(mode: 'solo' | 'versus' | 'total' = 'solo', limit: number = 50): Promise<any[]> {
  const isDBActive = await checkTableExistence();
  if (!isDBActive) return [];

  const orderField = mode === 'solo' ? 'solo_points' : mode === 'versus' ? 'versus_points' : 'total_points';

  const { data, error } = await supabase
    .from('stats')
    .select(`
      uid,
      total_points,
      solo_points,
      versus_points,
      best_time_easy,
      games_played,
      level,
      profiles (
        username,
        avatar_url,
        equipped_frame
      )
    `)
    .order(orderField, { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error('getGlobalRanking error:', error);
    return [];
  }
  
  return data.map((item: any) => ({
    uid: item.uid,
    username: item.profiles?.username || 'Anônimo',
    avatarUrl: item.profiles?.avatar_url,
    equippedFrame: item.profiles?.equipped_frame,
    totalPoints: item.total_points,
    soloPoints: item.solo_points || 0,
    versusPoints: item.versus_points || 0,
    bestTimeEasy: item.best_time_easy,
    gamesPlayed: item.games_played,
    level: item.level || 1
  }));
}
