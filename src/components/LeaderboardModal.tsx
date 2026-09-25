import React, { useState } from 'react';
import { GameMode, LeaderboardEntry } from '../types';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Flame, 
  Target, 
  User, 
  Edit3, 
  Check, 
  RotateCcw, 
  X, 
  Swords, 
  Play, 
  Filter,
  Sparkles
} from 'lucide-react';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  currentUsername: string;
  onUpdateUsername: (newName: string) => void;
  onResetLeaderboard: () => void;
  onClose: () => void;
  onPlayMode?: (mode: GameMode) => void;
}

const MODE_LABELS: Record<GameMode, { label: string; icon: string; color: string }> = {
  classic: { label: 'Clássico', icon: '🍉', color: '#FF3D71' },
  time_attack: { label: 'Time Attack', icon: '⏱️', color: '#FFD23F' },
  zen: { label: 'Zen', icon: '🧘', color: '#42E8FF' },
  bomb_rush: { label: 'Bomb Rush', icon: '💣', color: '#FF4141' },
  fruit_rain: { label: 'Fruit Rain', icon: '🌧️', color: '#45F58A' },
};

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  currentUsername,
  onUpdateUsername,
  onResetLeaderboard,
  onClose,
  onPlayMode,
}) => {
  const [selectedTab, setSelectedTab] = useState<GameMode | 'all'>('all');
  const [onlyPlayer, setOnlyPlayer] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(currentUsername);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  // Filter entries based on selected mode and player-only filter
  const filteredEntries = entries
    .filter((entry) => {
      if (selectedTab !== 'all' && entry.mode !== selectedTab) return false;
      if (onlyPlayer && !entry.isPlayer && entry.username.toLowerCase() !== currentUsername.toLowerCase()) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);

  // Handle saving new username
  const handleSaveName = () => {
    if (tempName.trim().length > 0) {
      onUpdateUsername(tempName.trim());
    } else {
      setTempName(currentUsername);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setTempName(currentUsername);
      setIsEditingName(false);
    }
  };

  // User's best personal score
  const userScores = entries.filter(
    (e) => e.isPlayer || e.username.toLowerCase() === currentUsername.toLowerCase()
  );
  const bestUserScore = userScores.length > 0 ? Math.max(...userScores.map((e) => e.score)) : 0;

  // Top 3 for podium
  const top1 = filteredEntries[0];
  const top2 = filteredEntries[1];
  const top3 = filteredEntries[2];

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl bg-[#12121E] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-arcade text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>HALL DA FAMA & RANKING</span>
              </h2>
              <p className="text-[11px] text-white/50">
                Pontuações salvas no armazenamento local do navegador
              </p>
            </div>
          </div>

          <button
            id="btn-close-leaderboard"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Nickname Banner */}
        <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-purple-900/40 via-[#181828] to-cyan-900/30 border border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <User className="w-5 h-5" />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                Seu Nome de Jogador
              </span>

              {isEditingName ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value.slice(0, 20))}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    placeholder="Digite seu nome..."
                    className="px-2.5 py-1 bg-black/60 border border-cyan-400 rounded-lg text-xs font-bold text-white focus:outline-none w-44"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-all cursor-pointer"
                    title="Salvar Nome"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => {
                      setTempName(currentUsername);
                      setIsEditingName(false);
                    }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-all cursor-pointer"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-arcade text-xs sm:text-sm font-bold text-white">
                    {currentUsername}
                  </span>
                  <button
                    id="btn-edit-username"
                    onClick={() => {
                      setTempName(currentUsername);
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-cyan-300 transition-all cursor-pointer"
                    title="Editar Nome de Jogador"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-black/40 rounded-lg border border-white/5 text-right">
              <span className="text-[10px] text-white/40 block">Seu Melhor Score</span>
              <span className="font-arcade text-xs font-bold text-amber-300">
                {bestUserScore.toLocaleString()}
              </span>
            </div>
            <div className="px-3 py-1 bg-black/40 rounded-lg border border-white/5 text-right">
              <span className="text-[10px] text-white/40 block">Partidas Registradas</span>
              <span className="font-arcade text-xs font-bold text-cyan-300">
                {userScores.length}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-arcade font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedTab === 'all'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              🌍 Geral
            </button>
            {(Object.keys(MODE_LABELS) as GameMode[]).map((mode) => {
              const info = MODE_LABELS[mode];
              const isActive = selectedTab === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setSelectedTab(mode)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-arcade font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span className="hidden sm:inline">{info.label}</span>
                </button>
              );
            })}
          </div>

          {/* Toggle: Only Player */}
          <button
            onClick={() => setOnlyPlayer(!onlyPlayer)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyPlayer
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Apenas Minhas</span>
          </button>
        </div>

        {/* Podium View (Top 3) if at least 2 entries available */}
        {filteredEntries.length >= 2 && !onlyPlayer && (
          <div className="mt-3 py-3 px-2 bg-black/30 rounded-xl border border-white/5 flex items-end justify-center gap-2 sm:gap-4">
            {/* 2nd Place */}
            {top2 && (
              <div className="flex flex-col items-center flex-1 max-w-[120px]">
                <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-300 flex items-center justify-center text-slate-200 mb-1">
                  <Medal className="w-4 h-4 text-slate-300" />
                </div>
                <span className="text-[11px] font-bold text-white truncate max-w-full text-center">
                  {top2.username}
                </span>
                <span className="font-arcade text-xs text-slate-300 font-bold">
                  {top2.score}
                </span>
                <div className="w-full h-10 bg-slate-700/40 rounded-t-lg mt-1 flex items-center justify-center border-t border-slate-400/30">
                  <span className="font-arcade text-xs font-black text-slate-300">2º</span>
                </div>
              </div>
            )}

            {/* 1st Place (Center, Tallest) */}
            {top1 && (
              <div className="flex flex-col items-center flex-1 max-w-[140px]">
                <div className="relative mb-1">
                  <Crown className="w-5 h-5 text-amber-300 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                  <div className="w-10 h-10 rounded-full bg-amber-500/30 border-2 border-amber-300 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                    <Trophy className="w-5 h-5 text-amber-300" />
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-200 truncate max-w-full text-center">
                  {top1.username}
                </span>
                <span className="font-arcade text-sm text-amber-300 font-black">
                  {top1.score}
                </span>
                <div className="w-full h-14 bg-gradient-to-t from-amber-500/20 to-amber-500/40 rounded-t-lg mt-1 flex items-center justify-center border-t border-amber-300/40">
                  <span className="font-arcade text-sm font-black text-amber-200">1º</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="flex flex-col items-center flex-1 max-w-[120px]">
                <div className="w-8 h-8 rounded-full bg-amber-800/30 border border-amber-600 flex items-center justify-center text-amber-600 mb-1">
                  <Medal className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-[11px] font-bold text-white truncate max-w-full text-center">
                  {top3.username}
                </span>
                <span className="font-arcade text-xs text-amber-500 font-bold">
                  {top3.score}
                </span>
                <div className="w-full h-7 bg-amber-900/30 rounded-t-lg mt-1 flex items-center justify-center border-t border-amber-700/40">
                  <span className="font-arcade text-xs font-black text-amber-600">3º</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Leaderboard Table */}
        <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[160px]">
          {filteredEntries.length === 0 ? (
            <div className="h-36 flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl mb-2">🍉</span>
              <p className="text-xs text-white/50">Nenhuma pontuação registrada nesta categoria.</p>
              <p className="text-[10px] text-white/30 mt-1">Jogue uma partida para inaugurar o ranking!</p>
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser =
                entry.isPlayer ||
                entry.username.toLowerCase() === currentUsername.toLowerCase();
              const modeInfo = MODE_LABELS[entry.mode] || { label: entry.mode, icon: '🍉', color: '#FF3D71' };

              return (
                <div
                  key={entry.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border-cyan-400/50 shadow-[0_0_12px_rgba(66,232,255,0.15)]'
                      : 'bg-[#151524]/90 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Left: Rank & Player info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-arcade text-xs font-black ${
                        rank === 1
                          ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                          : rank === 2
                          ? 'bg-slate-300 text-black'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {rank}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {entry.username}
                        </span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 text-[9px] font-bold rounded">
                            VOCÊ
                          </span>
                        )}
                      </div>

                      {/* Sub-info: Mode, Combo, Precision, Date */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/50 mt-0.5">
                        <span className="flex items-center gap-1">
                          <span>{modeInfo.icon}</span>
                          <span>{modeInfo.label}</span>
                        </span>
                        {entry.maxCombo > 1 && (
                          <span className="flex items-center gap-0.5 text-amber-400 font-mono">
                            <Flame className="w-2.5 h-2.5" /> x{entry.maxCombo}
                          </span>
                        )}
                        {entry.accuracy > 0 && (
                          <span className="flex items-center gap-0.5 text-cyan-300 font-mono">
                            <Target className="w-2.5 h-2.5" /> {entry.accuracy}%
                          </span>
                        )}
                        <span className="text-white/30 hidden sm:inline">{entry.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-arcade text-sm sm:text-base font-black text-[#FFD23F] drop-shadow-[0_0_10px_rgba(255,210,63,0.3)]">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/40 block">pontos</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          {/* Reset / Clear Data */}
          <div>
            {showConfirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-red-400 font-bold">Restaurar ranking?</span>
                <button
                  onClick={() => {
                    onResetLeaderboard();
                    setShowConfirmReset(false);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                >
                  Sim, Restaurar
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-red-400 transition-all cursor-pointer"
                title="Restaura os recordes padrão do Hall da Fama"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Hall Padrão</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onPlayMode && (
              <button
                onClick={() => {
                  onClose();
                  onPlayMode(selectedTab === 'all' ? 'classic' : selectedTab);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#FF3D71] to-[#FF8811] hover:brightness-110 active:scale-95 rounded-xl font-arcade text-xs font-black text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,61,113,0.4)]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>JOGAR {selectedTab !== 'all' ? MODE_LABELS[selectedTab].label.toUpperCase() : ''}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 active:scale-95 rounded-xl font-arcade text-xs font-bold text-white transition-all cursor-pointer"
            >
              FECHAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
