import React from 'react';
import { X, ArrowLeftRight, ArrowUp, Zap, HelpCircle } from 'lucide-react';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-cyan-400" size={18} />
            <h2 className="font-pixel text-sm text-zinc-100">HOW TO PLAY JEFF</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 text-xs">
          {/* Controls table */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-pixel text-[10px] text-zinc-200">
                A / D
              </kbd>
              <span className="text-zinc-400 font-mono">or</span>
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-pixel text-[10px] text-zinc-200">
                ◀ ▶
              </kbd>
            </div>
            <span className="text-zinc-300 font-retro text-sm flex items-center">
              Float Left & Right
            </span>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-pixel text-[10px] text-zinc-200">
                W / Space
              </kbd>
              <span className="text-zinc-400 font-mono">or</span>
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-pixel text-[10px] text-zinc-200">
                ▲
              </kbd>
            </div>
            <span className="text-zinc-300 font-retro text-sm flex items-center">
              Jump / Hold to Hover Float
            </span>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-pixel text-[10px] text-zinc-200">
                Shift / J
              </kbd>
            </div>
            <span className="text-zinc-300 font-retro text-sm flex items-center">
              Spectral Dash (When unlocked)
            </span>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-pixel text-[10px] text-zinc-200">
                P / Esc
              </kbd>
            </div>
            <span className="text-zinc-300 font-retro text-sm flex items-center">
              Pause Game
            </span>

            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-zinc-800 border border-amber-600/60 rounded font-pixel text-[10px] text-amber-300">
                R
              </kbd>
            </div>
            <span className="text-zinc-300 font-retro text-sm flex items-center">
              Reroll Chamber Layout (Procedural Regen)
            </span>
          </div>

          {/* Ghost Mechanics Guidance */}
          <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/80 flex flex-col gap-2">
            <h4 className="font-pixel text-[11px] text-cyan-300">
              JEFF'S GHOST ABILITIES:
            </h4>
            <ul className="list-disc list-inside text-zinc-400 space-y-1 font-retro text-sm">
              <li>
                <strong className="text-zinc-200 font-sans text-xs">Glide Hover:</strong> Hold Space or Jump while falling in midair to gently drift over wide spike pits.
              </li>
              <li>
                <strong className="text-zinc-200 font-sans text-xs">Puzzle Blocks:</strong> Walk into stone blocks to push them onto golden pressure plates.
              </li>
              <li>
                <strong className="text-zinc-200 font-sans text-xs">Crumbling Stone:</strong> Fractured blocks break 0.4 seconds after being stepped on, then reform.
              </li>
              <li>
                <strong className="text-zinc-200 font-sans text-xs">Virgil's Boons:</strong> After completing each Circle, choose 1 of 3 roguelike relics to empower Jeff.
              </li>
              <li>
                <strong className="text-zinc-200 font-sans text-xs">Safe Pixel Art:</strong> Clean retro mechanics with zero blood or gore.
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-pixel text-xs font-bold transition-colors"
        >
          GOT IT! RETURN TO GAME
        </button>
      </div>
    </div>
  );
};
