/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  Volume2, 
  Music, 
  Zap, 
  Smartphone, 
  Palette, 
  LogOut, 
  Camera, 
  User, 
  Save, 
  Loader2, 
  Check 
} from 'lucide-react';
import { GameSettings, UserProfile, UserStats } from '../types.ts';
import { supabase } from '../lib/supabase.ts';
import { XPProgress } from './XPProgress.tsx';

interface SettingsProps {
  settings: GameSettings;
  onUpdate: (settings: GameSettings) => void;
  onBack: () => void;
  onLogout: () => void;
  userProfile?: UserProfile | null;
  onUpdateProfile?: (username: string, avatarUrl?: string) => Promise<void>;
}

export function Settings({ 
  settings, 
  onUpdate, 
  onBack, 
  onLogout, 
  userProfile, 
  onUpdateProfile 
}: SettingsProps) {
  const [username, setUsername] = useState(userProfile?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username);
      setAvatarPreview(userProfile.avatarUrl || '');
      
      if (!userProfile.isGuest) {
        supabase.from('stats').select('*').eq('uid', userProfile.uid).maybeSingle().then(({ data }) => {
          if (data) {
            setStats({
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
            });
          }
        });
      }
    }
  }, [userProfile]);

  const toggle = (key: keyof GameSettings) => {
    onUpdate({ ...settings, [key]: !settings[key] });
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          setAvatarPreview(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setSaveStatus({ type: 'error', message: 'O apelido não pode estar vazio!' });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      if (onUpdateProfile) {
        await onUpdateProfile(username, avatarPreview);
        setSaveStatus({ type: 'success', message: 'Perfil atualizado com sucesso!' });
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        throw new Error('Serviço de atualização não disponível');
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err.message || 'Erro ao salvar o perfil.' });
    } finally {
      setIsSaving(false);
    }
  };

  const settingItems = [
    { id: 'music', label: 'Música', icon: <Music />, field: 'music' as const },
    { id: 'sfx', label: 'Efeitos Sonoros', icon: <Volume2 />, field: 'sfx' as const },
    { id: 'vibration', label: 'Vibração', icon: <Smartphone />, field: 'vibration' as const },
    { id: 'animations', label: 'Animações', icon: <Zap />, field: 'animations' as const },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-white">
      <button onClick={onBack} className="self-start mb-8 flex items-center gap-2 text-blue-300 hover:text-white transition-colors">
        <ChevronLeft className="w-6 h-6" /> Voltar
      </button>

      <h2 className="text-4xl font-bold mb-10">Configurações</h2>

      <div className="w-full max-w-md bg-blue-900/40 p-8 rounded-3xl border border-blue-700 shadow-2xl space-y-6">
        {/* EDIT PROFILE SECTION */}
        <div className="pb-6 border-b border-blue-800">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-green-400">
            <User className="w-5 h-5" /> Editar Perfil
          </h3>
          
          {stats && !userProfile?.isGuest && (
            <div className="mb-6">
              <XPProgress 
                level={stats.level} 
                currentXp={stats.currentXp} 
                nextLevelXp={stats.nextLevelXp} 
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-blue-900/40 p-2 rounded-lg text-center border border-blue-800/50">
                  <div className="text-[10px] text-blue-400 uppercase font-black">Vitórias</div>
                  <div className="text-sm font-bold text-green-400">{stats.gamesWon}</div>
                </div>
                <div className="bg-blue-900/40 p-2 rounded-lg text-center border border-blue-800/50">
                  <div className="text-[10px] text-blue-400 uppercase font-black">Derrotas</div>
                  <div className="text-sm font-bold text-red-400">{stats.gamesLost}</div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Avatar Input */}
            <div className="flex flex-col items-center gap-3">
              <div 
                onClick={handleImageClick}
                className="group relative w-24 h-24 rounded-full border-4 border-blue-600 bg-blue-950 flex items-center justify-center overflow-hidden cursor-pointer hover:border-green-500 transition-all shadow-xl"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-blue-400" />
                )}
                
                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-[10px] text-blue-300 text-center uppercase tracking-wider">
                Clique para alterar a foto
              </p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Username/Nickname Input */}
            <div className="space-y-1">
              <label className="text-xs text-blue-400 font-bold block uppercase tracking-wider">Seu Apelido</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                placeholder="Exemplo: FruitMaster"
                className="w-full px-4 py-3 bg-blue-950/80 border border-blue-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all font-semibold"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-400 rounded-xl font-bold transition-all shadow-lg text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar Alterações
                </>
              )}
            </button>

            {/* Error or Success Msg */}
            {saveStatus && (
              <div className={`p-3 rounded-lg text-xs text-center font-semibold ${
                saveStatus.type === 'success' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-red-600/20 text-red-400 border border-red-500/30'
              }`}>
                {saveStatus.message}
              </div>
            )}
          </form>
        </div>

        {/* GAME SETTINGS SECTION */}
        <div className="space-y-6 pt-2">
          <h3 className="text-xl font-bold text-blue-200">Preferências do Jogo</h3>
          {settingItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-800 rounded-xl text-blue-300">
                  {item.icon}
                </div>
                <span className="font-bold text-lg">{item.label}</span>
              </div>
              <button
                onClick={() => toggle(item.field)}
                className={`w-14 h-8 rounded-full relative p-1 transition-all ${
                  settings[item.field] ? 'bg-green-600' : 'bg-gray-700'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-md ${
                  settings[item.field] ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-blue-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-800 rounded-xl text-blue-300">
                <Palette />
              </div>
              <span className="font-bold text-lg">Tema Visual</span>
            </div>
            <select 
              value={settings.theme}
              onChange={(e) => onUpdate({ ...settings, theme: e.target.value as any })}
              className="bg-blue-950 border border-blue-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none text-white"
            >
              <option value="dark">Fundo Escuro Azul</option>
              <option value="light">Fundo Claro</option>
            </select>
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-4 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded-2xl font-bold transition-all mt-4"
          >
            <LogOut className="w-5 h-5" />
            Sair / Refazer Cadastro
          </button>
        </div>
      </div>
    </div>
  );
}
