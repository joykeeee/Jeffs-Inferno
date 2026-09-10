import React from 'react';
import {
  CircleId,
  DANTE_CIRCLES,
  PlayerStats,
  Relic,
} from '../types';
import {
  Volume2,
  VolumeX,
  BookOpen,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Key,
  Sparkles,
  Zap,
  Dices,
} from 'lucide-react';

interface GameHUDProps {
  circleId: CircleId;
  stats: PlayerStats;
  dashCooldownRemaining: number;
  hasKey: boolean;
  isDoorOpen: boolean;
  isMuted: boolean;
  archetype?: string;
  onToggleMute: () => void;
  onOpenCodex: () => void;
  onOpenControls: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestartRun: () => void;
  onRerollLevel?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  circleId,
  stats,
  dashCooldownRemaining,
  hasKey,
  isDoorOpen,
  isMuted,
  archetype,
  onToggleMute,
  onOpenCodex,
  onOpenControls,
  isPaused,
  onTogglePause,
  onRestartRun,
  onRerollLevel,
}) => {
  const circle = DANTE_CIRCLES[circleId];
  const dashReady = stats.hasPhantomDash && dashCooldownRemaining <= 0;
  const dashPercent = stats.hasPhantomDash
    ? Math.max(0, 1 - dashCooldownRemaining / stats.dashCooldownDuration) * 100
    : 0;

  return (
    <header className="w-full bg-zinc-950/90 border-b border-zinc-800 backdrop-blur-md px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 select-none z-20">
      {/* Circle Banner */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full animate-pulse shadow-sm"
            style={{ backgroundColor: circle.themeColor }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-pixel font-bold tracking-tight text-zinc-100">
                {circle.name}
              </h1>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold"
                style={{
                  backgroundColor: `${circle.themeColor}22`,
                  color: circle.themeColor,
                  border: `1px solid ${circle.themeColor}55`,
                }}
              >
                {circleId === 0 ? 'EXIT' : `FLOOR ${10 - circleId}/9`}
              </span>
              {archetype && (
                <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded font-pixel bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {archetype}
                </span>
              )}
            </div>
            <p className="text-[11px] font-retro text-zinc-400 hidden sm:block">
              {circle.subtitle}
            </p>
          </div>
        </div>

        {/* Small mobile pause/mute/reroll buttons */}
        <div className="flex items-center gap-1 sm:hidden">
          {onRerollLevel && (
            <button
              onClick={onRerollLevel}
              className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400 hover:text-amber-300"
              title="Reroll Layout [R]"
            >
              <Dices size={14} />
            </button>
          )}
          <button
            onClick={onTogglePause}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>

      {/* Center Status: Health, Dash, Keys, Wisps */}
      <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
        {/* Ectoplasm (Health) */}
        <div className="flex items-center gap-1 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
          <span className="text-[10px] font-pixel text-zinc-400 mr-1">ECTO</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: stats.maxEctoplasm }).map((_, i) => {
              const active = i < stats.ectoplasm;
              return (
                <div
                  key={i}
                  className={`w-3.5 h-4.5 rounded-t-full transition-all duration-300 ${
                    active
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                      : 'bg-zinc-800 border border-zinc-700 opacity-40'
                  }`}
                  title={active ? 'Ectoplasm container' : 'Empty container'}
                />
              );
            })}
          </div>
        </div>

        {/* Soul Wisps Currency */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
          <Sparkles size={14} className="text-cyan-400 animate-pulse" />
          <span className="font-pixel text-xs text-cyan-300">
            {stats.soulWisps}
          </span>
        </div>

        {/* Gate Status / Key */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
            isDoorOpen
              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400'
              : hasKey
              ? 'bg-amber-950/60 border-amber-500 text-amber-400'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-500'
          }`}
          title={isDoorOpen ? 'Exit Portal Unlocked!' : hasKey ? 'Key in hand!' : 'Gate Locked'}
        >
          <Key size={14} className={isDoorOpen ? 'animate-bounce' : ''} />
          <span className="font-pixel text-[10px]">
            {isDoorOpen ? 'UNLOCKED' : hasKey ? 'KEY FOUND' : 'LOCKED'}
          </span>
        </div>

        {/* Dash Gauge if unlocked */}
        {stats.hasPhantomDash && (
          <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
            <Zap
              size={13}
              className={dashReady ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}
            />
            <div className="w-12 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="h-full bg-cyan-400 transition-all duration-75"
                style={{ width: `${dashPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Relic Badges */}
        {stats.relics.length > 0 && (
          <div className="hidden md:flex items-center gap-1">
            {stats.relics.map((relic: Relic) => (
              <span
                key={relic.id}
                className="text-base px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 cursor-help"
                title={`${relic.name}: ${relic.description}`}
              >
                {relic.icon}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls Bar (Desktop) */}
      <div className="hidden sm:flex items-center gap-2">
        {onRerollLevel && (
          <button
            onClick={onRerollLevel}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-amber-300 hover:text-amber-200 hover:border-amber-500/50 hover:bg-amber-950/30 text-xs font-pixel transition-all"
            title="Reroll Chamber Layout [R] (Procedurally generates new platform placements)"
          >
            <Dices size={13} className="text-amber-400 animate-pulse" />
            <span>REROLL [R]</span>
          </button>
        )}

        <button
          onClick={onOpenCodex}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50 text-xs font-pixel transition-colors"
          title="Dante's Inferno Codex"
        >
          <BookOpen size={13} />
          <span>CODEX</span>
        </button>

        <button
          onClick={onOpenControls}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50 text-xs font-pixel transition-colors"
          title="Controls Guide"
        >
          <HelpCircle size={13} />
          <span>HELP</span>
        </button>

        <button
          onClick={onTogglePause}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title={isPaused ? 'Resume Game' : 'Pause Game'}
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
        </button>

        <button
          onClick={onToggleMute}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        <button
          onClick={onRestartRun}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-rose-400 transition-colors"
          title="Restart Run"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </header>
  );
};
