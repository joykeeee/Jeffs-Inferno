import React, { useState } from 'react';
import { CircleId, DANTE_CIRCLES, GameSaveData, GhostSkin } from '../types';
import { GHOST_SKINS } from '../game/skins';
import { X, Book, Sparkles, Check, Lock, Palette } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface CodexModalProps {
  onClose: () => void;
  saveData: GameSaveData;
  activeSkinId: string;
  onSelectSkin: (skinId: string) => void;
  onUnlockSkin: (skin: GhostSkin) => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({
  onClose,
  saveData,
  activeSkinId,
  onSelectSkin,
  onUnlockSkin,
}) => {
  const [activeTab, setActiveTab] = useState<'circles' | 'wardrobe'>('circles');
  const [selectedCircleId, setSelectedCircleId] = useState<CircleId>(9);

  const selectedCircle = DANTE_CIRCLES[selectedCircleId];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-3xl w-full max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <Book className="text-cyan-400" size={20} />
            <div>
              <h2 className="font-pixel text-sm text-zinc-100">
                DANTE'S INFERNO CODEX
              </h2>
              <p className="text-xs font-retro text-zinc-400">
                The Nine Circles of Hell & Jeff's Spectral Journey
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-pixel text-cyan-300">
              <Sparkles size={13} className="text-cyan-400" />
              <span>{saveData.totalLifetimeWisps} WISPS</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('circles')}
            className={`flex items-center gap-2 px-4 py-2.5 font-pixel text-xs border-b-2 transition-colors ${
              activeTab === 'circles'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Book size={14} />
            THE NINE CIRCLES
          </button>
          <button
            onClick={() => setActiveTab('wardrobe')}
            className={`flex items-center gap-2 px-4 py-2.5 font-pixel text-xs border-b-2 transition-colors ${
              activeTab === 'wardrobe'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette size={14} />
            JEFF'S PALETTES ({saveData.unlockedSkins.length}/{GHOST_SKINS.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'circles' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Circle Selector List (Ascending from 9 to 1) */}
              <div className="flex flex-col gap-1.5 pr-2 max-h-[55vh] overflow-y-auto">
                <div className="text-[10px] font-pixel text-zinc-500 mb-1 px-1">
                  CHOOSE CIRCLE:
                </div>
                {([9, 8, 7, 6, 5, 4, 3, 2, 1, 0] as CircleId[]).map((cid) => {
                  const circle = DANTE_CIRCLES[cid];
                  const isSelected = selectedCircleId === cid;
                  return (
                    <button
                      key={cid}
                      onClick={() => {
                        setSelectedCircleId(cid);
                        soundEngine.playSwitch();
                      }}
                      className={`text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between ${
                        isSelected
                          ? 'bg-zinc-800 border-cyan-400 shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/60 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: circle.themeColor }}
                        />
                        <span className="font-pixel text-[11px] truncate">
                          {cid === 0 ? 'The Stars' : `Circle ${10 - cid}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {cid === 0 ? 'Exit' : `IX-${cid}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Circle Detail View */}
              <div className="md:col-span-2 flex flex-col gap-4 bg-zinc-950 p-5 rounded-xl border border-zinc-800">
                <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3
                      className="font-pixel text-sm font-bold"
                      style={{ color: selectedCircle.themeColor }}
                    >
                      {selectedCircle.name}
                    </h3>
                    <p className="text-xs font-retro text-zinc-400 mt-0.5">
                      {selectedCircle.subtitle}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-mono uppercase px-2 py-1 rounded border"
                    style={{
                      borderColor: `${selectedCircle.themeColor}66`,
                      color: selectedCircle.themeColor,
                    }}
                  >
                    Depth {selectedCircle.id}
                  </span>
                </div>

                {/* Dante's Quote */}
                <div
                  className="p-3.5 rounded-lg border text-xs italic font-serif leading-relaxed"
                  style={{
                    backgroundColor: `${selectedCircle.themeColor}15`,
                    borderColor: `${selectedCircle.themeColor}44`,
                    color: selectedCircle.themeColor,
                  }}
                >
                  "{selectedCircle.quote}"
                  <span className="block not-italic text-[10px] font-mono text-zinc-400 mt-1">
                    — Dante Alighieri, Divine Comedy
                  </span>
                </div>

                {/* Platforming Obstacles */}
                <div>
                  <h4 className="text-[11px] font-pixel text-zinc-300 mb-1">
                    CANTO PUZZLE OBSTACLES:
                  </h4>
                  <p className="text-xs text-zinc-400 font-retro leading-relaxed">
                    {selectedCircle.obstacleDescription}. Jeff must solve the spatial puzzles, ride moving stone rafts, and unlock the celestial seal to ascend to the next sphere.
                  </p>
                </div>

                {/* Ambient Atmosphere */}
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-800/80">
                  <span>Atmosphere:</span>
                  <span className="capitalize text-zinc-300">
                    {selectedCircle.ambientEffect}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Jeff's Wardrobe / Palettes */
            <div className="flex flex-col gap-4">
              <div className="text-xs text-zinc-400">
                Unlock new spectral colors and radiant glowing auras for Jeff using Soul Wisps collected across your runs.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {GHOST_SKINS.map((skin) => {
                  const isUnlocked =
                    skin.unlocked || saveData.unlockedSkins.includes(skin.id);
                  const isEquipped = activeSkinId === skin.id;
                  const canAfford = saveData.totalLifetimeWisps >= skin.cost;

                  return (
                    <div
                      key={skin.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isEquipped
                          ? 'bg-cyan-950/20 border-cyan-400'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Ghost preview icon */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center border"
                            style={{
                              backgroundColor: skin.mainColor,
                              borderColor: skin.glowColor,
                              boxShadow: `0 0 10px ${skin.glowColor}55`,
                            }}
                          >
                            <span className="text-xs font-pixel" style={{ color: skin.eyeColor }}>
                              ••
                            </span>
                          </div>
                          <div>
                            <h4 className="font-pixel text-xs text-zinc-100">
                              {skin.name}
                            </h4>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {isUnlocked ? 'Unlocked' : `${skin.cost} Wisps`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <button
                          onClick={() => {
                            onSelectSkin(skin.id);
                            soundEngine.playSwitch();
                          }}
                          disabled={isEquipped}
                          className={`w-full py-1.5 rounded font-pixel text-[10px] flex items-center justify-center gap-1.5 transition-colors ${
                            isEquipped
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <Check size={12} />
                              EQUIPPED
                            </>
                          ) : (
                            'EQUIP'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => onUnlockSkin(skin)}
                          disabled={!canAfford}
                          className={`w-full py-1.5 rounded font-pixel text-[10px] flex items-center justify-center gap-1.5 transition-colors ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-black font-bold'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                          }`}
                        >
                          <Lock size={12} />
                          UNLOCK ({skin.cost})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>High Score: {saveData.highScoreWisps} Wisps</span>
          <span>Total Escapes: {saveData.totalEscapes}</span>
        </div>
      </div>
    </div>
  );
};
