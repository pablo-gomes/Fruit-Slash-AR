import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameMode, 
  GameState, 
  BladeStyle, 
  GameSettings, 
  GameStats 
} from './types';
import { BLADE_STYLES } from './data/fruits';
import { GameEngine } from './systems/GameEngine';
import { HandTracker, TrackingFrame } from './systems/HandTracker';
import { soundEngine } from './systems/SoundEngine';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { HomeScreen } from './components/HomeScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { CalibrationModal } from './components/CalibrationModal';
import { ShopModal } from './components/ShopModal';
import { SettingsModal } from './components/SettingsModal';
import { ExpoGuideModal } from './components/ExpoGuideModal';
import { CountdownOverlay } from './components/CountdownOverlay';
import { Camera, CameraOff, Maximize2, SwitchCamera, Swords } from 'lucide-react';

const STORAGE_KEYS = {
  HIGH_SCORES: 'fruit_slash_ar_high_scores',
  COINS: 'fruit_slash_ar_coins',
  BLADES: 'fruit_slash_ar_unlocked_blades',
  ACTIVE_BLADE: 'fruit_slash_ar_active_blade',
  SETTINGS: 'fruit_slash_ar_settings',
};

export default function App() {
  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [startBanner, setStartBanner] = useState<boolean>(false);

  // Stats & persistence
  const [highScores, setHighScores] = useState<Record<GameMode, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
      return saved ? JSON.parse(saved) : { classic: 0, time_attack: 0, zen: 0, bomb_rush: 0, fruit_rain: 0 };
    } catch {
      return { classic: 0, time_attack: 0, zen: 0, bomb_rush: 0, fruit_rain: 0 };
    }
  });

  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COINS);
      return saved ? parseInt(saved, 10) : 50;
    } catch {
      return 50;
    }
  });

  const [unlockedBladeIds, setUnlockedBladeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BLADES);
      return saved ? JSON.parse(saved) : ['katana'];
    } catch {
      return ['katana'];
    }
  });

  const [activeBladeId, setActiveBladeId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_BLADE) || 'katana';
    } catch {
      return 'katana';
    }
  });

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      sfxVolume: 0.8,
      musicVolume: 0.5,
      vibration: true,
      sensitivity: 1.0,
      cameraFacing: 'user',
      controlMode: 'camera_hand',
      showHandDebug: true,
      quality: 'high',
    };
  });

  // Dimensions
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Engine instances
  const gameEngineRef = useRef<GameEngine>(new GameEngine());
  const handTrackerRef = useRef<HandTracker>(new HandTracker());

  // Throttled HUD values for rendering
  const [hudState, setHudState] = useState({
    score: 0,
    lives: 3,
    maxLives: 3,
    combo: 1,
    comboTimer: 1,
    frenzyActive: false,
    frenzyTimer: 0,
    freezeActive: false,
    freezeTimer: 0,
    timeRemaining: 60,
    coinsEarned: 0,
    handConfidence: 0,
  });

  const [lastGameOverStats, setLastGameOverStats] = useState({
    score: 0,
    highScore: 0,
    isNewRecord: false,
    cutsCount: 0,
    bombsHit: 0,
    maxCombo: 1,
    accuracy: 100,
    coinsEarned: 0,
  });

  const [lightLevel, setLightLevel] = useState<number>(0.5);

  const activeBlade = BLADE_STYLES.find((b) => b.id === activeBladeId) || BLADE_STYLES[0];

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(highScores));
    } catch {}
  }, [highScores]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COINS, coins.toString());
    } catch {}
  }, [coins]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BLADES, JSON.stringify(unlockedBladeIds));
    } catch {}
  }, [unlockedBladeIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BLADE, activeBladeId);
    } catch {}
  }, [activeBladeId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
    soundEngine.setConfig(settings.sfxVolume, settings.musicVolume, settings.vibration);
    handTrackerRef.current.sensitivity = settings.sensitivity;
    handTrackerRef.current.controlMode = settings.controlMode;
  }, [settings]);

  // Window Resize Observer
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.max(320, Math.round(rect.width || window.innerWidth));
        const h = Math.max(400, Math.round(rect.height || window.innerHeight));
        setDimensions({ width: w, height: h });
        gameEngineRef.current.setDimensions(w, h);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize camera asynchronously
  const initCamera = useCallback(async (facing: 'user' | 'environment') => {
    if (videoRef.current) {
      handTrackerRef.current.setVideoElement(videoRef.current);
    }
    const res = await handTrackerRef.current.startCamera(facing);
    setIsCameraActive(res.success);
  }, []);

  useEffect(() => {
    initCamera(settings.cameraFacing);
    return () => {
      handTrackerRef.current.stopCamera();
    };
  }, [initCamera, settings.cameraFacing]);

  // Game loop (physics update & throttled state sync)
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let lastHudSync = 0;
    let lastDiagnosticSync = 0;

    const loop = (currentTimestamp: number) => {
      const dt = Math.min(0.06, (currentTimestamp - lastTimestamp) / 1000);
      lastTimestamp = currentTimestamp;

      const tracker = handTrackerRef.current;
      const engine = gameEngineRef.current;

      // Diagnostic updates throttled to once every 500ms
      if (currentTimestamp - lastDiagnosticSync > 500) {
        lastDiagnosticSync = currentTimestamp;
        const frame = tracker.processFrame(dimensions.width, dimensions.height);
        setLightLevel(frame.lightLevel);
      }

      // Physics update only when actively playing
      if (gameState === 'playing') {
        const trail = tracker.getBladeTrail();
        engine.update(dt, trail, activeBlade);

        // Throttled HUD update (15 times/sec) to avoid React Virtual DOM bottlenecks
        if (currentTimestamp - lastHudSync > 66 || engine.isGameOver) {
          lastHudSync = currentTimestamp;
          const trackFrame = tracker.processFrame(dimensions.width, dimensions.height);
          setHudState({
            score: engine.score,
            lives: engine.lives,
            maxLives: engine.maxLives,
            combo: engine.combo,
            comboTimer: engine.comboExpireTimer / 2.8,
            frenzyActive: engine.frenzyActive,
            frenzyTimer: engine.frenzyTimer,
            freezeActive: engine.freezeTimer > 0,
            freezeTimer: engine.freezeTimer,
            timeRemaining: engine.timeRemaining,
            coinsEarned: engine.coinsEarned,
            handConfidence: trackFrame.confidence,
          });
        }

        // Check for Game Over trigger
        if (engine.isGameOver) {
          const finalScore = engine.score;
          const currentModeBest = highScores[gameMode] || 0;
          const isNewRecord = finalScore > currentModeBest;

          if (isNewRecord) {
            setHighScores((prev) => ({ ...prev, [gameMode]: finalScore }));
          }

          const earned = engine.coinsEarned;
          setCoins((prev) => prev + earned);

          setLastGameOverStats({
            score: finalScore,
            highScore: isNewRecord ? finalScore : currentModeBest,
            isNewRecord,
            cutsCount: engine.cutsCount,
            bombsHit: engine.bombsHit,
            maxCombo: engine.maxComboAchieved,
            accuracy: engine.getAccuracy(),
            coinsEarned: earned,
          });

          setGameState('gameover');
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, dimensions, activeBlade, gameMode, highScores]);

  // Instant Game Start - Loads instantly with zero delay!
  const startGame = (mode: GameMode = gameMode) => {
    setGameMode(mode);
    gameEngineRef.current.reset(mode);
    handTrackerRef.current.clearTrail();
    setGameState('playing');
    setStartBanner(true);
    soundEngine.playSwoosh(1.8);
    setTimeout(() => setStartBanner(false), 1200);
  };

  // Touch / Mouse Swipe event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handTrackerRef.current.startManualStroke(x, y);
    soundEngine.playSwoosh(1.2);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons > 0 || e.pointerType === 'touch') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handTrackerRef.current.addManualPoint(x, y);
    }
  };

  const handlePointerUp = () => {
    // End manual stroke
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Switch camera facing
  const handleToggleCameraFacing = async () => {
    const nextFacing = settings.cameraFacing === 'user' ? 'environment' : 'user';
    setSettings((prev) => ({ ...prev, cameraFacing: nextFacing }));
    await initCamera(nextFacing);
  };

  // Shop actions
  const handleBuyBlade = (blade: BladeStyle) => {
    if (coins >= blade.price && !unlockedBladeIds.includes(blade.id)) {
      setCoins((c) => c - blade.price);
      setUnlockedBladeIds((prev) => [...prev, blade.id]);
      setActiveBladeId(blade.id);
      soundEngine.playPowerup();
    }
  };

  const handleSelectBlade = (blade: BladeStyle) => {
    setActiveBladeId(blade.id);
    soundEngine.playSwoosh(1.5);
  };

  // Reset high scores
  const handleResetRecords = () => {
    const empty = { classic: 0, time_attack: 0, zen: 0, bomb_rush: 0, fruit_rain: 0 };
    setHighScores(empty);
    setCoins(50);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-[#0B0B12] text-white flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Background AR Video Feed */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${
          isCameraActive ? 'opacity-80' : 'opacity-10'
        } ${settings.cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
      />

      {/* Cyber AR Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#42E8FF_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none z-0" />

      {/* Top Header Status Bar */}
      <div className="absolute top-2 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {/* Left: Camera Status & Facing Toggle */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-camera-quick"
            onClick={handleToggleCameraFacing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all cursor-pointer ${
              isCameraActive
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-red-500/20 border-red-400/40 text-red-300 hover:bg-red-500/30'
            }`}
            title="Alternar Câmera Frontal / Traseira"
          >
            {isCameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-arcade">
              {isCameraActive ? (settings.cameraFacing === 'user' ? 'Frontal' : 'Traseira') : 'Câmera Off'}
            </span>
          </button>

          <button
            id="btn-switch-facing-header"
            onClick={handleToggleCameraFacing}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
            title="Inverter Câmera"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Fullscreen Toggle */}
        <button
          id="btn-toggle-fullscreen"
          onClick={toggleFullscreen}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
          title="Tela Cheia"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* High-Performance 60 FPS Canvas */}
      <GameCanvas
        engineRef={gameEngineRef}
        trackerRef={handTrackerRef}
        activeBlade={activeBlade}
        width={dimensions.width}
        height={dimensions.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Instant Start Banner Animation */}
      {startBanner && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-in fade-in zoom-in-75 duration-200">
          <div className="flex flex-col items-center">
            <span className="font-arcade text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D71] via-[#FFD23F] to-[#42E8FF] drop-shadow-[0_0_30px_rgba(255,61,113,0.9)] animate-pulse">
              SLASH! ⚔️
            </span>
            <span className="text-xs sm:text-sm font-arcade uppercase tracking-widest text-white/80 mt-2 bg-black/50 px-4 py-1 rounded-full border border-white/10">
              Mova a mão ou arraste na tela!
            </span>
          </div>
        </div>
      )}

      {/* Active Game HUD */}
      {gameState === 'playing' && (
        <GameHUD
          score={hudState.score}
          lives={hudState.lives}
          maxLives={hudState.maxLives}
          combo={hudState.combo}
          comboTimer={hudState.comboTimer}
          mode={gameMode}
          timeRemaining={hudState.timeRemaining}
          frenzyActive={hudState.frenzyActive}
          frenzyTimer={hudState.frenzyTimer}
          freezeActive={hudState.freezeActive}
          freezeTimer={hudState.freezeTimer}
          coins={hudState.coinsEarned}
          handConfidence={hudState.handConfidence}
          onPause={() => setGameState('paused')}
        />
      )}

      {/* Home Menu */}
      {gameState === 'menu' && (
        <HomeScreen
          selectedMode={gameMode}
          onSelectMode={(m) => setGameMode(m)}
          highScore={highScores[gameMode] || 0}
          coins={coins}
          activeBlade={activeBlade}
          onStartCalibration={() => setGameState('calibration')}
          onDirectPlay={() => startGame(gameMode)}
          onOpenShop={() => setGameState('shop')}
          onOpenSettings={() => setGameState('settings')}
          onOpenExpoGuide={() => setGameState('expo_guide')}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={() => startGame(gameMode)}
          onHome={() => setGameState('menu')}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          score={lastGameOverStats.score}
          highScore={lastGameOverStats.highScore}
          isNewRecord={lastGameOverStats.isNewRecord}
          cutsCount={lastGameOverStats.cutsCount}
          bombsHit={lastGameOverStats.bombsHit}
          maxCombo={lastGameOverStats.maxCombo}
          accuracy={lastGameOverStats.accuracy}
          coinsEarned={lastGameOverStats.coinsEarned}
          onRestart={() => startGame(gameMode)}
          onHome={() => setGameState('menu')}
        />
      )}

      {/* Calibration Modal */}
      {gameState === 'calibration' && (
        <CalibrationModal
          handConfidence={hudState.handConfidence}
          lightLevel={lightLevel}
          cameraFacing={settings.cameraFacing}
          sensitivity={settings.sensitivity}
          onSwitchCamera={handleToggleCameraFacing}
          onSetSensitivity={(val) => setSettings((s) => ({ ...s, sensitivity: val }))}
          onStartGame={() => startGame(gameMode)}
          onClose={() => setGameState('menu')}
        />
      )}

      {/* Resilient 3-2-1 Countdown Overlay with Instant Skip */}
      {gameState === 'countdown' && (
        <CountdownOverlay
          onComplete={() => {
            gameEngineRef.current.reset(gameMode);
            handTrackerRef.current.clearTrail();
            setGameState('playing');
            setStartBanner(true);
            soundEngine.playSwoosh(1.8);
            setTimeout(() => setStartBanner(false), 1000);
          }}
        />
      )}

      {/* Blade Shop Modal */}
      {gameState === 'shop' && (
        <ShopModal
          coins={coins}
          unlockedBladeIds={unlockedBladeIds}
          activeBladeId={activeBladeId}
          onSelectBlade={handleSelectBlade}
          onBuyBlade={handleBuyBlade}
          onClose={() => setGameState('menu')}
        />
      )}

      {/* Settings Modal */}
      {gameState === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
          onResetRecords={handleResetRecords}
          onClose={() => setGameState('menu')}
        />
      )}

      {/* Expo Go & Framework Integration Guide */}
      {gameState === 'expo_guide' && (
        <ExpoGuideModal onClose={() => setGameState('menu')} />
      )}
    </div>
  );
}
