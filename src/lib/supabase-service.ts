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
    players: typeof data.players === 'string' ? JSON.parse(data.players) : data.players,
    cards: typeof data.cards === 'string' ? JSON.parse(data.cards) : data.cards,
    currentPlayerIndex: data.current_player_index,
    password: data.password,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    gameStartedAt: data.game_started_at
  };
}

// Subscribe to room changes: Either via Postgres changes or Broadcast channel
export async function subscribeToRoom(roomId: string, callback: (room: GameRoom) => void): Promise<() => void> {
  const isDBActive = await checkTableExistence();
  
  // Secondary speed channel for instant updates and Presence
  const speedChannel = supabase.channel(`speed-room-${roomId}`)
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
      callback({ id: roomId, ownerId: '', status: 'finished', difficulty: 'Fácil', players: [], cards: [], currentPlayerIndex: 0, createdAt: '', updatedAt: '' });
    })
    .subscribe(async (status) => {
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
    const channel = supabase
      .channel(`db-rooms-${roomId}`)
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
            callback({ id: roomId, ownerId: '', status: 'finished', difficulty: 'Fácil', players: [], cards: [], currentPlayerIndex: 0, createdAt: '', updatedAt: '' });
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);
    if (error) {
      // If password column missing, ignore it for now but try to insert without it
      if (error.message.includes('column "password"')) {
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
      } else {
        throw error;
      }
    }
  } else {
    // Store locally on this host, broadcast to players
    currentLocalRoomState = { ...room, id: roomId };
    console.log('Room created (Broadcast mode):', roomId);
  }
  
  // Always join a broadcast channel even in DB mode for fast signaling
  const channel = supabase.channel(`speed-room-${roomId}`);
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event: 'room_ready',
        payload: { roomId }
      });
    }
  });
}

// Fetch room to inspect status (primarily for join check)
export async function getRoom(roomId: string): Promise<GameRoom | null> {
  try {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (error || !data) {
      if (useBroadcastMode) {
        return {
          id: roomId,
          ownerId: '',
          status: 'waiting',
          difficulty: 'Fácil',
          players: [],
          cards: [],
          currentPlayerIndex: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return null;
    }
    return parseDBRoom(data);
  } catch (err) {
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
    const channel = supabase.channel(`speed-room-${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'state_pushed',
      payload: updates
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
      const channel = supabase.channel(`speed-room-${roomId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'player_joined',
            payload: player
          });
        }
      });
    }
  } else {
    // Broadcast fallback
    const channel = supabase.channel(`room_broadcast_${roomId}`);
    channel.subscribe((status) => {
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
  const channel = supabase.channel(`speed-room-${roomId}`);
  channel.send({
    type: 'broadcast',
    event: 'room_deleted',
    payload: { roomId }
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
    const channel = supabase.channel(`speed-room-${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'player_left',
      payload: { uid: userId }
    });
  }
}
