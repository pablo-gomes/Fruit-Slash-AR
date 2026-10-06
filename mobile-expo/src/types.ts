export type GameMode = 'classic' | 'time_attack' | 'bomb_rush' | 'zen';

export type GameState = 'menu' | 'countdown' | 'playing' | 'paused' | 'gameover' | 'shop';

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

export interface FruitHalves {
  x1: number;
  y1: number;
  vx1: number;
  vy1: number;
  rot1: number;
  vRot1: number;
  x2: number;
  y2: number;
  vx2: number;
  vy2: number;
  rot2: number;
  vRot2: number;
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
  rotation: number;
  vRot: number;
  sliced: boolean;
  sliceAngle: number;
  sliceTime: number;
  halves?: FruitHalves;
}

export interface JuiceParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  scale: number;
  life: number;
}

export interface BladePoint {
  x: number;
  y: number;
  timestamp: number;
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
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  cutsCount: number;
  bombsHit: number;
  coinsEarned: number;
  timeSurvived: number;
}
