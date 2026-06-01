/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { User, Copy, Check, Play, LogOut } from 'lucide-react';
import { useState } from 'react';
import { GameRoom } from '../types.ts';

interface WaitingRoomProps {
  room: GameRoom;
  userId: string;
  onStart: () => void;
  onLeave: () => void;
}

export function WaitingRoom({ room, userId, onStart, onLeave }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const isHost = room.ownerId === userId;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '?room=' + room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <div className="w-full max-w-md bg-blue-900/40 p-8 rounded-3xl border border-blue-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Sala de Espera</h2>
          <span className="px-3 py-1 bg-blue-800 rounded-lg text-sm font-bold text-green-400">
            {room.difficulty}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-blue-950 border border-blue-700 rounded-xl">
            <span className="text-blue-300 font-mono">{room.id}</span>
            <button onClick={copyLink} className="p-2 hover:bg-blue-800 rounded-lg text-blue-200 transition-all">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-blue-400 mt-2 text-center">Compartilhe o código ou o link com seus amigos</p>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-blue-200 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" /> Jogadores ({room.players.length}/6)
          </h3>
          <div className="space-y-2">
            {room.players.map((p, i) => (
              <motion.div 
                key={p.uid}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between bg-blue-950/80 p-3 rounded-xl border border-blue-800"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.uid === room.ownerId ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  <span className="font-medium">{p.name}</span>
                </div>
                {p.uid === room.ownerId && <span className="text-[10px] bg-yellow-400/20 text-yellow-500 px-2 rounded uppercase font-bold">Host</span>}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isHost ? (
            <button
              onClick={onStart}
              disabled={room.players.length < 2}
              className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6" /> Começar Partida
            </button>
          ) : (
            <div className="text-center p-4 bg-blue-800/20 rounded-xl border border-blue-700 text-blue-200 animate-pulse">
              Aguardando o Host começar...
            </div>
          )}
          
          <button 
            onClick={onLeave}
            className="w-full py-3 text-red-400 hover:bg-red-500/10 rounded-xl flex items-center justify-center gap-2 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" /> Sair da Sala
          </button>
        </div>
      </div>
    </div>
  );
}
