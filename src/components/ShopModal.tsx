import React from 'react';
import { BladeStyle } from '../types';
import { BLADE_STYLES } from '../data/fruits';
import { Swords, Check, Lock, Sparkles, X } from 'lucide-react';

interface ShopModalProps {
  coins: number;
  unlockedBladeIds: string[];
  activeBladeId: string;
  onSelectBlade: (blade: BladeStyle) => void;
  onBuyBlade: (blade: BladeStyle) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  unlockedBladeIds,
  activeBladeId,
  onSelectBlade,
  onBuyBlade,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12121E] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-[#FF3D71]" />
            <h2 className="font-arcade text-lg font-bold text-white tracking-wider">
              DOJO DE LÂMINAS
            </h2>
          </div>

          {/* Coins Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <span className="text-sm">🪙</span>
            <span className="font-arcade text-xs font-bold text-amber-300">{coins}</span>
          </div>
        </div>

        <p className="text-xs text-white/50 mb-4">
          Personalize a cor, brilho e partículas da sua lâmina virtual de corte.
        </p>

        {/* Blades List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {BLADE_STYLES.map((blade) => {
            const isUnlocked = unlockedBladeIds.includes(blade.id);
            const isEquipped = activeBladeId === blade.id;
            const canAfford = coins >= blade.price;

            return (
              <div
                key={blade.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isEquipped
                    ? 'bg-[#1D1A2E] border-[#FF3D71] shadow-[0_0_15px_rgba(255,61,113,0.3)]'
                    : 'bg-[#181828] border-white/5 hover:border-white/15'
                }`}
              >
                {/* Left: Blade color preview & details */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-white/20 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${blade.gradient.join(', ')})`,
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-white drop-shadow-md" />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-arcade text-xs sm:text-sm font-bold text-white">
                        {blade.name}
                      </span>
                      {isEquipped && (
                        <span className="px-2 py-0.5 bg-[#FF3D71]/20 border border-[#FF3D71]/40 rounded-full text-[9px] font-bold text-[#FF3D71]">
                          EQUIPADA
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                      {blade.description}
                    </span>
                  </div>
                </div>

                {/* Right: Equip / Buy button */}
                <div>
                  {isUnlocked ? (
                    <button
                      id={`btn-equip-${blade.id}`}
                      onClick={() => onSelectBlade(blade)}
                      disabled={isEquipped}
                      className={`px-3.5 py-1.5 rounded-lg font-arcade text-xs font-bold transition-all cursor-pointer ${
                        isEquipped
                          ? 'bg-white/10 text-white/40 cursor-default'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      }`}
                    >
                      {isEquipped ? 'USANDO' : 'EQUIPAR'}
                    </button>
                  ) : (
                    <button
                      id={`btn-buy-${blade.id}`}
                      onClick={() => onBuyBlade(blade)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-lg font-arcade text-xs font-bold flex items-center gap-1.5 transition-all ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)] cursor-pointer'
                          : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>{blade.price} 🪙</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close */}
        <button
          id="btn-close-shop"
          onClick={onClose}
          className="w-full py-3 bg-white/10 hover:bg-white/15 active:scale-98 rounded-xl font-arcade text-xs font-bold text-white/80 transition-all cursor-pointer"
        >
          FECHAR
        </button>
      </div>
    </div>
  );
};
