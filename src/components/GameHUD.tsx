import React from 'react';
import { GameMode } from '../types';
import { Heart, Pause, Flame, Timer, Sparkles } from 'lucide-react';

interface GameHUDProps {
  score: number;
  lives: number;
  maxLives: number;
  combo: number;
  comboTimer: number;
  mode: GameMode;
  timeRemaining: number;
  frenzyActive: boolean;
  frenzyTimer: number;
  freezeActive: boolean;
  freezeTimer: number;
  coins: number;
  handConfidence: number;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  lives,
  maxLives,
  combo,
  mode,
  timeRemaining,
  frenzyActive,
  frenzyTimer,
  freezeActive,
  freezeTimer,
  coins,
  handConfidence,
  onPause,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 pt-12 sm:pt-14 sm:p-5 md:pt-16 select-none">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Score & Coins */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2 bg-black/60 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
            <span className="text-[10px] sm:text-xs text-white/60 font-semibold tracking-wider uppercase">Pontos</span>
            <span className="font-arcade text-xl sm:text-3xl font-black text-[#FFD23F] drop-shadow-[0_0_12px_rgba(255,210,63,0.5)]">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-black/40 backdrop-blur-sm rounded-lg border border-white/5 w-fit">
            <span className="text-sm">🪙</span>
            <span className="font-arcade text-xs font-bold text-amber-300">+{coins}</span>
          </div>
        </div>

        {/* Center: Frenzy / Freeze or Mode Timer Notification */}
        <div className="flex flex-col items-center gap-1">
          {frenzyActive && (
            <div className="flex flex-col items-center gap-0.5 animate-bounce">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#FF3D71] to-[#FF8811] px-3 sm:px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,61,113,0.8)] border border-white/40">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-200 fill-yellow-200" />
                <span className="font-arcade text-[10px] sm:text-xs md:text-sm font-black text-white tracking-widest uppercase">
                  BÔNUS AMARELO! {frenzyTimer.toFixed(1)}s
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-yellow-300 drop-shadow">
                ⭐ Corte tudo! Bônus único da partida! ⭐
              </span>
            </div>
          )}

          {freezeActive && !frenzyActive && (
            <div className="flex items-center gap-2 bg-cyan-600/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-cyan-300 shadow-[0_0_15px_rgba(66,232,255,0.6)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span className="font-arcade text-xs font-bold text-cyan-100 tracking-wider">
                FREEZE {freezeTimer.toFixed(1)}s
              </span>
            </div>
          )}

          {mode === 'time_attack' && (
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10 shadow-lg">
              <Timer className={`w-4 h-4 ${timeRemaining <= 10 ? 'text-red-400 animate-ping' : 'text-cyan-400'}`} />
              <span className={`font-arcade text-lg sm:text-xl font-bold ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {Math.ceil(timeRemaining)}s
              </span>
            </div>
          )}
        </div>

        {/* Right: Lives & Pause */}
        <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto">
          {mode !== 'zen' && mode !== 'time_attack' && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-white/10 shadow-lg">
              {Array.from({ length: maxLives }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                    i < lives
                      ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(255,40,70,0.8)] scale-100'
                      : 'text-white/20 fill-white/10 scale-90'
                  }`}
                />
              ))}
            </div>
          )}

          <button
            id="btn-pause-game"
            onClick={onPause}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all shadow-lg cursor-pointer"
            aria-label="Pausar jogo"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Combo Multiplier & Hand Tracking Indicator */}
      <div className="flex items-end justify-between w-full">
        {/* Combo Multiplier Badge */}
        <div className="flex items-center gap-2">
          {combo > 1 ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600/90 to-red-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-300/40 shadow-[0_0_15px_rgba(255,100,0,0.4)] animate-pulse">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 fill-yellow-300" />
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] text-yellow-200 font-bold tracking-wider leading-none">COMBO</span>
                <span className="font-arcade text-lg sm:text-2xl font-black text-white leading-none">
                  x{combo}
                </span>
              </div>
            </div>
          ) : (
            <div className="opacity-0 w-16" />
          )}
        </div>

        {/* Hand Tracking Confidence & Motion Indicator Pill */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              handConfidence > 0.25
                ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]'
                : handConfidence > 0.08
                ? 'bg-amber-400 shadow-[0_0_8px_#FBBF24]'
                : 'bg-red-400 shadow-[0_0_8px_#F87171]'
            }`}
          />
          <span className="text-[11px] sm:text-xs text-white/80 font-medium">
            {handConfidence > 0.2 ? 'Movimento Ativo ⚡' : 'Mova a Mão / Gesto ✋'}
          </span>
        </div>
      </div>
    </div>
  );
};
