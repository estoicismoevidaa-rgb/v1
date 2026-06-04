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
  Trophy,
  Swords,
  Gamepad2
} from 'lucide-react';
import { GameSettings, UserProfile, UserStats } from '../types.ts';
import { supabase } from '../lib/supabase.ts';

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

  const currentLevel = stats?.level || 1;
  const currentXp = stats?.currentXp || 0;
  const nextLevelXp = stats?.nextLevelXp || 100;
  const xpProgress = Math.min(100, (currentXp / nextLevelXp) * 100);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 text-white bg-[#000814]">
      {/* Header with Back Button */}
      <div className="w-full max-w-lg flex items-center justify-between mt-4 mb-2">
        <button 
          onClick={onBack} 
          className="flex items-center gap-1 text-blue-400 font-bold hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" /> Voltar
        </button>
      </div>

      <h2 className="text-4xl font-black mb-8 uppercase tracking-[0.2em] text-blue-100 drop-shadow-[0_0_10px_rgba(147,197,253,0.5)] text-center">
        Configurações
      </h2>

      <div className="w-full max-w-lg bg-[#001d3d]/90 p-6 rounded-[2.5rem] border-2 border-blue-600/50 shadow-[0_0_30px_rgba(0,102,204,0.3)] space-y-6 relative overflow-hidden backdrop-blur-sm">
        
        {/* Title Group */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 rounded bg-green-500/20 text-green-400">
            <User className="w-4 h-4" />
          </div>
          <h3 className="font-black text-lg text-green-400 uppercase tracking-widest">Editar Perfil</h3>
        </div>

        {/* Level and XP Section */}
        <div className="bg-[#002855]/60 border-2 border-blue-500/30 rounded-3xl p-5 relative">
          <div className="flex items-center gap-4">
            {/* Hexagon Level Badge */}
            <div className="relative w-20 h-20 flex-shrink-0">
               <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]">
                 <path 
                   d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
                   fill="rgba(30, 58, 138, 0.8)" 
                   stroke="#3b82f6" 
                   strokeWidth="4" 
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center -mt-1">
                 <span className="text-[10px] font-black uppercase text-blue-300">Lv</span>
                 <span className="text-2xl font-black text-white">{currentLevel}</span>
               </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Nível Atual</span>
                {/* Small next level hexagon icon on right */}
                <div className="relative w-10 h-10 -mr-1">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path 
                      d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
                      fill="rgba(30, 58, 138, 0.4)" 
                      stroke="#2563eb" 
                      strokeWidth="6" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center -mt-0.5">
                    <span className="text-[7px] font-black text-blue-400 uppercase leading-none">Lv</span>
                    <span className="text-[14px] font-black text-white leading-none">{currentLevel + 1}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-4 bg-[#001d3d] rounded-full border border-blue-900/50 overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                <span className="text-green-400">{currentXp} / {nextLevelXp} XP</span>
                <span className="text-blue-300">Faltam {nextLevelXp - currentXp} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section (Wins/Losses) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#002855]/60 border-2 border-blue-500/30 rounded-3xl p-4 flex flex-col items-center justify-center space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-400" />
              <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Vitórias</span>
            </div>
            <span className="text-3xl font-black text-green-400">{stats?.gamesWon || 0}</span>
          </div>
          <div className="bg-[#002855]/60 border-2 border-blue-500/30 rounded-3xl p-4 flex flex-col items-center justify-center space-y-1">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-500" />
              <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Derrotas</span>
            </div>
            <span className="text-3xl font-black text-red-500">{stats?.gamesLost || 0}</span>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 relative">
            <div 
              onClick={handleImageClick}
              className="relative w-40 h-40 rounded-full border-4 border-blue-500 bg-blue-900/50 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] cursor-pointer hover:border-green-400 transition-all group"
            >
              <div className="w-[90%] h-[90%] rounded-full overflow-hidden border-2 border-blue-600/30">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-blue-400" />
                )}
              </div>

              {/* Camera Icon Overlay like in screenshot */}
              <div className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-xl border-2 border-blue-400 flex items-center justify-center shadow-lg group-hover:bg-green-600 group-hover:border-green-400 transition-colors">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em]">Clique para alterar a foto</span>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Nickname Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-blue-400 uppercase tracking-widest ml-1">Seu Apelido</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1 h-3 bg-blue-400 rounded-full" />
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="w-full pl-8 pr-4 py-4 bg-[#001d3d] border-2 border-blue-600/50 rounded-2xl focus:border-green-500 outline-none transition-all font-black text-lg text-white selection:bg-blue-600"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 rounded-2xl font-black text-lg uppercase tracking-widest shadow-[0_5px_15px_rgba(34,197,94,0.3)] active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            Salvar Alterações
          </button>

          {saveStatus && (
            <div className={`p-4 rounded-xl text-center font-black uppercase tracking-widest text-xs border-2 ${
              saveStatus.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-500'
            }`}>
              {saveStatus.message}
            </div>
          )}
        </form>

        {/* Divider */}
        <div className="h-0.5 bg-blue-900/40 w-full" />

        {/* Game Preferences Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded bg-blue-500/20 text-blue-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <h3 className="font-black text-lg text-blue-100 uppercase tracking-widest">Preferências do Jogo</h3>
          </div>

          <div className="space-y-2">
             {[
               { id: 'music', label: 'Música', icon: <Music className="w-5 h-5" />, field: 'music' as const },
               { id: 'sfx', label: 'Efeitos Sonoros', icon: <Volume2 className="w-5 h-5" />, field: 'sfx' as const },
               { id: 'vibration', label: 'Vibração', icon: <Smartphone className="w-5 h-5" />, field: 'vibration' as const },
               { id: 'animations', label: 'Animações', icon: <Zap className="w-5 h-5" />, field: 'animations' as const },
             ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-[#002855]/40 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      {item.icon}
                    </div>
                    <span className="font-black text-blue-100 tracking-tight">{item.label}</span>
                  </div>
                  <button
                    onClick={() => toggle(item.field)}
                    className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner ${
                      settings[item.field] ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${
                      settings[item.field] ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
             ))}
          </div>
        </div>

        {/* Theme Visual Row */}
        <div className="flex items-center justify-between p-3 bg-[#002855]/40 rounded-2xl border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
              <Palette className="w-5 h-5" />
            </div>
            <span className="font-black text-blue-100 tracking-tight">Tema Visual</span>
          </div>
          <select 
            value={settings.theme}
            onChange={(e) => onUpdate({ ...settings, theme: e.target.value as any })}
            className="bg-[#001d3d] border border-blue-600/50 rounded-xl px-4 py-2 text-sm font-black text-blue-100 outline-none focus:border-blue-400"
          >
            <option value="dark">Fundo Escuro Azul</option>
            <option value="light">Fundo Claro</option>
          </select>
        </div>

        {/* Logout Button */}
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-red-600/10 hover:bg-red-600/20 border-2 border-red-500/30 text-red-500 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair / Refazer Cadastro
        </button>

      </div>

      {/* Decorative dots in background like in screenshot */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
         <div className="absolute top-20 left-10 w-1 h-1 bg-blue-400 rounded-full" />
         <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full" />
         <div className="absolute bottom-60 left-1/4 w-1 h-1 bg-blue-300 rounded-full" />
         <div className="absolute top-1/2 right-10 w-1 h-1 bg-white rounded-full" />
      </div>
    </div>
  );
}
