export type GameMode = 'classic' | 'time_attack' | 'bomb_rush' | 'fruit_rain' | 'zen';

export type GameState = 
  | 'menu' 
  | 'calibration' 
  | 'countdown' 
  | 'playing' 
  | 'paused' 
  | 'gameover' 
  | 'settings' 
  | 'shop' 
  | 'challenges' 
  | 'expo_guide';

export type FruitType = 
  | 'apple' 
  | 'orange' 
  | 'watermelon' 
  | 'banana' 
  | 'strawberry' 
  | 'kiwi' 
  | 'pineapple' 
  | 'golden' 
  | 'heart' 
  | 'freeze' 
  | 'bomb';

export interface FruitConfig {
  type: FruitType;
  name: string;
  emoji: string;
  points: number;
  radius: number;
  color: string;
  juiceColor: string;
  speedMultiplier: number;
  isBomb?: boolean;
  isSpecial?: boolean;
}

export interface SpawnedObject {
  id: string;
  type: FruitType;
  name: string;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  points: number;
  color: string;
  juiceColor: string;
  isBomb: boolean;
  isDisguisedBomb?: boolean;
  rotation: number;
  vRot: number;
  sliced: boolean;
  sliceAngle: number;
  sliceTime: number;
  halves?: {
    x1: number;
    y1: number;
    vx1: number;
    vy1: number;
    rot1: number;
    x2: number;
    y2: number;
    vx2: number;
    vy2: number;
    rot2: number;
  };
}

export interface BladePoint {
  x: number;
  y: number;
  time: number;
  speed: number;
}

export interface JuiceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  alpha: number;
  vy: number;
}

export interface BladeStyle {
  id: string;
  name: string;
  description: string;
  color: string;
  glowColor: string;
  particleColor: string;
  price: number;
  unlocked: boolean;
  gradient: string[];
}

export interface GameStats {
  score: number;
  highScore: number;
  highScoresByMode: Record<GameMode, number>;
  coins: number;
  cutsCount: number;
  missedCount: number;
  bombsHit: number;
  maxCombo: number;
  multiCuts: number;
  accuracy: number;
  level: number;
  xp: number;
}

export interface GameSettings {
  sfxVolume: number;
  musicVolume: number;
  vibration: boolean;
  sensitivity: number;
  cameraFacing: 'user' | 'environment';
  controlMode: 'camera_hand' | 'touch_mouse';
  showHandDebug: boolean;
  quality: 'high' | 'normal';
}
