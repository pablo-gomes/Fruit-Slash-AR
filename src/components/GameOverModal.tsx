import React from 'react';
import { RotateCcw, Home, Trophy, Target, Flame, Bomb } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewRecord: boolean;
  cutsCount: number;
  bombsHit: number;
  maxCombo: number;
  accuracy: number;
  coinsEarned: number;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  isNewRecord,
  cutsCount,
  bombsHit,
  maxCombo,
  accuracy,
  coinsEarned,
  onRestart,
  onHome,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#12121E] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Title */}
        <h2 className="font-arcade text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D71] to-[#FF8811] tracking-wider mb-1">
          GAME OVER
        </h2>
        <p className="text-xs text-white/50 mb-5">Partida finalizada</p>

        {/* Score & Record Box */}
        <div className="w-full bg-[#181828] border border-white/5 rounded-xl p-4 flex flex-col items-center mb-4">
          <span className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-1">Pontuação Final</span>
          <span className="font-arcade text-4xl font-black text-[#FFD23F] drop-shadow-[0_0_15px_rgba(255,210,63,0.4)]">
            {score.toLocaleString()}
          </span>

          {isNewRecord && (
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-bold animate-pulse">
              <Trophy className="w-3.5 h-3.5" />
              <span>NOVO RECORDE!</span>
            </div>
          )}

          {!isNewRecord && (
            <span className="mt-1 text-xs text-white/40">
              Recorde: {highScore.toLocaleString()}
            </span>
          )}
        </div>

        {/* Match Statistics Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-5">
          <div className="bg-white/5 rounded-xl p-2.5 flex items-center gap-2.5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
              🍉
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase font-semibold">Cortadas</span>
              <span className="font-arcade text-base font-bold text-white">{cutsCount}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 flex items-center gap-2.5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase font-semibold">Maior Combo</span>
              <span className="font-arcade text-base font-bold text-white">x{maxCombo}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 flex items-center gap-2.5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase font-semibold">Precisão</span>
              <span className="font-arcade text-base font-bold text-white">{accuracy}%</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 flex items-center gap-2.5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm">
              <Bomb className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase font-semibold">Bombas</span>
              <span className="font-arcade text-base font-bold text-white">{bombsHit}</span>
            </div>
          </div>
        </div>

        {/* Coins Reward */}
        <div className="flex items-center gap-2 mb-6 px-4 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <span>Recompensa:</span>
          <span className="font-arcade font-bold">+{coinsEarned} 🪙</span>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            id="btn-play-again"
            onClick={onRestart}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF3D71] to-[#FF8811] hover:brightness-110 active:scale-98 rounded-xl font-arcade text-sm font-black text-white shadow-[0_0_20px_rgba(255,61,113,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>JOGAR NOVAMENTE</span>
          </button>

          <button
            id="btn-back-home"
            onClick={onHome}
            className="w-full py-3 bg-white/10 hover:bg-white/15 active:scale-98 rounded-xl font-arcade text-xs font-bold text-white/80 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MENU PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
