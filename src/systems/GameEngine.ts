import { 
  GameMode, 
  FruitType, 
  SpawnedObject, 
  JuiceParticle, 
  FloatingText, 
  BladePoint,
  BladeStyle
} from '../types';
import { FRUIT_CONFIGS } from '../data/fruits';
import { soundEngine } from './SoundEngine';

// Varied yellow fruit types for the bonus frenzy mode
const YELLOW_FRUIT_VARIANTS = [
  { name: 'Estrela Dourada', emoji: '🌟', color: '#FFD700', juiceColor: '#FFF380' },
  { name: 'Banana Dourada', emoji: '🍌', color: '#FFDE59', juiceColor: '#FFF7B2' },
  { name: 'Abacaxi Dourado', emoji: '🍍', color: '#FFC107', juiceColor: '#FFE082' },
  { name: 'Limão Siciliano', emoji: '🍋', color: '#FFEE55', juiceColor: '#FFF9A6' },
  { name: 'Manga Dourada', emoji: '🥭', color: '#FFB300', juiceColor: '#FFE57F' },
];

export interface GameStateData {
  score: number;
  lives: number;
  maxLives: number;
  combo: number;
  maxComboAchieved: number;
  comboTimer: number; // 0 to 1 ratio
  frenzyActive: boolean;
  frenzyTimer: number; // seconds remaining
  timeRemaining: number; // for time_attack
  cutsCount: number;
  bombsHit: number;
  missedCount: number;
  multiCutsCount: number;
  isGameOver: boolean;
  coinsEarned: number;
  screenShake: number;
  freezeTimer: number;
}

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
  public comboWindowMs: number = 380;
  public lastCutTime: number = 0;
  public currentSlashCuts: number = 0;

  public frenzyActive: boolean = false;
  public frenzyTimer: number = 0;
  public frenzyMaxTime: number = 4.0; // Shorter, intense bonus rush (user requested)

  public freezeTimer: number = 0;
  public timeRemaining: number = 60; // for time_attack
  public cutsCount: number = 0;
  public bombsHit: number = 0;
  public missedCount: number = 0;
  public multiCutsCount: number = 0;
  public isGameOver: boolean = false;
  public coinsEarned: number = 0;
  public screenShake: number = 0;

  private spawnTimer: number = 0;
  private spawnInterval: number = 1.4; // seconds
  private elapsedGameTime: number = 0;

  public width: number = 800;
  public height: number = 600;

  constructor() {
    this.reset('classic');
  }

  public setDimensions(w: number, h: number) {
    this.width = Math.max(300, w);
    this.height = Math.max(400, h);
  }

  public reset(mode: GameMode = 'classic') {
    this.mode = mode;
    this.objects = [];
    this.particles = [];
    this.floatingTexts = [];
    this.score = 0;
    this.lives = mode === 'bomb_rush' ? 1 : 3;
    this.maxLives = this.lives;
    this.combo = 1;
    this.maxComboAchieved = 1;
    this.comboExpireTimer = 0;
    this.lastCutTime = 0;
    this.currentSlashCuts = 0;
    this.frenzyActive = false;
    this.frenzyTimer = 0;
    this.freezeTimer = 0;
    this.timeRemaining = mode === 'time_attack' ? 60 : 0;
    this.cutsCount = 0;
    this.bombsHit = 0;
    this.missedCount = 0;
    this.multiCutsCount = 0;
    this.isGameOver = false;
    this.coinsEarned = 0;
    this.screenShake = 0;
    this.spawnTimer = 0.05; // Instant first spawn
    this.spawnInterval = mode === 'fruit_rain' ? 0.6 : 1.4;
    this.elapsedGameTime = 0;
    soundEngine.stopFrenzyMusic();

    // Instant launch on start so the player immediately sees fruits!
    this.spawnSingleObject(Math.random(), 0, 1);
  }

  public update(dtSeconds: number, bladeTrail: BladePoint[], activeBlade: BladeStyle) {
    if (this.isGameOver) {
      this.updateParticles(dtSeconds);
      return;
    }

    this.elapsedGameTime += dtSeconds;

    // Time attack countdown
    if (this.mode === 'time_attack') {
      this.timeRemaining -= dtSeconds;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.triggerGameOver('Tempo esgotado!');
        return;
      }
    }

    // Freeze timer update
    if (this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - dtSeconds);
    }
    const timeScale = this.freezeTimer > 0 ? 0.35 : 1.0;

    // Frenzy mode timer update
    if (this.frenzyActive) {
      this.frenzyTimer -= dtSeconds;
      if (this.frenzyTimer <= 0) {
        this.frenzyActive = false;
        this.frenzyTimer = 0;
        soundEngine.stopFrenzyMusic();
        this.addFloatingText('FRENZY ACABOU', this.width / 2, this.height * 0.35, '#FF3D71', 1.4);
      }
    }

    // Combo expiration timer
    if (this.combo > 1) {
      this.comboExpireTimer -= dtSeconds;
      if (this.comboExpireTimer <= 0) {
        this.combo = 1;
        this.comboExpireTimer = 0;
      }
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dtSeconds * 30);
    }

    // Spawner
    this.spawnTimer -= dtSeconds;
    if (this.spawnTimer <= 0) {
      this.spawnBatch();
      // Adjust interval based on frenzy & mode
      let baseInterval = this.mode === 'fruit_rain' ? 0.5 : 1.3 - Math.min(0.6, this.elapsedGameTime * 0.008);
      if (this.frenzyActive) baseInterval *= 0.45;
      this.spawnTimer = Math.max(0.35, baseInterval);
    }

    // Update object physics & collisions
    this.updateObjects(dtSeconds * timeScale, bladeTrail, activeBlade);

    // Update particle physics
    this.updateParticles(dtSeconds);

    // Update floating score text
    this.updateFloatingTexts(dtSeconds);
  }

  private spawnBatch() {
    const patternRoll = Math.random();
    // In frenzy mode, spawn huge bursts
    const count = this.frenzyActive 
      ? Math.floor(Math.random() * 3) + 3 
      : this.mode === 'fruit_rain' 
        ? Math.floor(Math.random() * 2) + 2 
        : Math.random() < 0.35 ? 2 : 1;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.isGameOver) {
          this.spawnSingleObject(patternRoll, i, count);
        }
      }, i * 160);
    }
  }

  public getScreenScale(): number {
    // Responsive scale based on viewport:
    // Small mobile (360x640) -> ~0.85
    // Tablet / laptop (1024x768) -> ~1.15
    // Desktop 1080p (1920x1080) -> ~1.5
    // Large TV / 4K (3840x2160) -> ~2.2
    const diag = Math.sqrt(this.width * this.width + this.height * this.height);
    const baseDiag = 1000; // sqrt(800^2 + 600^2)
    const ratio = diag / baseDiag;
    return Math.max(0.75, Math.min(2.3, ratio));
  }

  private spawnSingleObject(pattern: number, index: number, totalInBatch: number) {
    // Select object type
    let type: FruitType = 'apple';
    let isDisguisedBomb = false;
    let customVariant: { name: string; emoji: string; color: string; juiceColor: string } | null = null;

    if (this.frenzyActive) {
      // Frenzy Bonus Mode: Yellow fruits flood the screen with sneaky disguised bombs mixed in!
      type = 'golden';
      customVariant = YELLOW_FRUIT_VARIANTS[Math.floor(Math.random() * YELLOW_FRUIT_VARIANTS.length)];

      // Disguised bomb roll: ~24% chance unless in zen mode (user requested disguised bombs in bonus mode)
      if (this.mode !== 'zen' && Math.random() < 0.24) {
        isDisguisedBomb = true;
      }
    } else {
      const isBombRush = this.mode === 'bomb_rush';
      const bombChance = this.mode === 'zen' ? 0 : isBombRush ? 0.45 : 0.18;

      if (Math.random() < bombChance) {
        type = 'bomb';
      } else {
        const fruitTypes: FruitType[] = ['apple', 'orange', 'watermelon', 'banana', 'strawberry', 'kiwi', 'pineapple'];
        const specialRoll = Math.random();
        if (specialRoll < 0.06) {
          type = 'golden';
        } else if (specialRoll < 0.10 && this.lives < this.maxLives && this.mode === 'classic') {
          type = 'heart';
        } else if (specialRoll < 0.14) {
          type = 'freeze';
        } else {
          type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        }
      }
    }

    const cfg = FRUIT_CONFIGS[type];
    const scale = this.getScreenScale();
    const scaledRadius = Math.round(cfg.radius * scale);
    const margin = Math.max(25, Math.min(scaledRadius * 1.5, this.width * 0.12));
    
    // Calculate spawn X and trajectory based on pattern
    let startX = margin + Math.random() * Math.max(80, this.width - margin * 2);
    let vx = (Math.random() - 0.5) * 180 * scale;

    if (totalInBatch > 1) {
      // Coordinated pattern across screen width
      const usableW = Math.max(100, this.width - margin * 2);
      const step = usableW / (totalInBatch + 1);
      startX = margin + step * (index + 1) + (Math.random() - 0.5) * 20 * scale;
      // Incline towards center
      vx = (this.width / 2 - startX) * 0.4 + (Math.random() - 0.5) * 50 * scale;
    }

    const startY = this.height + scaledRadius + 10;
    // Launch velocity: scaled dynamically with screen height so fruits have consistent airtime
    const targetApexY = this.height * (0.16 + Math.random() * 0.30);
    const gravity = Math.max(650, this.height * 1.15); // px/s^2 proportional to viewport height
    const heightDiff = Math.max(80, startY - targetApexY);
    const launchVy = -Math.sqrt(2 * gravity * heightDiff) * (cfg.speedMultiplier || 1.0);

    const isBomb = isDisguisedBomb ? true : !!cfg.isBomb;
    const objName = isDisguisedBomb ? 'Bomba Disfarçada' : (customVariant ? customVariant.name : cfg.name);
    const objEmoji = customVariant ? customVariant.emoji : cfg.emoji;
    const objColor = customVariant ? customVariant.color : cfg.color;
    const objJuiceColor = isDisguisedBomb ? '#FF3D71' : (customVariant ? customVariant.juiceColor : cfg.juiceColor);

    const obj: SpawnedObject = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      name: objName,
      emoji: objEmoji,
      x: startX,
      y: startY,
      vx,
      vy: launchVy,
      radius: scaledRadius,
      points: isDisguisedBomb ? 0 : cfg.points,
      color: objColor,
      juiceColor: objJuiceColor,
      isBomb,
      isDisguisedBomb,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 5.0,
      sliced: false,
      sliceAngle: 0,
      sliceTime: 0,
    };

    // Only play audible siren on standard bombs, keeping disguised bombs stealthy
    if (obj.isBomb && !isDisguisedBomb) {
      soundEngine.playBombWarning();
    }

    this.objects.push(obj);
  }

  private updateObjects(dt: number, bladeTrail: BladePoint[], activeBlade: BladeStyle) {
    const gravity = Math.max(650, this.height * 1.15);

    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];

      if (!obj.sliced) {
        // Physics update
        obj.x += obj.vx * dt;
        obj.y += obj.vy * dt;
        obj.vy += gravity * dt;
        obj.rotation += obj.vRot * dt;

        // Collision check against blade trail
        if (bladeTrail.length >= 2) {
          this.checkBladeCollision(obj, bladeTrail, activeBlade);
        }

        // Check if object dropped below screen
        if (obj.y > this.height + obj.radius * 2 && obj.vy > 0) {
          if (!obj.isBomb && !obj.type.includes('golden') && !obj.type.includes('heart')) {
            this.missedCount++;
            this.combo = 1;
          }
          this.objects.splice(i, 1);
        }
      } else {
        // Sliced halves physics
        if (obj.halves) {
          const h = obj.halves;
          h.x1 += h.vx1 * dt;
          h.y1 += h.vy1 * dt;
          h.vy1 += gravity * 1.2 * dt;
          h.rot1 += 4.5 * dt;

          h.x2 += h.vx2 * dt;
          h.y2 += h.vy2 * dt;
          h.vy2 += gravity * 1.2 * dt;
          h.rot2 -= 4.5 * dt;
        }

        // Remove sliced fruit after 1.2 seconds
        if (performance.now() - obj.sliceTime > 1200) {
          this.objects.splice(i, 1);
        }
      }
    }
  }

  private checkBladeCollision(obj: SpawnedObject, trail: BladePoint[], activeBlade: BladeStyle) {
    // Check segment by segment in recent blade trail
    for (let i = 0; i < trail.length - 1; i++) {
      const p1 = trail[i];
      const p2 = trail[i + 1];

      // Calculate distance from circle center to segment p1-p2
      const dist = this.distToSegment(obj.x, obj.y, p1.x, p1.y, p2.x, p2.y);

      if (dist <= obj.radius * 1.08) {
        // Cut hit!
        const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        this.sliceObject(obj, sliceAngle, p2.speed || 1, activeBlade);
        break;
      }
    }
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  public sliceObject(obj: SpawnedObject, sliceAngle: number, slashSpeed: number, activeBlade: BladeStyle) {
    if (obj.sliced) return;

    const now = performance.now();
    obj.sliced = true;
    obj.sliceAngle = sliceAngle;
    obj.sliceTime = now;

    // Check if it's a bomb
    if (obj.isBomb) {
      this.handleBombCut(obj);
      return;
    }

    // Normal fruit or special fruit cut!
    this.cutsCount++;

    // Multi-cut & combo detection (Section 11, 55, 56)
    if (now - this.lastCutTime < this.comboWindowMs) {
      this.currentSlashCuts++;
    } else {
      this.currentSlashCuts = 1;
    }
    this.lastCutTime = now;

    // Increase combo
    if (this.currentSlashCuts >= 2) {
      this.multiCutsCount++;
      const bonusMultiplier = this.currentSlashCuts >= 3 ? 3 : 2;
      this.combo = Math.min(20, this.combo + bonusMultiplier);
    } else {
      this.combo = Math.min(20, this.combo + 1);
    }

    if (this.combo > this.maxComboAchieved) {
      this.maxComboAchieved = this.combo;
    }

    // Reset combo decay timer (2.8 seconds of grace period)
    this.comboExpireTimer = 2.8;

    // Check for Frenzy activation (Combo 10+, Section 12)
    if (this.combo >= 10 && !this.frenzyActive) {
      this.activateFrenzyMode();
    }

    // Points calculation (Section 53 & 54)
    const basePoints = obj.points;
    const speedBonus = slashSpeed > 1.2 ? 10 : 0;
    const comboMulti = Math.max(1, Math.floor(this.combo / 2));
    const totalGained = (basePoints * comboMulti) + speedBonus;

    this.score += totalGained;
    this.coinsEarned += Math.max(1, Math.floor(totalGained / 25));

    // Sound effect
    soundEngine.playSlice(obj.type, this.currentSlashCuts);
    if (this.combo > 1 && this.combo % 3 === 0) {
      soundEngine.playCombo(this.combo);
    }

    // Handle special fruits
    if (obj.type === 'heart') {
      this.lives = Math.min(this.maxLives, this.lives + 1);
      soundEngine.playPowerup();
      this.addFloatingText('+1 VIDA!', obj.x, obj.y - 30, '#FF1493', 1.4);
    } else if (obj.type === 'freeze') {
      this.freezeTimer = 4.0;
      soundEngine.playFreeze();
      this.addFloatingText('FREEZE! ❄️', obj.x, obj.y - 30, '#00D2FC', 1.4);
    } else if (obj.type === 'golden') {
      soundEngine.playPowerup();
      this.addFloatingText(`🌟 +${totalGained}!`, obj.x, obj.y - 30, '#FFD700', 1.5);
    } else {
      // Floating points
      let text = `+${totalGained}`;
      if (this.currentSlashCuts === 2) text += ' (MULTI)';
      else if (this.currentSlashCuts >= 3) text = `TRIPLE SLASH! +${totalGained}`;
      this.addFloatingText(text, obj.x, obj.y - 20, activeBlade.color, this.currentSlashCuts >= 2 ? 1.3 : 1.1);
    }

    // Create split halves that fly perpendicular to slice cut
    const perpAngle = sliceAngle + Math.PI / 2;
    const separationSpeed = 160 + Math.random() * 80;

    obj.halves = {
      x1: obj.x - Math.cos(perpAngle) * (obj.radius * 0.4),
      y1: obj.y - Math.sin(perpAngle) * (obj.radius * 0.4),
      vx1: obj.vx - Math.cos(perpAngle) * separationSpeed,
      vy1: obj.vy - Math.sin(perpAngle) * separationSpeed * 0.5 - 60,
      rot1: obj.rotation,

      x2: obj.x + Math.cos(perpAngle) * (obj.radius * 0.4),
      y2: obj.y + Math.sin(perpAngle) * (obj.radius * 0.4),
      vx2: obj.vx + Math.cos(perpAngle) * separationSpeed,
      vy2: obj.vy + Math.sin(perpAngle) * separationSpeed * 0.5 - 60,
      rot2: obj.rotation,
    };

    // Burst juice particles matching fruit color and blade glow
    this.createJuiceSplatter(obj.x, obj.y, obj.juiceColor, activeBlade.particleColor, sliceAngle);
  }

  private handleBombCut(obj: SpawnedObject) {
    this.bombsHit++;
    this.combo = 1;
    this.screenShake = 18;
    soundEngine.playExplosion();

    // Create fiery explosion particles
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 320;
      this.particles.push({
        x: obj.x,
        y: obj.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() < 0.5 ? '#FF3333' : '#FFD23F',
        size: 5 + Math.random() * 7,
        alpha: 1.0,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }

    if (obj.isDisguisedBomb) {
      this.addFloatingText('⚠️ BOMBA DISFARÇADA! -1 VIDA', obj.x, obj.y - 40, '#FF3333', 1.8);
    } else {
      this.addFloatingText('BOOM! -1 VIDA', obj.x, obj.y - 40, '#FF3333', 1.6);
    }

    this.lives--;
    if (this.lives <= 0) {
      this.triggerGameOver(obj.isDisguisedBomb ? 'Caiu na bomba disfarçada!' : 'Bomba atingida!');
    }
  }

  public activateFrenzyMode() {
    this.frenzyActive = true;
    this.frenzyTimer = this.frenzyMaxTime;
    this.screenShake = 8;
    soundEngine.startFrenzyMusic();
    soundEngine.playCombo(10);
    this.addFloatingText('🔥 BÔNUS AMARELO! CUIDADO! 🔥', this.width / 2, this.height * 0.3, '#FFD23F', 2.0);
  }

  private createJuiceSplatter(x: number, y: number, juiceColor: string, bladeColor: string, sliceAngle: number) {
    const scale = this.getScreenScale();
    const particleCount = Math.round(20 * Math.min(1.5, scale));
    for (let i = 0; i < particleCount; i++) {
      // Particles spray outward along cut angle
      const spread = (Math.random() - 0.5) * 1.8;
      const angle = (Math.random() < 0.5 ? sliceAngle + Math.PI / 2 : sliceAngle - Math.PI / 2) + spread;
      const speed = (80 + Math.random() * 240) * scale;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 15 * scale,
        y: y + (Math.random() - 0.5) * 15 * scale,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50 * scale,
        color: Math.random() < 0.75 ? juiceColor : bladeColor,
        size: (3 + Math.random() * 6) * scale,
        alpha: 1.0,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 450 * dt; // gravity
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private addFloatingText(text: string, x: number, y: number, color: string, scale: number) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x: Math.max(80, Math.min(this.width - 80, x)),
      y,
      color,
      scale,
      alpha: 1.0,
      vy: -90,
    });
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.4;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public triggerGameOver(reason?: string) {
    this.isGameOver = true;
    soundEngine.playGameOver();
    if (reason) {
      this.addFloatingText(reason, this.width / 2, this.height * 0.45, '#FF3D71', 1.8);
    }
  }

  public getAccuracy(): number {
    const totalAttempts = this.cutsCount + this.missedCount + this.bombsHit;
    if (totalAttempts === 0) return 100;
    return Math.round((this.cutsCount / totalAttempts) * 100);
  }
}
