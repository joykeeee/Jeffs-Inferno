import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CircleId,
  DANTE_CIRCLES,
  GameSaveData,
  GhostSkin,
  LevelData,
  PlayerStats,
  Relic,
} from './types';
import { generateLevel, TILE_SIZE } from './game/proceduralGenerator';
import { PixelRenderer } from './game/renderer';
import {
  PhysicsEngine,
  PlayerPhysicsState,
  InputState,
} from './game/physicsEngine';
import { soundEngine } from './audio/soundEngine';
import { getRandomBoons } from './game/relics';
import { GHOST_SKINS } from './game/skins';
import { GameHUD } from './components/GameHUD';
import { BoonSelectionModal } from './components/BoonSelectionModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { CodexModal } from './components/CodexModal';
import { ControlsModal } from './components/ControlsModal';
import { TouchControls } from './components/TouchControls';
import { Play, RotateCcw, Smartphone, HelpCircle, Dices } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'jeffs_inferno_save_v1';

const INITIAL_STATS: PlayerStats = {
  ectoplasm: 3,
  maxEctoplasm: 3,
  soulWisps: 0,
  moveSpeedMultiplier: 1.0,
  jumpForceMultiplier: 1.0,
  floatDurationMultiplier: 1.0,
  hasPhantomDash: false,
  dashCooldownDuration: 2.0,
  soulMagnetRange: 0,
  hasSecondBreath: false,
  secondBreathUsed: false,
  relics: [],
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PixelRenderer>(new PixelRenderer());
  const physicsRef = useRef<PhysicsEngine>(new PhysicsEngine());

  // Game Run State
  const [circleId, setCircleId] = useState<CircleId>(9);
  const [levelNumber, setLevelNumber] = useState<number>(1);
  const [stats, setStats] = useState<PlayerStats>({ ...INITIAL_STATS });
  const [levelData, setLevelData] = useState<LevelData>(() => generateLevel(9, 1));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chamberFailures, setChamberFailures] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [runDurationSeconds, setRunDurationSeconds] = useState<number>(0);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);

  // Modals
  const [showBoonModal, setShowBoonModal] = useState<boolean>(false);
  const [pendingBoons, setPendingBoons] = useState<Relic[]>([]);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [showCodex, setShowCodex] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Persistence
  const [saveData, setSaveData] = useState<GameSaveData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return {
      highScoreWisps: 0,
      highestCircleReached: 9,
      totalRunsStarted: 0,
      totalEscapes: 0,
      unlockedSkinId: 'classic',
      unlockedSkins: ['classic'],
      totalLifetimeWisps: 0,
    };
  });

  const [activeSkinId, setActiveSkinId] = useState<string>(saveData.unlockedSkinId || 'classic');

  // Mutable Physics & Input Refs for 60 FPS loop
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    dash: false,
  });

  const playerRef = useRef<PlayerPhysicsState>({
    x: 3 * TILE_SIZE,
    y: 17 * TILE_SIZE,
    vx: 0,
    vy: 0,
    width: 20,
    height: 22,
    facing: 1,
    isGrounded: false,
    isFloating: false,
    floatTimer: 2.0,
    canDoubleJump: true,
    isDashing: false,
    dashTimer: 0,
    dashCooldownTimer: 0,
    invulnerableTimer: 0,
    hasRoomShield: false,
    checkpointX: 3 * TILE_SIZE,
    checkpointY: 17 * TILE_SIZE,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
  });

  const currentLevelRef = useRef<LevelData>(levelData);
  const currentStatsRef = useRef<PlayerStats>(stats);
  const isPausedRef = useRef<boolean>(isPaused);
  const isModalOpenRef = useRef<boolean>(false);

  // Sync refs with state
  useEffect(() => {
    currentLevelRef.current = levelData;
  }, [levelData]);

  useEffect(() => {
    currentStatsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isModalOpenRef.current = showBoonModal || showGameOver || showVictory || showCodex || showControls;
  }, [showBoonModal, showGameOver, showVictory, showCodex, showControls]);

  // Save data persistence
  const saveStateToStorage = useCallback((newData: GameSaveData) => {
    setSaveData(newData);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    } catch {
      // Ignore
    }
  }, []);

  // Audio update on Circle change
  useEffect(() => {
    soundEngine.updateAmbientDrone(circleId);
  }, [circleId, isMuted]);

  // Timer interval for run duration
  useEffect(() => {
    if (isPaused || showBoonModal || showGameOver || showVictory) return;
    const interval = setInterval(() => {
      setRunDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, showBoonModal, showGameOver, showVictory]);

  // Start / Restart a Run
  const startNewRun = useCallback(() => {
    const initialLevel = generateLevel(9, 1);
    setCircleId(9);
    setLevelNumber(1);
    setLevelData(initialLevel);
    setRunDurationSeconds(0);

    const freshStats: PlayerStats = { ...INITIAL_STATS };
    setStats(freshStats);
    currentStatsRef.current = freshStats;

    playerRef.current = {
      x: initialLevel.spawnX,
      y: initialLevel.spawnY,
      vx: 0,
      vy: 0,
      width: 20,
      height: 22,
      facing: 1,
      isGrounded: false,
      isFloating: false,
      floatTimer: 2.0,
      canDoubleJump: true,
      isDashing: false,
      dashTimer: 0,
      dashCooldownTimer: 0,
      invulnerableTimer: 0,
      hasRoomShield: false,
      checkpointX: initialLevel.spawnX,
      checkpointY: initialLevel.spawnY,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
    };

    setShowGameOver(false);
    setShowVictory(false);
    setShowBoonModal(false);
    setIsPaused(false);

    setSaveData((prev) => {
      const updated = {
        ...prev,
        totalRunsStarted: prev.totalRunsStarted + 1,
      };
      saveStateToStorage(updated);
      return updated;
    });

    soundEngine.updateAmbientDrone(9);

    setToastMessage(`Depths of Cocytus: ${initialLevel.archetype || 'Winding Switchback'}`);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
  }, [saveStateToStorage]);

  // Truly generative chamber re-roll / retry with brand new platform layout
  const regenerateCurrentChamber = useCallback(() => {
    // Generates a brand new procedural layout for this circle and level
    const newLevel = generateLevel(circleId, levelNumber);
    setLevelData(newLevel);
    currentLevelRef.current = newLevel;

    playerRef.current.x = newLevel.spawnX;
    playerRef.current.y = newLevel.spawnY;
    playerRef.current.checkpointX = newLevel.spawnX;
    playerRef.current.checkpointY = newLevel.spawnY;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.invulnerableTimer = 1.0;
    playerRef.current.coyoteTimer = 0;
    playerRef.current.jumpBufferTimer = 0;

    // Restore full ectoplasm for chamber retry
    setStats((prev) => {
      const restored = {
        ...prev,
        ectoplasm: prev.maxEctoplasm,
      };
      currentStatsRef.current = restored;
      return restored;
    });

    soundEngine.playRegenerate();
    setShowGameOver(false);

    setToastMessage(`Chamber Re-manifested: ${newLevel.archetype || 'New Architecture'}!`);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
  }, [circleId, levelNumber]);

  const regenerateCurrentChamberRef = useRef(regenerateCurrentChamber);
  useEffect(() => {
    regenerateCurrentChamberRef.current = regenerateCurrentChamber;
  }, [regenerateCurrentChamber]);

  // Advance to next Circle or Room
  const advanceLevel = useCallback(() => {
    soundEngine.playLevelWin();

    if (circleId === 0) {
      // Reached the Stars / Escaped Hell!
      setShowVictory(true);
      setSaveData((prev) => {
        const updated = {
          ...prev,
          totalEscapes: prev.totalEscapes + 1,
          highScoreWisps: Math.max(prev.highScoreWisps, currentStatsRef.current.soulWisps),
          totalLifetimeWisps: prev.totalLifetimeWisps + currentStatsRef.current.soulWisps,
        };
        saveStateToStorage(updated);
        return updated;
      });
      return;
    }

    // Next circle (ascending: 9 -> 8 -> 7 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0)
    const nextCircle = (circleId - 1) as CircleId;
    const boons = getRandomBoons(3, currentStatsRef.current.relics.map((r) => r.id));
    setPendingBoons(boons);
    setShowBoonModal(true);
  }, [circleId, saveStateToStorage]);

  const handleSelectBoon = (relic: Relic) => {
    soundEngine.playRelicSelect();

    setStats((prev) => {
      const updatedRelics = [...prev.relics, relic];
      let newMaxEcto = prev.maxEctoplasm;
      let newEcto = prev.ectoplasm;
      let moveSpeed = prev.moveSpeedMultiplier;
      let floatDur = prev.floatDurationMultiplier;
      let hasDash = prev.hasPhantomDash;
      let dashCd = prev.dashCooldownDuration;
      let magnet = prev.soulMagnetRange;
      let secondBreath = prev.hasSecondBreath;
      let wisps = prev.soulWisps;

      if (relic.id === 'virgils_mantle') {
        newMaxEcto += 1;
        newEcto = newMaxEcto;
      } else if (relic.id === 'phantom_surge') {
        hasDash = true;
        dashCd = 1.4;
      } else if (relic.id === 'spectral_drift') {
        floatDur *= 1.75;
      } else if (relic.id === 'ethereal_magnet') {
        magnet = 75;
      } else if (relic.id === 'zephyr_touch') {
        moveSpeed *= 1.25;
      } else if (relic.id === 'second_breath') {
        secondBreath = true;
      } else if (relic.id === 'philosophers_wisdom') {
        wisps += 2;
      }

      return {
        ...prev,
        ectoplasm: newEcto,
        maxEctoplasm: newMaxEcto,
        soulWisps: wisps,
        relics: updatedRelics,
        moveSpeedMultiplier: moveSpeed,
        floatDurationMultiplier: floatDur,
        hasPhantomDash: hasDash,
        dashCooldownDuration: dashCd,
        soulMagnetRange: magnet,
        hasSecondBreath: secondBreath,
      };
    });

    const nextCircle = (circleId - 1) as CircleId;
    const nextLevelNum = levelNumber + 1;
    const nextLevel = generateLevel(nextCircle, nextLevelNum);

    setCircleId(nextCircle);
    setLevelNumber(nextLevelNum);
    setLevelData(nextLevel);

    playerRef.current.x = nextLevel.spawnX;
    playerRef.current.y = nextLevel.spawnY;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.checkpointX = nextLevel.spawnX;
    playerRef.current.checkpointY = nextLevel.spawnY;

    if (currentStatsRef.current.relics.some((r) => r.id === 'aura_of_dis')) {
      playerRef.current.hasRoomShield = true;
    }

    setShowBoonModal(false);
  };

  const handleSkipBoon = () => {
    const nextCircle = (circleId - 1) as CircleId;
    const nextLevelNum = levelNumber + 1;
    const nextLevel = generateLevel(nextCircle, nextLevelNum);

    setCircleId(nextCircle);
    setLevelNumber(nextLevelNum);
    setLevelData(nextLevel);

    playerRef.current.x = nextLevel.spawnX;
    playerRef.current.y = nextLevel.spawnY;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;

    setShowBoonModal(false);
  };

  // Player Damage & Defeat Handling
  const handlePlayerHurt = () => {
    setStats((prev) => {
      const newEcto = prev.ectoplasm - 1;
      if (newEcto <= 0) {
        if (prev.hasSecondBreath && !prev.secondBreathUsed) {
          // Revive once
          soundEngine.playRelicSelect();
          return {
            ...prev,
            ectoplasm: 1,
            secondBreathUsed: true,
          };
        }

        // Defeat
        setChamberFailures((prev) => prev + 1);
        setShowGameOver(true);
        setSaveData((save) => {
          const updated = {
            ...save,
            highScoreWisps: Math.max(save.highScoreWisps, prev.soulWisps),
            totalLifetimeWisps: save.totalLifetimeWisps + prev.soulWisps,
          };
          saveStateToStorage(updated);
          return updated;
        });

        return { ...prev, ectoplasm: 0 };
      }
      return { ...prev, ectoplasm: newEcto };
    });
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = true;
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        inputRef.current.jump = true;
        inputRef.current.jumpPressed = true;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ') {
        inputRef.current.dash = true;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (!isModalOpenRef.current) {
          setIsPaused((p) => !p);
        }
      }
      if (e.code === 'KeyR') {
        regenerateCurrentChamberRef.current();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = false;
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        inputRef.current.jump = false;
        inputRef.current.jumpPressed = false;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ') {
        inputRef.current.dash = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60 FPS Animation / Physics / Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const rawDt = (time - lastTime) / 1000;
      lastTime = time;
      const dt = Math.min(rawDt, 0.05); // Cap delta time

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;

          const level = currentLevelRef.current;
          const statsVal = currentStatsRef.current;
          const player = playerRef.current;

          // Update physics only when not paused or showing blocking modals
          if (!isPausedRef.current && !isModalOpenRef.current && statsVal.ectoplasm > 0) {
            physicsRef.current.update(
              player,
              inputRef.current,
              level,
              statsVal,
              dt,
              () => {
                // Key collected
              },
              (_wispId, value) => {
                setStats((s) => ({ ...s, soulWisps: s.soulWisps + value }));
              },
              () => {
                handlePlayerHurt();
              },
              () => {
                // Door opened
              },
              (x, y, color, count) => {
                rendererRef.current.addBurst(x, y, color, count);
              }
            );

            // Reset one-shot jump trigger
            inputRef.current.jumpPressed = false;

            // Check if player reached exit portal
            const portal = level.exitPortal;
            const doorsOpen = level.doors.every((d) => d.isOpen);
            if (doorsOpen) {
              const distToPortal = Math.hypot(
                player.x + player.width / 2 - (portal.x + portal.width / 2),
                player.y + player.height / 2 - (portal.y + portal.height / 2)
              );
              if (distToPortal < 24) {
                advanceLevel();
              }
            }
          }

          // Active ghost skin
          const currentSkin =
            GHOST_SKINS.find((s) => s.id === activeSkinId) || GHOST_SKINS[0];

          // Render game frame
          rendererRef.current.render(
            ctx,
            level,
            {
              x: player.x,
              y: player.y,
              vx: player.vx,
              vy: player.vy,
              width: player.width,
              height: player.height,
              facing: player.facing,
              isGrounded: player.isGrounded,
              isFloating: player.isFloating,
              isDashing: player.isDashing,
              invulnerableTimer: player.invulnerableTimer,
              hasShield: player.hasRoomShield,
            },
            currentSkin
          );
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeSkinId, advanceLevel]);

  // Skin Unlock Handler
  const handleUnlockSkin = (skin: GhostSkin) => {
    if (saveData.totalLifetimeWisps >= skin.cost) {
      soundEngine.playRelicSelect();
      const updated: GameSaveData = {
        ...saveData,
        totalLifetimeWisps: saveData.totalLifetimeWisps - skin.cost,
        unlockedSkins: [...saveData.unlockedSkins, skin.id],
        unlockedSkinId: skin.id,
      };
      saveStateToStorage(updated);
      setActiveSkinId(skin.id);
    }
  };

  const handleSelectSkin = (skinId: string) => {
    setActiveSkinId(skinId);
    setSaveData((prev) => {
      const updated = { ...prev, unlockedSkinId: skinId };
      saveStateToStorage(updated);
      return updated;
    });
  };

  const hasKey = levelData.keys.some((k) => k.collected);
  const isDoorOpen = levelData.doors.length > 0 ? levelData.doors.every((d) => d.isOpen) : true;

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      {/* HUD Header */}
      <GameHUD
        circleId={circleId}
        stats={stats}
        dashCooldownRemaining={playerRef.current.dashCooldownTimer}
        hasKey={hasKey}
        isDoorOpen={isDoorOpen}
        isMuted={isMuted}
        archetype={levelData.archetype}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          soundEngine.setMuted(next);
        }}
        onOpenCodex={() => setShowCodex(true)}
        onOpenControls={() => setShowControls(true)}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((p) => !p)}
        onRestartRun={startNewRun}
        onRerollLevel={regenerateCurrentChamber}
      />

      {/* Main Canvas Viewport Area */}
      <main className="flex-1 relative flex items-center justify-center bg-black overflow-hidden p-1 sm:p-3">
        <div className="relative max-w-5xl w-full aspect-[16/10] max-h-full flex items-center justify-center rounded-lg overflow-hidden border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <canvas
            ref={canvasRef}
            width={768}
            height={480}
            className="w-full h-full object-contain pixelated bg-zinc-950 block"
          />

          {/* Procedural Generation / Level Manifest Toast Notification */}
          {toastMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/60 text-amber-300 font-pixel text-[11px] shadow-xl backdrop-blur-sm flex items-center gap-2 pointer-events-none">
              <Dices size={14} className="text-amber-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Pause Overlay */}
          {isPaused && !isModalOpenRef.current && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-4 text-center p-4 z-30">
              <h2 className="font-pixel text-base text-zinc-100 tracking-widest">
                GAME PAUSED
              </h2>
              <p className="text-xs font-retro text-zinc-400">
                Jeff rests in the quiet shadows of {DANTE_CIRCLES[circleId].name}.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() => setIsPaused(false)}
                  className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-pixel text-xs font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105"
                >
                  <Play size={14} />
                  RESUME
                </button>
                <button
                  onClick={startNewRun}
                  className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-pixel text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
                >
                  <RotateCcw size={14} />
                  RESTART RUN
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Bar: Touch Controls or Quick Guide */}
      <footer className="bg-zinc-950 border-t border-zinc-800 px-4 py-1.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 font-retro">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span className="font-pixel text-[10px]">Controls:</span> A/D or ◀▶ (Move) • Space/W (Jump & Hold to Float) • Shift (Dash) • R (Reroll Layout)
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <button
            onClick={() => setShowTouchControls((t) => !t)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-pixel transition-colors ${
              showTouchControls
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle On-Screen Touch Buttons"
          >
            <Smartphone size={12} />
            <span>TOUCH DPAD</span>
          </button>
          <button
            onClick={() => setShowControls(true)}
            className="flex items-center gap-1 text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            <HelpCircle size={12} />
            <span>Guide</span>
          </button>
        </div>
      </footer>

      {/* Optional On-Screen Touch Controls (Mobile / Tablet) */}
      {showTouchControls && (
        <div className="sm:hidden fixed bottom-10 left-0 right-0 z-40">
          <TouchControls
            inputState={inputRef.current}
            hasPhantomDash={stats.hasPhantomDash}
          />
        </div>
      )}

      {/* Modals */}
      {showBoonModal && (
        <BoonSelectionModal
          completedCircleId={circleId}
          nextCircleId={(circleId - 1) as CircleId}
          boons={pendingBoons}
          onSelectBoon={handleSelectBoon}
          onSkipBoon={handleSkipBoon}
        />
      )}

      {showGameOver && (
        <GameOverModal
          circleId={circleId}
          stats={stats}
          runDurationSeconds={runDurationSeconds}
          archetype={levelData.archetype}
          onRetryLevel={regenerateCurrentChamber}
          onRestart={startNewRun}
          onOpenCodex={() => {
            setShowGameOver(false);
            setShowCodex(true);
          }}
        />
      )}

      {showVictory && (
        <VictoryModal
          stats={stats}
          runDurationSeconds={runDurationSeconds}
          onRestart={startNewRun}
          onOpenCodex={() => {
            setShowVictory(false);
            setShowCodex(true);
          }}
        />
      )}

      {showCodex && (
        <CodexModal
          onClose={() => setShowCodex(false)}
          saveData={saveData}
          activeSkinId={activeSkinId}
          onSelectSkin={handleSelectSkin}
          onUnlockSkin={handleUnlockSkin}
        />
      )}

      {showControls && <ControlsModal onClose={() => setShowControls(false)} />}
    </div>
  );
}
