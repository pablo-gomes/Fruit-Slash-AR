import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  PanResponder, 
  StatusBar, 
  Text, 
  TouchableOpacity 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

import { GameMode, GameState, BladePoint, GameStats } from './src/types';
import { BLADE_STYLES } from './src/data/fruits';
import { GameEngine } from './src/systems/GameEngine';
import { BladeTrail } from './src/components/BladeTrail';
import { FruitRenderer } from './src/components/FruitRenderer';
import { GameHUD } from './src/components/GameHUD';
import { HomeScreen } from './src/components/HomeScreen';
import { ShopModal } from './src/components/ShopModal';
import { GameOverModal } from './src/components/GameOverModal';
import { PauseModal } from './src/components/PauseModal';
import { CountdownOverlay } from './src/components/CountdownOverlay';

const STORAGE_KEYS = {
  HIGH_SCORES: 'fruit_slash_ar_high_scores',
  COINS: 'fruit_slash_ar_coins',
  BLADES: 'fruit_slash_ar_blades',
  ACTIVE_BLADE: 'fruit_slash_ar_active_blade',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('classic');

  // Persistence
  const [highScores, setHighScores] = useState<Record<GameMode, number>>({
    classic: 0,
    time_attack: 0,
    bomb_rush: 0,
    zen: 0,
  });
  const [coins, setCoins] = useState<number>(60);
  const [unlockedBladeIds, setUnlockedBladeIds] = useState<string[]>(['katana']);
  const [activeBladeId, setActiveBladeId] = useState<string>('katana');

  // Engine & UI state
  const engineRef = useRef<GameEngine>(new GameEngine());
  const [bladeTrail, setBladeTrail] = useState<BladePoint[]>([]);
  const trailRef = useRef<BladePoint[]>([]);
  const [, setRenderTrigger] = useState<number>(0);
  const [finalStats, setFinalStats] = useState<GameStats>({
    score: 0,
    combo: 1,
    maxCombo: 1,
    cutsCount: 0,
    bombsHit: 0,
    coinsEarned: 0,
    timeSurvived: 0,
  });
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Initialize engine screen dimensions
  useEffect(() => {
    engineRef.current.setDimensions(SCREEN_WIDTH, SCREEN_HEIGHT);
  }, []);

  // Load saved data from storage
  useEffect(() => {
    const loadStorage = async () => {
      try {
        const [savedScores, savedCoins, savedBlades, savedActive] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.HIGH_SCORES),
          AsyncStorage.getItem(STORAGE_KEYS.COINS),
          AsyncStorage.getItem(STORAGE_KEYS.BLADES),
          AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_BLADE),
        ]);

        if (savedScores) setHighScores(JSON.parse(savedScores));
        if (savedCoins) setCoins(parseInt(savedCoins, 10));
        if (savedBlades) setUnlockedBladeIds(JSON.parse(savedBlades));
        if (savedActive) setActiveBladeId(savedActive);
      } catch (err) {
        console.warn('Erro ao carregar dados salvos:', err);
      }
    };
    loadStorage();
  }, []);

  // Request camera permissions if active
  const handleToggleCamera = useCallback(async () => {
    if (!isCameraActive && !permission?.granted) {
      const res = await requestPermission();
      if (res?.granted) {
        setIsCameraActive(true);
      }
    } else {
      setIsCameraActive(prev => !prev);
    }
  }, [isCameraActive, permission, requestPermission]);

  // Active blade object
  const bladesWithState = BLADE_STYLES.map(b => ({
    ...b,
    unlocked: unlockedBladeIds.includes(b.id),
  }));
  const activeBlade = bladesWithState.find(b => b.id === activeBladeId) || bladesWithState[0];

  // Blade selection / purchase
  const handleSelectBlade = useCallback(async (bladeId: string) => {
    setActiveBladeId(bladeId);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_BLADE, bladeId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const handleBuyBlade = useCallback(async (blade: typeof BLADE_STYLES[0]) => {
    if (coins >= blade.price && !unlockedBladeIds.includes(blade.id)) {
      const newCoins = coins - blade.price;
      const newUnlocked = [...unlockedBladeIds, blade.id];
      setCoins(newCoins);
      setUnlockedBladeIds(newUnlocked);
      setActiveBladeId(blade.id);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.COINS, newCoins.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.BLADES, JSON.stringify(newUnlocked)),
        AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_BLADE, blade.id),
      ]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [coins, unlockedBladeIds]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const engine = engineRef.current;
      engine.update(dt);

      // Clean old trail points
      const validTrail = trailRef.current.filter(p => now - p.timestamp < 180);
      trailRef.current = validTrail;
      setBladeTrail([...validTrail]);

      // Check game over
      if (engine.isGameOver) {
        const stats: GameStats = {
          score: engine.score,
          combo: engine.combo,
          maxCombo: engine.maxComboAchieved,
          cutsCount: engine.cutsCount,
          bombsHit: engine.bombsHit,
          coinsEarned: engine.coinsEarned,
          timeSurvived: 0,
        };
        setFinalStats(stats);

        // Update High Score & Coins
        const currentHigh = highScores[gameMode] || 0;
        const isNewHigh = engine.score > currentHigh;
        setIsNewHighScore(isNewHigh);

        const updatedCoins = coins + engine.coinsEarned;
        setCoins(updatedCoins);
        AsyncStorage.setItem(STORAGE_KEYS.COINS, updatedCoins.toString());

        if (isNewHigh) {
          const newHighScores = { ...highScores, [gameMode]: engine.score };
          setHighScores(newHighScores);
          AsyncStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(newHighScores));
        }

        setGameState('gameover');
        return;
      }

      setRenderTrigger(now);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, gameMode, coins, highScores]);

  // Touch PanResponder for swipe slashing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const pt: BladePoint = { x: locationX, y: locationY, timestamp: Date.now() };
        trailRef.current = [pt];
        setBladeTrail([pt]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const now = Date.now();
        const pt: BladePoint = { x: locationX, y: locationY, timestamp: now };
        
        const prev = trailRef.current[trailRef.current.length - 1];
        if (prev) {
          engineRef.current.checkSlice(prev, pt);
        }

        trailRef.current.push(pt);
        if (trailRef.current.length > 14) {
          trailRef.current.shift();
        }
      },
      onPanResponderRelease: () => {
        setTimeout(() => {
          trailRef.current = [];
          setBladeTrail([]);
        }, 120);
      },
    })
  ).current;

  // Game control handlers
  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('countdown');
  };

  const handleCountdownFinished = () => {
    engineRef.current.reset(gameMode);
    setGameState('playing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  const handleRestart = () => {
    engineRef.current.reset(gameMode);
    setGameState('playing');
  };

  const handleGoHome = () => {
    setGameState('menu');
  };

  const engine = engineRef.current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* AR Camera View or Dojo Background */}
      {isCameraActive && permission?.granted ? (
        <CameraView 
          style={StyleSheet.absoluteFill} 
          facing="back"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.dojoBackground]} />
      )}

      {/* Camera permission prompt button if camera requested but not granted */}
      {isCameraActive && !permission?.granted && (
        <View style={styles.permissionBar}>
          <Text style={styles.permText}>Acesso à câmera necessário para o modo AR</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Ativar Câmera</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Interactive Touch Layer & Fruit/Blade Canvas */}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        {/* Render Fruits & Splatters */}
        <FruitRenderer
          objects={engine.objects}
          particles={engine.particles}
          floatingTexts={engine.floatingTexts}
          freezeActive={engine.freezeTimer > 0}
          frenzyActive={engine.frenzyActive}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
        />

        {/* Render Blade Slash Trail */}
        <BladeTrail
          trail={bladeTrail}
          blade={activeBlade}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
        />
      </View>

      {/* HUD during active play */}
      {gameState === 'playing' && (
        <GameHUD
          score={engine.score}
          lives={engine.lives}
          maxLives={engine.maxLives}
          combo={engine.combo}
          mode={gameMode}
          timeRemaining={engine.timeRemaining}
          isCameraActive={isCameraActive && !!permission?.granted}
          onToggleCamera={handleToggleCamera}
          onPause={() => setGameState('paused')}
        />
      )}

      {/* Home Screen */}
      {gameState === 'menu' && (
        <HomeScreen
          onStartGame={handleStartGame}
          onOpenShop={() => setGameState('shop')}
          selectedMode={gameMode}
          onSelectMode={setGameMode}
          highScore={highScores[gameMode] || 0}
          coins={coins}
          isCameraActive={isCameraActive && !!permission?.granted}
          onToggleCamera={handleToggleCamera}
        />
      )}

      {/* Countdown overlay */}
      {gameState === 'countdown' && (
        <CountdownOverlay onComplete={handleCountdownFinished} />
      )}

      {/* Shop Modal */}
      {gameState === 'shop' && (
        <ShopModal
          blades={bladesWithState}
          activeBladeId={activeBladeId}
          coins={coins}
          onSelectBlade={handleSelectBlade}
          onBuyBlade={handleBuyBlade}
          onClose={() => setGameState('menu')}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={handleRestart}
          onGoHome={handleGoHome}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={finalStats}
          isNewHighScore={isNewHighScore}
          onRestart={handleRestart}
          onGoHome={handleGoHome}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A14',
  },
  dojoBackground: {
    backgroundColor: '#0F0E1A',
  },
  permissionBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(20, 20, 35, 0.92)',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99,
    borderWidth: 1,
    borderColor: '#42E8FF',
  },
  permText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  permBtn: {
    backgroundColor: '#42E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permBtnText: {
    color: '#0A0A14',
    fontWeight: '800',
    fontSize: 12,
  },
});
