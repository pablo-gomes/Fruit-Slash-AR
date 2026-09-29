import React from 'react';
import { GameSettings } from '../types';
import { Volume2, Music, Vibrate, Camera, Hand, MousePointer, Sliders, RotateCcw, X, User } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  username: string;
  onUpdateUsername: (newName: string) => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetRecords: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  username,
  onUpdateUsername,
  onUpdateSettings,
  onResetRecords,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12121E] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-5">
          <h2 className="font-arcade text-lg font-bold text-white tracking-wider">
            CONFIGURAÇÕES
          </h2>
          <button
            id="btn-settings-close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Player Nickname */}
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-white/80 font-semibold flex items-center gap-2 text-xs">
              <User className="w-4 h-4 text-cyan-400" /> Nome do Jogador (Ranking)
            </span>
            <input
              id="input-settings-username"
              type="text"
              value={username}
              onChange={(e) => onUpdateUsername(e.target.value.slice(0, 20))}
              placeholder="Digite seu nome..."
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
            />
            <span className="text-[10px] text-white/40">
              Nome salvo localmente no navegador e exibido no Hall da Fama.
            </span>
          </div>

          {/* Audio SFX */}
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 font-semibold flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" /> Efeitos Sonoros (SFX)
              </span>
              <span className="font-arcade text-white/50">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              id="slider-sfx-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Music */}
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 font-semibold flex items-center gap-2">
                <Music className="w-4 h-4 text-[#FF3D71]" /> Música & Frenzy Beat
              </span>
              <span className="font-arcade text-white/50">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              id="slider-music-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF3D71]"
            />
          </div>

          {/* Control Mode Toggle */}
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white/90">Modo de Controle</span>
              <span className="text-[10px] text-white/50">Câmera AR ou Toque na Tela</span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                id="btn-ctrl-camera"
                onClick={() => onUpdateSettings({ controlMode: 'camera_hand' })}
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  settings.controlMode === 'camera_hand'
                    ? 'bg-cyan-500 text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>AR Mão</span>
              </button>
              <button
                id="btn-ctrl-touch"
                onClick={() => onUpdateSettings({ controlMode: 'touch_mouse' })}
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  settings.controlMode === 'touch_mouse'
                    ? 'bg-cyan-500 text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>Toque</span>
              </button>
            </div>
          </div>

          {/* Camera Facing */}
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white/90">Orientação da Câmera</span>
            </div>
            <button
              id="btn-toggle-camera-facing"
              onClick={() =>
                onUpdateSettings({
                  cameraFacing: settings.cameraFacing === 'user' ? 'environment' : 'user',
                })
              }
              className="px-3 py-1 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-arcade font-bold text-white transition-all cursor-pointer"
            >
              {settings.cameraFacing === 'user' ? 'Frontal (Selfie)' : 'Traseira'}
            </button>
          </div>

          {/* Vibration */}
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-white/90">Feedback Háptico (Vibração)</span>
            </div>
            <button
              id="btn-toggle-vibrate"
              onClick={() => onUpdateSettings({ vibration: !settings.vibration })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.vibration ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.vibration ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Sensitivity */}
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 font-semibold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" /> Sensibilidade da Lâmina
              </span>
              <span className="font-arcade text-purple-400 font-bold">
                {settings.sensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              id="slider-settings-sensitivity"
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={settings.sensitivity}
              onChange={(e) => onUpdateSettings({ sensitivity: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <div className="flex justify-between text-[10px] text-white/40">
              <span>0.2x (Mais Lento e Estável)</span>
              <span>2.0x (Ultra Rápido)</span>
            </div>
          </div>

          {/* Reset High Scores */}
          <button
            id="btn-reset-records"
            onClick={onResetRecords}
            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zerar Recordes e Estatísticas</span>
          </button>
        </div>

        <button
          id="btn-close-settings-modal"
          onClick={onClose}
          className="w-full py-3 bg-white/10 hover:bg-white/15 active:scale-98 rounded-xl font-arcade text-xs font-bold text-white/80 transition-all cursor-pointer"
        >
          SALVAR E VOLTAR
        </button>
      </div>
    </div>
  );
};
