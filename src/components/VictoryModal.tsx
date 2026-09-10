import React from 'react';
import { PlayerStats } from '../types';
import { Sparkles, Trophy, RotateCcw, BookOpen } from 'lucide-react';

interface VictoryModalProps {
  stats: PlayerStats;
  runDurationSeconds: number;
  onRestart: () => void;
  onOpenCodex: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  runDurationSeconds,
  onRestart,
  onOpenCodex,
}) => {
  const minutes = Math.floor(runDurationSeconds / 60);
  const seconds = runDurationSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-zinc-900 border border-amber-500/50 rounded-xl p-6 shadow-2xl shadow-amber-500/10 flex flex-col gap-5 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Celestial Star Wisp Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-950/40 border border-amber-400/60 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(251,191,36,0.3)] animate-pulse">
          ✨
        </div>

        <div>
          <span className="text-[10px] font-pixel text-amber-400 uppercase tracking-widest bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800">
            PURGATION COMPLETE
          </span>
          <h2 className="text-base sm:text-lg font-pixel text-zinc-100 mt-2 tracking-wide">
            JEFF HAS ESCAPED HELL!
          </h2>
          <p className="text-xs font-retro text-zinc-400 mt-1">
            Passing all nine circles, Jeff's soul ascended into the celestial sky.
          </p>
        </div>

        {/* Dante's Famous Finale */}
        <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-center">
          <p className="text-sm font-serif italic text-cyan-200 leading-relaxed">
            "E quindi uscimmo a riveder le stelle."
          </p>
          <p className="text-xs font-serif italic text-cyan-300/70 mt-1">
            — "And thence we came out to see once more the stars."
          </p>
          <span className="block text-[10px] font-mono text-zinc-500 mt-2">
            Inferno, Canto XXXIV, Line 139
          </span>
        </div>

        {/* Run Records */}
        <div className="grid grid-cols-3 gap-3 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
          <div>
            <div className="text-[10px] text-zinc-500 font-pixel">TOTAL WISPS</div>
            <div className="text-sm font-pixel text-cyan-400 flex items-center justify-center gap-1 mt-1">
              <Sparkles size={12} />
              {stats.soulWisps}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-pixel">RELICS HELD</div>
            <div className="text-sm font-pixel text-amber-400 mt-1">
              {stats.relics.length}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-pixel">TIME</div>
            <div className="text-sm font-pixel text-zinc-100 mt-1">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
          </div>
        </div>

        {/* Relic Badges Earned */}
        {stats.relics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {stats.relics.map((r) => (
              <span
                key={r.id}
                className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center gap-1"
              >
                <span>{r.icon}</span>
                <span>{r.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-pixel text-xs flex items-center justify-center gap-2 font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw size={14} />
            ASCEND AGAIN (NEW ESCAPE RUN)
          </button>
          <button
            onClick={onOpenCodex}
            className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-pixel text-[11px] flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
          >
            <BookOpen size={13} />
            DANTE'S CIRCLES CODEX
          </button>
        </div>
      </div>
    </div>
  );
};
