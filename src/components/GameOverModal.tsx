import React, { useState } from 'react';
import { RotateCcw, Home, Trophy, Target, Flame, Bomb, User, Edit3, Check } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewRecord: boolean;
  cutsCount: number;
  bombsHit: number;
  maxCombo: number;
  accuracy: number;
  coinsEarned: number;
  username: string;
  rankPosition?: number;
  onOpenRanking: () => void;
  onChangeUsername: (newName: string) => void;
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
  username,
  rankPosition,
  onOpenRanking,
  onChangeUsername,
  onRestart,
  onHome,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(username);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onChangeUsername(tempName.trim());
    } else {
      setTempName(username);
    }
    setIsEditing(false);
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#12121E] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Title */}
        <h2 className="font-arcade text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D71] to-[#FF8811] tracking-wider mb-0.5">
          GAME OVER
        </h2>
        <p className="text-[11px] text-white/50 mb-3">Partida finalizada</p>

        {/* User Identity Chip */}
        <div className="w-full mb-3 px-3 py-1.5 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value.slice(0, 20))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  className="px-2 py-0.5 bg-black border border-cyan-400 rounded text-xs text-white focus:outline-none w-32"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 bg-cyan-500 text-black rounded text-[10px] cursor-pointer"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold text-white/90 truncate">
                {username}
              </span>
            )}
          </div>

          {!isEditing && (
            <button
              onClick={() => {
                setTempName(username);
                setIsEditing(true);
              }}
              className="text-[10px] text-white/40 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              title="Alterar apelido"
            >
              <Edit3 className="w-3 h-3" />
              <span>Editar</span>
            </button>
          )}
        </div>

        {/* Score & Record Box */}
        <div className="w-full bg-[#181828] border border-white/5 rounded-xl p-3.5 flex flex-col items-center mb-3">
          <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold mb-0.5">Pontuação Final</span>
          <span className="font-arcade text-3xl sm:text-4xl font-black text-[#FFD23F] drop-shadow-[0_0_15px_rgba(255,210,63,0.4)]">
            {score.toLocaleString()}
          </span>

          <div className="flex items-center gap-2 mt-2">
            {isNewRecord && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 text-[11px] font-bold animate-pulse">
                <Trophy className="w-3 h-3" />
                <span>NOVO RECORDE!</span>
              </div>
            )}

            {rankPosition && rankPosition <= 50 && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-cyan-500/20 border border-cyan-400/40 rounded-full text-cyan-300 text-[11px] font-bold">
                <span>🏆 Ranking: #{rankPosition}</span>
              </div>
            )}
          </div>

          {!isNewRecord && (
            <span className="mt-1 text-[11px] text-white/40">
              Recorde Pessoal: {highScore.toLocaleString()}
            </span>
          )}
        </div>

        {/* Match Statistics Grid */}
        <div className="w-full grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/5 rounded-xl p-2 flex items-center gap-2 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
              🍉
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-white/50 uppercase font-semibold">Cortadas</span>
              <span className="font-arcade text-sm font-bold text-white">{cutsCount}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2 flex items-center gap-2 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-white/50 uppercase font-semibold">Maior Combo</span>
              <span className="font-arcade text-sm font-bold text-white">x{maxCombo}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2 flex items-center gap-2 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
              <Target className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-white/50 uppercase font-semibold">Precisão</span>
              <span className="font-arcade text-sm font-bold text-white">{accuracy}%</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2 flex items-center gap-2 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">
              <Bomb className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-white/50 uppercase font-semibold">Bombas</span>
              <span className="font-arcade text-sm font-bold text-white">{bombsHit}</span>
            </div>
          </div>
        </div>

        {/* Coins Reward */}
        <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <span>Recompensa:</span>
          <span className="font-arcade font-bold">+{coinsEarned} 🪙</span>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2">
          <button
            id="btn-play-again"
            onClick={onRestart}
            className="w-full py-3 bg-gradient-to-r from-[#FF3D71] to-[#FF8811] hover:brightness-110 active:scale-98 rounded-xl font-arcade text-xs sm:text-sm font-black text-white shadow-[0_0_15px_rgba(255,61,113,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>JOGAR NOVAMENTE</span>
          </button>

          <button
            id="btn-open-ranking-from-gameover"
            onClick={onOpenRanking}
            className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 active:scale-98 rounded-xl font-arcade text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>VER RANKING COMPLETO</span>
          </button>

          <button
            id="btn-back-home"
            onClick={onHome}
            className="w-full py-2.5 bg-white/10 hover:bg-white/15 active:scale-98 rounded-xl font-arcade text-xs font-bold text-white/80 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MENU PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};

