import React from 'react';
import { GameMode, BladeStyle } from '../types';
import { 
  Play, 
  Camera, 
  Swords, 
  Settings as SettingsIcon, 
  Smartphone, 
  Trophy, 
  Sparkles, 
  Clock, 
  Bomb, 
  CloudRain, 
  Heart,
  Hand
} from 'lucide-react';

interface HomeScreenProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  highScore: number;
  coins: number;
  activeBlade: BladeStyle;
  onStartCalibration: () => void;
  onDirectPlay: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onOpenExpoGuide: () => void;
}

const MODES: Array<{
  id: GameMode;
  title: string;
  desc: string;
  icon: string;
  badge?: string;
  color: string;
}> = [
  {
    id: 'classic',
    title: 'Clássico',
    desc: '3 vidas, bombas e dificuldade crescente',
    icon: '🍉',
    color: '#FF3D71',
  },
  {
    id: 'time_attack',
    title: 'Time Attack',
    desc: '60 segundos para pontuação máxima',
    icon: '⏱️',
    color: '#FFD23F',
  },
  {
    id: 'zen',
    title: 'Zen Mode',
    desc: 'Sem bombas, sem vidas, pura precisão',
    icon: '🧘',
    badge: 'Relax',
    color: '#42E8FF',
  },
  {
    id: 'bomb_rush',
    title: 'Bomb Rush',
    desc: 'Campo minado! Apenas 1 vida',
    icon: '💣',
    color: '#FF4141',
  },
  {
    id: 'fruit_rain',
    title: 'Fruit Rain',
    desc: 'Chuva contínua de frutas e mega combos',
    icon: '🌧️',
    color: '#45F58A',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  selectedMode,
  onSelectMode,
  highScore,
  coins,
  activeBlade,
  onStartCalibration,
  onDirectPlay,
  onOpenShop,
  onOpenSettings,
  onOpenExpoGuide,
}) => {
  return (
    <div className="relative z-30 w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto flex flex-col items-center justify-between min-h-[90vh] py-3 sm:py-5 px-3 sm:px-6">
      {/* Top Bar: High Score & Coins & Expo Link */}
      <div className="w-full flex items-center justify-between gap-2">
        {/* High Score Badge */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-white/60 font-medium hidden sm:inline">Recorde:</span>
          <span className="font-arcade text-xs sm:text-sm font-bold text-amber-300">
            {highScore.toLocaleString()}
          </span>
        </div>

        {/* Coins & Expo Framework Tag */}
        <div className="flex items-center gap-2">
          <button
            id="btn-home-shop-coins"
            onClick={onOpenShop}
            className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer"
          >
            <span className="text-sm">🪙</span>
            <span className="font-arcade text-xs font-bold text-amber-300">{coins}</span>
          </button>

          <button
            id="btn-home-expo-guide"
            onClick={onOpenExpoGuide}
            className="flex items-center gap-1.5 bg-emerald-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition-all text-xs font-semibold cursor-pointer"
            title="Ver integração Expo Go e React Native"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expo Go</span>
          </button>
        </div>
      </div>

      {/* Main Title & Brand */}
      <div className="flex flex-col items-center text-center my-2 sm:my-4">
        <div className="relative mb-1">
          <span className="text-4xl sm:text-5xl lg:text-6xl drop-shadow-[0_0_20px_rgba(255,61,113,0.8)] animate-bounce inline-block">
            🍉
          </span>
        </div>

        <h1 className="font-arcade text-3xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D71] via-[#FFD23F] to-[#42E8FF] tracking-wider leading-none">
          FRUIT SLASH
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-arcade text-lg sm:text-2xl font-black text-[#42E8FF] tracking-widest drop-shadow-[0_0_12px_rgba(66,232,255,0.7)]">
            AR
          </span>
          <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] sm:text-xs uppercase font-bold text-white/70 tracking-widest">
            Detecção Livre ⚡
          </span>
        </div>

        {/* Universal Gesture & Cross-Device Banner */}
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 max-w-lg">
          <span className="text-[11px] sm:text-xs text-cyan-300 font-semibold bg-cyan-500/15 border border-cyan-400/30 px-3 py-0.5 rounded-full flex items-center gap-1">
            <Hand className="w-3 h-3 text-cyan-300" />
            Corte frutas livremente com qualquer gesto ou movimento da mão ⚔️
          </span>
          <span className="text-[10px] text-white/50 hidden md:inline">
            📺 TV • 💻 Desktop • 📱 Mobile
          </span>
        </div>
      </div>

      {/* Mode Carousel / Selector with Responsive Grid */}
      <div className="w-full my-1 sm:my-3">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white/50 mb-2 block text-center">
          Escolha o Modo de Jogo
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full">
          {MODES.map((m) => {
            const isSelected = selectedMode === m.id;
            return (
              <button
                key={m.id}
                id={`btn-mode-${m.id}`}
                onClick={() => onSelectMode(m.id)}
                className={`p-2.5 sm:p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E1B32] border-[#42E8FF] shadow-[0_0_18px_rgba(66,232,255,0.3)] scale-[1.02]'
                    : 'bg-[#141422]/90 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">{m.icon}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-arcade text-xs sm:text-sm font-bold text-white">
                        {m.title}
                      </span>
                      {m.badge && (
                        <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-[9px] font-bold rounded">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-white/50 line-clamp-1">{m.desc}</span>
                  </div>
                </div>

                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all shrink-0 ml-2 ${
                    isSelected ? 'border-[#42E8FF] bg-[#42E8FF]' : 'border-white/20'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Blade Card & TV Remote Help */}
      <div className="w-full flex flex-col sm:flex-row gap-2 my-1">
        <button
          id="btn-active-blade-preview"
          onClick={onOpenShop}
          className="flex-1 bg-[#141422]/90 backdrop-blur-md border border-white/10 hover:border-white/20 p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/20"
              style={{
                background: `linear-gradient(135deg, ${activeBlade.gradient.join(', ')})`,
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-white/50 uppercase font-semibold">Lâmina Ativa</span>
              <span className="font-arcade text-xs font-bold text-white">{activeBlade.name}</span>
            </div>
          </div>

          <span className="text-xs text-[#FF3D71] font-arcade font-bold flex items-center gap-1">
            <Swords className="w-3.5 h-3.5" /> MUDAR
          </span>
        </button>

        {/* TV / Desktop Keyboard Shortcuts Tag */}
        <div className="hidden md:flex items-center justify-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] text-white/60 font-mono">
          <span>🎮 Atallhos:</span>
          <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">[ESPAÇO] Jogar</span>
          <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">[F] Tela Cheia</span>
        </div>
      </div>

      {/* Primary Action Button (Play Now) */}
      <div className="w-full flex flex-col gap-2.5 mt-1 sm:mt-2">
        <button
          id="btn-play-game"
          onClick={onDirectPlay}
          className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-[#FF3D71] via-[#FF8811] to-[#FFD23F] hover:brightness-110 active:scale-98 rounded-2xl font-arcade text-base sm:text-lg font-black text-white shadow-[0_0_25px_rgba(255,61,113,0.5)] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>JOGAR AGORA</span>
        </button>

        {/* Secondary Tool Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            id="btn-home-calib"
            onClick={onStartCalibration}
            className="py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 rounded-xl font-arcade text-[11px] sm:text-xs font-bold text-white/90 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Calibrar</span>
          </button>

          <button
            id="btn-home-shop"
            onClick={onOpenShop}
            className="py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 rounded-xl font-arcade text-[11px] sm:text-xs font-bold text-white/90 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Swords className="w-3.5 h-3.5 text-[#FF3D71]" />
            <span>Lâminas</span>
          </button>

          <button
            id="btn-home-settings"
            onClick={onOpenSettings}
            className="py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 rounded-xl font-arcade text-[11px] sm:text-xs font-bold text-white/90 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Ajustes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
