/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronLeft, Volume2, Music, Zap, Smartphone, Palette, LogOut } from 'lucide-react';
import { GameSettings } from '../types.ts';

interface SettingsProps {
  settings: GameSettings;
  onUpdate: (settings: GameSettings) => void;
  onBack: () => void;
  onLogout: () => void;
}

export function Settings({ settings, onUpdate, onBack, onLogout }: SettingsProps) {
  const toggle = (key: keyof GameSettings) => {
    onUpdate({ ...settings, [key]: !settings[key] });
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
              className="bg-blue-950 border border-blue-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
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
