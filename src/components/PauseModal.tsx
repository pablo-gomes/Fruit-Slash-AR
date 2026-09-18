import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onHome }) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xs bg-[#12121E] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
        <h2 className="font-arcade text-xl sm:text-2xl font-black text-white tracking-wider mb-6">
          JOGO PAUSADO
        </h2>

        <div className="w-full flex flex-col gap-3">
          <button
            id="btn-resume-game"
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-98 rounded-xl font-arcade text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>CONTINUAR</span>
          </button>

          <button
            id="btn-pause-restart"
            onClick={onRestart}
            className="w-full py-3 bg-white/10 hover:bg-white/15 active:scale-98 rounded-xl font-arcade text-xs font-bold text-white/90 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REINICIAR</span>
          </button>

          <button
            id="btn-pause-home"
            onClick={onHome}
            className="w-full py-3 bg-white/5 hover:bg-white/10 active:scale-98 rounded-xl font-arcade text-xs font-semibold text-white/60 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MENU PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
