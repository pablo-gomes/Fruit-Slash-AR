import React, { useEffect, useState, useRef } from 'react';
import { soundEngine } from '../systems/SoundEngine';
import { FastForward } from 'lucide-react';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(3);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  const finishCountdown = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    soundEngine.playSwoosh(2.0);
    onCompleteRef.current();
  };

  useEffect(() => {
    completedRef.current = false;
    soundEngine.playSwoosh(1.2);

    // Hard fallback safety: maximum 2.4s, unconditionally starts game
    const maxSafetyTimeout = setTimeout(() => {
      finishCountdown();
    }, 2400);

    // Resilient timestamp-based ticker that cannot freeze on re-renders
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      if (elapsed < 600) {
        setStep(3);
      } else if (elapsed < 1200) {
        setStep(2);
      } else if (elapsed < 1800) {
        setStep(1);
      } else {
        setStep(0); // "SLASH!"
        clearInterval(interval);
        setTimeout(() => {
          finishCountdown();
        }, 300);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(maxSafetyTimeout);
    };
  }, []);

  const getStepText = () => {
    switch (step) {
      case 3:
        return '3';
      case 2:
        return '2';
      case 1:
        return '1';
      default:
        return 'SLASH! ⚔️';
    }
  };

  return (
    <div
      id="countdown-overlay"
      onClick={finishCountdown}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer select-none"
    >
      <div key={step} className="flex flex-col items-center animate-in zoom-in-75 fade-in duration-200">
        <span className="font-arcade text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D71] via-[#FFD23F] to-[#42E8FF] drop-shadow-[0_0_35px_rgba(255,61,113,0.9)]">
          {getStepText()}
        </span>
        <span className="text-xs sm:text-sm font-arcade uppercase tracking-widest text-white/90 mt-4 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
          Prepare sua lâmina • Toque para pular
        </span>
      </div>

      {/* Skip Button for 100% Mobile Reliability */}
      <button
        id="btn-skip-countdown"
        onClick={(e) => {
          e.stopPropagation();
          finishCountdown();
        }}
        className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white/90 text-xs font-arcade font-bold border border-white/20 shadow-lg transition-all cursor-pointer"
      >
        <FastForward className="w-4 h-4 text-amber-400" />
        <span>COMEÇAR AGORA</span>
      </button>
    </div>
  );
};
