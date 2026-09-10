import React from 'react';
import { CircleId, DANTE_CIRCLES, PlayerStats } from '../types';
import { RotateCcw, Sparkles, BookOpen } from 'lucide-react';

interface GameOverModalProps {
  circleId: CircleId;
  stats: PlayerStats;
  runDurationSeconds: number;
  archetype?: string;
  onRetryLevel: () => void;
  onRestart: () => void;
  onOpenCodex: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  circleId,
  stats,
  runDurationSeconds,
  archetype,
  onRetryLevel,
  onRestart,
  onOpenCodex,
}) => {
  const circle = DANTE_CIRCLES[circleId];
  const minutes = Math.floor(runDurationSeconds / 60);
  const seconds = runDurationSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl flex flex-col gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Cute Ghost Faded Icon (No Gore, No Blood) */}
        <div className="w-16 h-16 mx-auto rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-3xl shadow-inner animate-pulse">
          👻
        </div>

        <div>
          <h2 className="text-base font-pixel text-zinc-100 tracking-wider">
            ESSENCE SCATTERED
          </h2>
          <p className="text-xs font-retro text-zinc-400 mt-1">
            Jeff's ethereal form dissolved back into the shadows of Hell.
          </p>
        </div>

        {/* Cause / Location */}
        <div
          className="p-3 rounded-lg border text-left"
          style={{
            backgroundColor: `${circle.themeColor}15`,
            borderColor: `${circle.themeColor}44`,
          }}
        >
          <div className="text-[10px] font-pixel text-zinc-400 uppercase">
            FALLEN AT:
          </div>
          <div
            className="text-xs font-pixel font-bold mt-0.5"
            style={{ color: circle.themeColor }}
          >
            {circle.name}
          </div>
          <div className="text-[11px] text-zinc-300 font-retro mt-0.5">
            {circle.subtitle}
          </div>
        </div>

        {/* Run Summary Stats */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
          <div>
            <div className="text-[10px] text-zinc-500 font-pixel">WISPS</div>
            <div className="text-sm font-pixel text-cyan-400 flex items-center justify-center gap-1 mt-1">
              <Sparkles size={12} />
              {stats.soulWisps}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-pixel">RELICS</div>
            <div className="text-sm font-pixel text-amber-400 mt-1">
              {stats.relics.length}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-pixel">TIME</div>
            <div className="text-sm font-pixel text-zinc-200 mt-1">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
          </div>
        </div>

        {/* Virgil's Comforting Quote */}
        <p className="text-xs italic font-serif text-zinc-400 border-t border-b border-zinc-800 py-3">
          "Midway upon the journey of our life I found myself in a dark wood... yet take heart, for the path upward awaits."
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRetryLevel}
            className="w-full py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-pixel text-xs flex flex-col items-center justify-center gap-0.5 font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <RotateCcw size={14} />
              <span>RETRY CIRCLE (NEW REGENERATED LAYOUT)</span>
            </div>
            <span className="text-[9px] font-retro text-zinc-800 font-normal">
              Regenerates this chamber with brand new platform placements
            </span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-pixel text-[11px] flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
          >
            <RotateCcw size={13} className="text-zinc-400" />
            <span>START OVER (NEW RUN AT CIRCLE IX)</span>
          </button>

          <button
            onClick={onOpenCodex}
            className="w-full py-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-pixel text-[10px] flex items-center justify-center gap-1.5 border border-zinc-800 transition-colors"
          >
            <BookOpen size={12} />
            <span>VIEW DANTE'S CODEX</span>
          </button>
        </div>
      </div>
    </div>
  );
};
