import React, { useState } from 'react';
import { Camera, SwitchCamera, Sliders, CheckCircle2, AlertCircle, Play, Hand } from 'lucide-react';

interface CalibrationModalProps {
  handConfidence: number;
  lightLevel: number;
  cameraFacing: 'user' | 'environment';
  sensitivity: number;
  onSwitchCamera: () => void;
  onSetSensitivity: (val: number) => void;
  onStartGame: () => void;
  onClose: () => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  handConfidence,
  lightLevel,
  cameraFacing,
  sensitivity,
  onSwitchCamera,
  onSetSensitivity,
  onStartGame,
  onClose,
}) => {
  const isHandDetected = handConfidence > 0.35;
  const isLightingGood = lightLevel > 0.25;

  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12121E] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="font-arcade text-lg font-bold text-white tracking-wider">
              CALIBRAÇÃO AR
            </h2>
          </div>
          <button
            id="btn-switch-cam-calib"
            onClick={onSwitchCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-semibold text-white/80 transition-all cursor-pointer"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            <span>{cameraFacing === 'user' ? 'Frontal' : 'Traseira'}</span>
          </button>
        </div>

        {/* Hand Silhouette / Targeting Guide Box */}
        <div className="w-full aspect-[4/3] max-h-56 rounded-xl border-2 border-dashed border-cyan-400/40 bg-black/40 flex flex-col items-center justify-center p-4 relative overflow-hidden mb-5">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />

          {/* Hand Icon Target */}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isHandDetected
                ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                : 'bg-white/5 border-2 border-dashed border-white/20 text-white/40 scale-100 animate-pulse'
            }`}
          >
            <Hand className="w-12 h-12" />
          </div>

          <p className="mt-3 text-xs font-semibold text-white/80 tracking-wide text-center z-10">
            {isHandDetected ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 inline" /> MÃO DETECTADA COM SUCESSO!
              </span>
            ) : (
              'Levante a mão em frente à câmera e mova-se para testar a lâmina'
            )}
          </p>
        </div>

        {/* Diagnostics Indicators */}
        <div className="w-full grid grid-cols-2 gap-3 mb-5">
          {/* Hand Tracking Confidence */}
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3 flex flex-col">
            <span className="text-[10px] text-white/50 uppercase font-semibold mb-1">Rastreamento</span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="font-arcade text-sm font-bold text-white">
                {Math.round(handConfidence * 100)}%
              </span>
            </div>
          </div>

          {/* Light Level Indicator */}
          <div className="bg-[#181828] border border-white/5 rounded-xl p-3 flex flex-col">
            <span className="text-[10px] text-white/50 uppercase font-semibold mb-1">Iluminação</span>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isLightingGood ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="font-arcade text-sm font-bold text-white">
                {isLightingGood ? 'Boa' : 'Baixa Luz'}
              </span>
            </div>
          </div>
        </div>

        {/* Sensitivity Slider */}
        <div className="w-full bg-[#181828] border border-white/5 rounded-xl p-3.5 mb-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70 font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Sensibilidade do Golpe
            </span>
            <span className="font-arcade text-cyan-400 font-bold">{sensitivity.toFixed(1)}x</span>
          </div>
          <input
            id="slider-calib-sensitivity"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={sensitivity}
            onChange={(e) => onSetSensitivity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-white/40">
            <span>Mais Suave</span>
            <span>Mais Rápido</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex gap-3">
          <button
            id="btn-calib-close"
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 hover:bg-white/15 active:scale-98 rounded-xl font-arcade text-xs font-bold text-white/80 transition-all cursor-pointer"
          >
            VOLTAR
          </button>
          <button
            id="btn-calib-start"
            onClick={onStartGame}
            className="flex-2 py-3 bg-gradient-to-r from-[#FF3D71] to-[#FF8811] hover:brightness-110 active:scale-98 rounded-xl font-arcade text-xs font-black text-white shadow-[0_0_15px_rgba(255,61,113,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>INICIAR JOGO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
