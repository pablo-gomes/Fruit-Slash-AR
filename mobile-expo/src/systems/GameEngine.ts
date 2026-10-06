import * as Haptics from 'expo-haptics';
import { 
  GameMode, 
  FruitType, 
  SpawnedObject, 
  JuiceParticle, 
  FloatingText, 
  BladePoint,
  FruitHalves
} from '../types';
import { FRUIT_CONFIGS } from '../data/fruits';

export class GameEngine {
  public mode: GameMode = 'classic';
  public objects: SpawnedObject[] = [];
  public particles: JuiceParticle[] = [];
  public floatingTexts: FloatingText[] = [];

  public score: number = 0;
  public lives: number = 3;
  public maxLives: number = 3;
  public combo: number = 1;
  public maxComboAchieved: number = 1;
  public comboExpireTimer: number = 0;
  public comboWindowMs: number = 420;
  public lastCutTime: number = 0;
  public currentSlashCuts: number = 0;

  public frenzyActive: boolean = false;
  public frenzyTimer: number = 0;
  public freezeTimer: number = 0;
  public timeRemaining: number = 60;
  public cutsCount: number = 0;
  public bombsHit: number = 0;
  public missedCount: number = 0;
  public isGameOver: boolean = false;
  public coinsEarned: number = 0;
  public screenShake: number = 0;

  private spawnTimer: number = 0;
  private spawnInterval: number = 1.3;
  private elapsedGameTime: number = 0;

  public width: number = 390;
  public height: number = 844;

  constructor() {
    this.reset('classic');
  }

  public setDimensions(w: number, h: number) {
    this.width = Math.max(300, w);
    this.height = Math.max(500, h);
  }

  public reset(mode: GameMode = 'classic') {
    this.mode = mode;
    this.objects = [];
    this.particles = [];
    this.floatingTexts = [];
    this.score = 0;
    this.lives = mode === 'bomb_rush' ? 1 : mode === 'zen' ? 999 : 3;
    this.maxLives = this.lives;
    this.combo = 1;
    this.maxComboAchieved = 1;
    this.comboExpireTimer = 0;
    this.lastCutTime = 0;
    this.currentSlashCuts = 0;
    this.frenzyActive = false;
    this.frenzyTimer = 0;
    this.freezeTimer = 0;
    this.timeRemaining = mode === 'time_attack' ? 60 : mode === 'zen' ? 90 : 0;
    this.cutsCount = 0;
    this.bombsHit = 0;
    this.missedCount = 0;
    this.isGameOver = false;
    this.coinsEarned = 0;
    this.screenShake = 0;
    this.spawnTimer = 0.5;
    this.elapsedGameTime = 0;
  }

  public update(dt: number): void {
    if (this.isGameOver) return;

    this.elapsedGameTime += dt;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    if (this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - dt);
    }

    const timeScale = this.freezeTimer > 0 ? 0.45 : 1.0;
    const effectiveDt = dt * timeScale;

    // Timed mode decrements
    if (this.mode === 'time_attack' || this.mode === 'zen') {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.endGame();
        return;
      }
    }

    // Frenzy timer
    if (this.frenzyActive) {
      this.frenzyTimer -= dt;
      if (this.frenzyTimer <= 0) {
        this.frenzyActive = false;
      }
    }

    // Combo expiration
    if (this.comboExpireTimer > 0) {
      this.comboExpireTimer -= dt * 1000;
      if (this.comboExpireTimer <= 0) {
        this.combo = 1;
        this.currentSlashCuts = 0;
      }
    }

    // Spawning logic
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnWave();
      const baseInterval = this.frenzyActive ? 0.65 : Math.max(0.85, 1.4 - this.elapsedGameTime * 0.008);
      this.spawnInterval = baseInterval;
      this.spawnTimer = this.spawnInterval;
    }

    // Physics update for objects
    const gravity = 850 * (this.height / 800);

    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];

      if (!obj.sliced) {
        obj.vy += gravity * effectiveDt;
        obj.x += obj.vx * effectiveDt;
        obj.y += obj.vy * effectiveDt;
        obj.rotation += obj.vRot * effectiveDt;

        // Remove if fallen below screen
        if (obj.y > this.height + 80 && obj.vy > 0) {
          if (!obj.isBomb && this.mode === 'classic') {
            this.lives -= 1;
            this.missedCount++;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            this.addFloatingText('PERDIDA! -1 ❤️', Math.min(Math.max(obj.x, 80), this.width - 80), this.height - 100, '#FF334B');
            if (this.lives <= 0) {
              this.endGame();
            }
          }
          this.objects.splice(i, 1);
          continue;
        }
      } else if (obj.halves) {
        // Halves physics
        obj.halves.vy1 += gravity * 1.1 * effectiveDt;
        obj.halves.vy2 += gravity * 1.1 * effectiveDt;
        obj.halves.x1 += obj.halves.vx1 * effectiveDt;
        obj.halves.y1 += obj.halves.vy1 * effectiveDt;
        obj.halves.x2 += obj.halves.vx2 * effectiveDt;
        obj.halves.y2 += obj.halves.vy2 * effectiveDt;
        obj.halves.rot1 += obj.halves.vRot1 * effectiveDt;
        obj.halves.rot2 += obj.halves.vRot2 * effectiveDt;

        if (obj.halves.y1 > this.height + 100 && obj.halves.y2 > this.height + 100) {
          this.objects.splice(i, 1);
          continue;
        }
      }
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 450 * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 0.8);

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private spawnWave() {
    const count = this.frenzyActive 
      ? Math.floor(Math.random() * 3) + 3 
      : Math.floor(Math.random() * 2) + (this.mode === 'bomb_rush' ? 2 : 1);

    for (let i = 0; i < count; i++) {
      this.spawnSingle();
    }
  }

  private spawnSingle() {
    const keys = Object.keys(FRUIT_CONFIGS);
    const standardFruits = keys.filter(k => !FRUIT_CONFIGS[k].isBomb && !FRUIT_CONFIGS[k].isSpecial);

    let chosenType: FruitType;
    const bombProb = this.mode === 'zen' ? 0 : this.mode === 'bomb_rush' ? 0.38 : 0.16;

    if (Math.random() < bombProb) {
      chosenType = 'bomb';
    } else if (Math.random() < 0.08) {
      // Specials
      const specials: FruitType[] = ['golden', 'freeze'];
      if (this.lives < this.maxLives && this.mode === 'classic') specials.push('heart');
      chosenType = specials[Math.floor(Math.random() * specials.length)];
    } else {
      chosenType = standardFruits[Math.floor(Math.random() * standardFruits.length)] as FruitType;
    }

    const cfg = FRUIT_CONFIGS[chosenType];
    const spawnMargin = 50;
    const spawnX = spawnMargin + Math.random() * (this.width - spawnMargin * 2);
    const spawnY = this.height + 40;

    // Launch trajectory towards center
    const targetX = this.width * 0.2 + Math.random() * (this.width * 0.6);
    const vx = (targetX - spawnX) * (1.1 + Math.random() * 0.4);
    
    // Launch height reaches upper 60-80% of screen
    const peakY = this.height * (0.18 + Math.random() * 0.25);
    const gravity = 850 * (this.height / 800);
    const vy = -Math.sqrt(2 * gravity * (spawnY - peakY)) * cfg.speedMultiplier;

    this.objects.push({
      id: Math.random().toString(36).substring(2, 9),
      type: chosenType,
      name: cfg.name,
      emoji: cfg.emoji,
      x: spawnX,
      y: spawnY,
      vx,
      vy,
      radius: cfg.radius,
      points: cfg.points,
      color: cfg.color,
      juiceColor: cfg.juiceColor,
      isBomb: !!cfg.isBomb,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 5,
      sliced: false,
      sliceAngle: 0,
      sliceTime: 0,
    });
  }

  public checkSlice(p1: BladePoint, p2: BladePoint): void {
    if (this.isGameOver) return;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const slashDist = Math.sqrt(dx * dx + dy * dy);
    if (slashDist < 10) return;

    const slashAngle = Math.atan2(dy, dx);
    const now = Date.now();

    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      if (obj.sliced) continue;

      // Distance from circle center to line segment
      const dist = this.distToSegment(obj.x, obj.y, p1.x, p2.x, p1.y, p2.y);

      if (dist <= obj.radius * 1.15) {
        this.sliceObject(obj, slashAngle, now);
      }
    }
  }

  private sliceObject(obj: SpawnedObject, angle: number, now: number) {
    obj.sliced = true;
    obj.sliceAngle = angle;
    obj.sliceTime = now;

    // Normal to slice for separation
    const normal = angle + Math.PI / 2;
    const splitSpeed = 220;

    obj.halves = {
      x1: obj.x,
      y1: obj.y,
      vx1: obj.vx + Math.cos(normal) * splitSpeed,
      vy1: obj.vy + Math.sin(normal) * splitSpeed - 40,
      rot1: obj.rotation,
      vRot1: -4,
      x2: obj.x,
      y2: obj.y,
      vx2: obj.vx - Math.cos(normal) * splitSpeed,
      vy2: obj.vy - Math.sin(normal) * splitSpeed - 40,
      rot2: obj.rotation,
      vRot2: 4,
    };

    if (obj.isBomb) {
      // Bomb exploded!
      this.bombsHit++;
      this.screenShake = 18;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      this.spawnExplosion(obj.x, obj.y);
      this.addFloatingText('BOOM! 💥', obj.x, obj.y, '#FF2E4D');

      if (this.mode === 'bomb_rush') {
        this.lives = 0;
        this.endGame();
      } else if (this.mode === 'classic') {
        this.lives -= 1;
        if (this.lives <= 0) {
          this.endGame();
        }
      }
      return;
    }

    // Fruit sliced!
    this.cutsCount++;
    this.coinsEarned += 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Combo system
    if (now - this.lastCutTime < this.comboWindowMs) {
      this.combo = Math.min(8, this.combo + 1);
      this.currentSlashCuts++;
    } else {
      this.combo = 1;
      this.currentSlashCuts = 1;
    }
    this.lastCutTime = now;
    this.comboExpireTimer = this.comboWindowMs;

    if (this.combo > this.maxComboAchieved) {
      this.maxComboAchieved = this.combo;
    }

    // Special effects
    if (obj.type === 'freeze') {
      this.freezeTimer = 4.0;
      this.addFloatingText('CONGELOU! ❄️', obj.x, obj.y, '#00D2FC');
    } else if (obj.type === 'heart') {
      this.lives = Math.min(this.maxLives, this.lives + 1);
      this.addFloatingText('+1 ❤️', obj.x, obj.y, '#FF1493');
    } else if (obj.type === 'golden') {
      this.frenzyActive = true;
      this.frenzyTimer = 4.5;
      this.addFloatingText('FRENESI! 🌟', obj.x, obj.y, '#FFD700');
    }

    // Points calculation
    const earnedPoints = obj.points * this.combo;
    this.score += earnedPoints;

    // Splatter particles
    this.spawnJuice(obj.x, obj.y, obj.juiceColor);

    // Floating score text
    const textStr = this.combo > 1 ? `+${earnedPoints} (x${this.combo})` : `+${earnedPoints}`;
    this.addFloatingText(textStr, obj.x, obj.y, obj.color);
  }

  private spawnJuice(x: number, y: number, color: string) {
    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 240;
      const life = 0.4 + Math.random() * 0.4;
      this.particles.push({
        id: Math.random().toString(36).substring(2, 8),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color,
        radius: 3 + Math.random() * 5,
        alpha: 1,
        life,
        maxLife: life,
      });
    }
  }

  private spawnExplosion(x: number, y: number) {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 320;
      const life = 0.5 + Math.random() * 0.5;
      this.particles.push({
        id: Math.random().toString(36).substring(2, 8),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? '#FF3D00' : '#FFD600',
        radius: 4 + Math.random() * 7,
        alpha: 1,
        life,
        maxLife: life,
      });
    }
  }

  private addFloatingText(text: string, x: number, y: number, color: string) {
    this.floatingTexts.push({
      id: Math.random().toString(36).substring(2, 8),
      text,
      x,
      y,
      vy: -110,
      color,
      alpha: 1,
      scale: 1,
      life: 0.85,
    });
  }

  private distToSegment(px: number, py: number, x1: number, x2: number, y1: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  private endGame() {
    this.isGameOver = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }
}
