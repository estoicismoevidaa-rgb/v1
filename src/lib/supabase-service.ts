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
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    gameStartedAt: data.game_started_at
  };
}

// Subscribe to room changes: Either via Postgres changes or Broadcast channel
export async function subscribeToRoom(roomId: string, callback: (room: GameRoom) => void): Promise<() => void> {
  const isDBActive = await checkTableExistence();
  
  if (isDBActive) {
    // Standard Supabase DB Change Listener
    const channel = supabase
      .channel(`db-rooms-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            callback(parseDBRoom(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);
    if (error) throw error;
  } else {
    // Store locally on this host, broadcast to players
    currentLocalRoomState = { ...room, id: roomId };
    console.log('Room created (Broadcast mode):', roomId);
    // Give time for subscription to connect
    const broadcast = () => {
      if (broadcastChannel) {
        broadcastRoomState(roomId, currentLocalRoomState!);
      }
    };
    setTimeout(broadcast, 500);
    setTimeout(broadcast, 2000); // Second attempt just in case
  }
}

// Fetch room to inspect status (primarily for join check)
export async function getRoom(roomId: string): Promise<GameRoom | null> {
  const isDBActive = await checkTableExistence();
  if (isDBActive) {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (error || !data) return null;
    return parseDBRoom(data);
  } else {
    // In broadcast mode, if we are just joining, we have no DB to query directly.
    // Return a temporary blank GameRoom so join process flows into subscribing where the host gives the state!
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

    const { error } = await supabase.from('rooms').update(dbUpdates).eq('id', roomId);
    if (error) throw error;
  } else {
    if (currentLocalRoomState) {
      currentLocalRoomState = {
        ...currentLocalRoomState,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      broadcastRoomState(roomId, currentLocalRoomState);
    } else {
      // Direct update broadcast if we are just a client sending update events
      if (broadcastChannel) {
        broadcastChannel.send({
          type: 'broadcast',
          event: 'state_changed',
          payload: updates // will be partially merged by receiver or fully sent
        });
      }
    }
  }
}

// Join a room
export async function joinRoom(roomId: string, player: Player): Promise<void> {
  const isDBActive = await checkTableExistence();
  if (isDBActive) {
    const currentRoom = await getRoom(roomId);
    if (!currentRoom) throw new Error('Sala não encontrada');
    
    // Check if player already added
    const exists = currentRoom.players.some(p => p.uid === player.uid);
    if (!exists) {
      const updatedPlayers = [...currentRoom.players, player];
      const { error } = await supabase
        .from('rooms')
        .update({ players: updatedPlayers, updated_at: new Date().toISOString() })
        .eq('id', roomId);
      if (error) throw error;
    }
  } else {
    // Tell host we're here
    if (broadcastChannel) {
      broadcastChannel.send({
        type: 'broadcast',
        event: 'player_joined',
        payload: player
      });
    }
  }
}

// Leave room
export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  const isDBActive = await checkTableExistence();
  if (isDBActive) {
    const currentRoom = await getRoom(roomId);
    if (!currentRoom) return;
    
    if (currentRoom.ownerId === userId) {
      // Host leaves, end game
      await supabase.from('rooms').update({ status: 'finished', updated_at: new Date().toISOString() }).eq('id', roomId);
    } else {
      const updatedPlayers = currentRoom.players.filter(p => p.uid !== userId);
      await supabase
        .from('rooms')
        .update({ players: updatedPlayers, updated_at: new Date().toISOString() })
        .eq('id', roomId);
    }
  } else {
    if (broadcastChannel) {
      broadcastChannel.send({
        type: 'broadcast',
        event: 'player_left',
        payload: { uid: userId }
      });
    }
  }
}
