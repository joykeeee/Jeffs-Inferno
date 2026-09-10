import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Zap } from 'lucide-react';
import { InputState } from '../game/physicsEngine';

interface TouchControlsProps {
  inputState: InputState;
  hasPhantomDash: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  inputState,
  hasPhantomDash,
}) => {
  const handleTouchStart = (key: keyof InputState) => {
    inputState[key] = true;
    if (key === 'jump') {
      inputState.jumpPressed = true;
    }
  };

  const handleTouchEnd = (key: keyof InputState) => {
    inputState[key] = false;
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-2 select-none pointer-events-auto touch-none">
      {/* Left / Right D-Pad */}
      <div className="flex items-center gap-3">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            handleTouchStart('left');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouchEnd('left');
          }}
          onMouseDown={() => handleTouchStart('left')}
          onMouseUp={() => handleTouchEnd('left')}
          className="w-14 h-14 rounded-xl bg-zinc-900/90 border-2 border-zinc-700 active:bg-cyan-500/30 active:border-cyan-400 flex items-center justify-center text-zinc-200 active:text-cyan-300 shadow-lg transition-colors"
          aria-label="Move Left"
        >
          <ArrowLeft size={24} />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            handleTouchStart('right');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouchEnd('right');
          }}
          onMouseDown={() => handleTouchStart('right')}
          onMouseUp={() => handleTouchEnd('right')}
          className="w-14 h-14 rounded-xl bg-zinc-900/90 border-2 border-zinc-700 active:bg-cyan-500/30 active:border-cyan-400 flex items-center justify-center text-zinc-200 active:text-cyan-300 shadow-lg transition-colors"
          aria-label="Move Right"
        >
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Action Buttons: Jump / Float & Dash */}
      <div className="flex items-center gap-3">
        {hasPhantomDash && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleTouchStart('dash');
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouchEnd('dash');
            }}
            onMouseDown={() => handleTouchStart('dash')}
            onMouseUp={() => handleTouchEnd('dash')}
            className="w-14 h-14 rounded-xl bg-zinc-900/90 border-2 border-cyan-600/70 active:bg-cyan-500/40 flex flex-col items-center justify-center text-cyan-300 shadow-lg transition-colors"
            aria-label="Spectral Dash"
          >
            <Zap size={20} />
            <span className="text-[9px] font-pixel mt-0.5">DASH</span>
          </button>
        )}

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            handleTouchStart('jump');
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouchEnd('jump');
          }}
          onMouseDown={() => handleTouchStart('jump')}
          onMouseUp={() => handleTouchEnd('jump')}
          className="w-16 h-16 rounded-xl bg-cyan-600/30 border-2 border-cyan-400 active:bg-cyan-500/50 flex flex-col items-center justify-center text-cyan-200 shadow-lg shadow-cyan-500/20 transition-colors"
          aria-label="Jump and Float"
        >
          <ArrowUp size={22} />
          <span className="text-[9px] font-pixel mt-0.5">FLOAT</span>
        </button>
      </div>
    </div>
  );
};
