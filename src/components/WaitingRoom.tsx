/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Copy, Check, Play, LogOut, Key, MessageSquare, Send } from 'lucide-react';
import { GameRoom } from '../types.ts';
import { subscribeToRoomChat, sendRoomMessage } from '../lib/supabase-service.ts';

interface WaitingRoomProps {
  room: GameRoom;
  userId: string;
  onStart: () => void;
  onLeave: () => void;
}

export function WaitingRoom({ room, userId, onStart, onLeave }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isHost = room.ownerId === userId;

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    if (room.id) {
      subscribeToRoomChat(room.id, (msgs) => {
        setMessages(msgs);
      }).then(unsub => unsubscribe = unsub);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [room.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !room.id) return;
    sendRoomMessage(room.id, newMessage.trim());
    setNewMessage('');
  };

  const copyLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const roomUrl = `${cleanBaseUrl}?room=${room.id}`;
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Room Info & Players */}
        <div className="bg-blue-900/40 p-8 rounded-[2.5rem] border border-blue-700 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">Sala de Espera</h2>
            <span className="px-3 py-1 bg-blue-800 rounded-lg text-sm font-bold text-green-400">
              {room.difficulty}
            </span>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-950 border border-blue-700 rounded-2xl">
              <div>
                <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Código da Sala</p>
                <span className="text-2xl font-black text-white tracking-widest font-mono">{room.id}</span>
              </div>
              <button onClick={copyLink} className="p-3 hover:bg-blue-800 rounded-xl text-blue-200 transition-all bg-blue-900/50">
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            
            <p className="text-xs text-blue-400 text-center font-medium">Informe o código para seus amigos entrarem</p>
          </div>

          <div className="mb-8 flex-grow">
            <h3 className="text-sm font-black text-blue-200 mb-4 flex items-center gap-2 uppercase tracking-tight">
              <User className="w-4 h-4 text-blue-400" /> JOGADORES ({room.players.length} / {room.maxPlayers || 6})
            </h3>
            <div className="space-y-3">
              {room.players.map((p, i) => (
                <motion.div 
                  key={`${p.uid}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between bg-blue-950/40 p-4 rounded-2xl border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${p.isOnline ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-slate-600 animate-pulse'}`} />
                    <span className={`font-bold ${p.isOnline ? 'text-white' : 'text-slate-400'}`}>{p.name}</span>
                  </div>
                  {p.uid === room.ownerId && (
                    <span className="text-[10px] bg-yellow-400/20 text-yellow-500 px-2 py-1 rounded-lg uppercase font-black tracking-tighter shadow-inner border border-yellow-500/30">
                      HOSPEDAR
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-3">
            {isHost ? (
              <button
                onClick={onStart}
                disabled={room.players.length < 2}
                className="w-full py-5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700/50 rounded-[1.5rem] font-black text-xl transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-6 h-6 fill-current" /> Começar Partida
              </button>
            ) : (
              <div className="text-center p-5 bg-blue-800/20 rounded-[1.5rem] border border-blue-700/50 text-blue-200 animate-pulse font-bold">
                Aguardando o Host começar...
              </div>
            )}
            
            <button 
              onClick={onLeave}
              className="w-full py-4 text-red-400 hover:bg-red-500/10 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-sm uppercase tracking-wide"
            >
              <LogOut className="w-5 h-5" /> Sair da Sala
            </button>
          </div>
        </div>

        {/* Right Side: Chat */}
        <div className="bg-blue-900/40 p-8 rounded-[2.5rem] border border-blue-700 shadow-2xl flex flex-col h-[600px] lg:h-full">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-black">Chat da Sala</h2>
          </div>

          <div className="flex-grow overflow-y-auto mb-6 space-y-4 pr-2 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === userId ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[90%] ${
                  msg.senderId === userId 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' 
                  : 'bg-blue-950/80 text-blue-100 rounded-tl-none border border-white/5 shadow-inner'
                }`}>
                  {msg.senderId !== userId && (
                    <p className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-widest">{msg.sender}</p>
                  )}
                  <p className="text-sm font-medium">{msg.text}</p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                <MessageSquare className="w-12 h-12 mb-4" />
                <p className="font-bold">Combine sua estratégia aqui!</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="relative mt-auto">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="w-full bg-blue-950/50 border border-blue-700/50 rounded-2xl py-5 pl-6 pr-14 focus:outline-none focus:border-blue-500 transition-all font-bold text-sm shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all active:scale-95 shadow-lg"
            >
              <Send className="w-5 h-5 fill-current" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
