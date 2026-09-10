import React from 'react';
import { CircleId, DANTE_CIRCLES, Relic } from '../types';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';

interface BoonSelectionModalProps {
  completedCircleId: CircleId;
  nextCircleId: CircleId;
  boons: Relic[];
  onSelectBoon: (relic: Relic) => void;
  onSkipBoon: () => void;
}

export const BoonSelectionModal: React.FC<BoonSelectionModalProps> = ({
  completedCircleId,
  nextCircleId,
  boons,
  onSelectBoon,
  onSkipBoon,
}) => {
  const completedCircle = DANTE_CIRCLES[completedCircleId];
  const nextCircle = DANTE_CIRCLES[nextCircleId];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Virgil's Sanctuary Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-2xl shadow-inner">
              🕯️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-pixel text-zinc-100">
                  VIRGIL'S SANCTUARY
                </h2>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  CIRCLE CLEARED
                </span>
              </div>
              <p className="text-xs font-retro text-zinc-400 mt-1">
                "Take heart, Jeff. The soul who wills to ascend cannot be held by shadow."
              </p>
            </div>
          </div>
        </div>

        {/* Dante's Quote for this milestone */}
        <div
          className="p-3.5 rounded-lg border text-xs italic font-serif leading-relaxed"
          style={{
            backgroundColor: `${completedCircle.themeColor}11`,
            borderColor: `${completedCircle.themeColor}44`,
            color: completedCircle.themeColor,
          }}
        >
          "{completedCircle.quote}"
          <span className="block not-italic text-[10px] font-mono text-zinc-400 mt-1">
            — Dante Alighieri, Inferno ({completedCircle.name})
          </span>
        </div>

        {/* Next Circle Preview */}
        <div className="flex items-center justify-between bg-zinc-950 px-4 py-2.5 rounded-lg border border-zinc-800 text-xs">
          <span className="text-zinc-400 font-pixel text-[10px]">ASCENDING NEXT:</span>
          <div className="flex items-center gap-2">
            <span
              className="font-pixel text-[11px] font-bold"
              style={{ color: nextCircle.themeColor }}
            >
              {nextCircle.name}
            </span>
            <ArrowRight size={14} className="text-zinc-500" />
          </div>
        </div>

        {/* Relic Choices */}
        <div>
          <h3 className="text-xs font-pixel text-zinc-300 mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            CHOOSE VIRGIL'S BLESSING:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {boons.map((relic) => {
              const tierColor =
                relic.tier === 'legendary'
                  ? 'border-amber-500/70 bg-amber-950/20 hover:border-amber-400'
                  : relic.tier === 'rare'
                  ? 'border-purple-500/70 bg-purple-950/20 hover:border-purple-400'
                  : 'border-cyan-500/60 bg-cyan-950/20 hover:border-cyan-400';

              return (
                <button
                  key={relic.id}
                  onClick={() => onSelectBoon(relic)}
                  className={`flex flex-col text-left p-4 rounded-lg border ${tierColor} transition-all duration-150 hover:-translate-y-1 hover:shadow-lg group focus:outline-none`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {relic.icon}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        relic.tier === 'legendary'
                          ? 'bg-amber-900/60 text-amber-300'
                          : relic.tier === 'rare'
                          ? 'bg-purple-900/60 text-purple-300'
                          : 'bg-cyan-900/60 text-cyan-300'
                      }`}
                    >
                      {relic.tier}
                    </span>
                  </div>

                  <h4 className="font-pixel text-xs text-zinc-100 mb-1 group-hover:text-cyan-300 transition-colors">
                    {relic.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-normal flex-1">
                    {relic.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-pixel text-zinc-500 group-hover:text-cyan-400">
                    <span>SELECT</span>
                    <ArrowRight size={12} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
          <p className="text-[10px] text-zinc-500 font-mono">
            Upgrades persist for this entire run.
          </p>
          <button
            onClick={onSkipBoon}
            className="text-xs text-zinc-400 hover:text-zinc-200 underline font-mono"
          >
            Skip & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
