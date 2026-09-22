import { BladePoint } from '../types';

export interface TrackingFrame {
  x: number;
  y: number;
  isSlashing: boolean;
  speed: number;
  confidence: number;
  lightLevel: number;
  isHandFound: boolean;
  isPalmValidated: boolean;
  bodyPartDetected?: 'palm' | 'head_face' | 'torso_body' | 'none';
}

export class HandTracker {
  private video: HTMLVideoElement | null = null;
  private procCanvas: HTMLCanvasElement;
  private procCtx: CanvasRenderingContext2D | null;
  private prevFrameData: Uint8ClampedArray | null = null;

  // Smoothed hand position
  private lastX: number = 0;
  private lastY: number = 0;
  private lastTime: number = 0;
  private smoothedX: number = 0;
  private smoothedY: number = 0;
  private currentSpeed: number = 0;
  private confidence: number = 0;
  private lightLevel: number = 0.5;
  private isHandFound: boolean = false;
  private isPalmValidated: boolean = true;
  private bodyPartDetected: 'palm' | 'head_face' | 'torso_body' | 'none' = 'palm';

  // Per-frame computation cache (prevents redundant calculation in tight animation loops)
  private lastProcessTimestamp: number = 0;
  private cachedTrackingFrame: TrackingFrame | null = null;

  private isRunning: boolean = false;
  private stream: MediaStream | null = null;
  public cameraFacing: 'user' | 'environment' = 'user';
  public sensitivity: number = 1.0;
  public controlMode: 'camera_hand' | 'touch_mouse' = 'camera_hand';

  // Trajectory history for blade trail
  private bladePoints: BladePoint[] = [];
  private maxTrailLength: number = 28;
  private maxTrailAge: number = 240; // milliseconds

  // Grid dimensions for clustering motion (16x12 grid = 192 cells)
  private readonly gridCols = 16;
  private readonly gridRows = 12;

  constructor() {
    this.procCanvas = document.createElement('canvas');
    this.procCanvas.width = 160;
    this.procCanvas.height = 120;
    this.procCtx = this.procCanvas.getContext('2d', { willReadFrequently: true });
  }

  public setVideoElement(video: HTMLVideoElement) {
    this.video = video;
    if (this.video) {
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.setAttribute('playsinline', 'true');
      this.video.setAttribute('webkit-playsinline', 'true');
    }
  }

  /**
   * Resumes video stream if paused by browser power-saving or autoplay policy
   */
  public ensureVideoPlaying() {
    if (this.video && this.video.paused && this.isRunning) {
      this.video.play().catch(() => {});
    }
  }

  public async startCamera(facing: 'user' | 'environment' = 'user'): Promise<{ success: boolean; error?: string }> {
    this.cameraFacing = facing;
    this.stopCamera();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { success: false, error: 'Câmera não suportada neste dispositivo.' };
    }

    try {
      let stream: MediaStream;
      try {
        // High compatibility: ideal resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch {
        try {
          // Fallback with facingMode only
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        } catch {
          // Final universal fallback for any camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      this.stream = stream;
      if (this.video) {
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.setAttribute('playsinline', 'true');
        this.video.setAttribute('webkit-playsinline', 'true');
        this.video.srcObject = this.stream;

        const tryPlay = async () => {
          try {
            await this.video?.play();
          } catch {
            // Autoplay policy: will resume on first user interaction
          }
        };

        this.video.onloadedmetadata = () => tryPlay();
        await tryPlay();
      }
      this.isRunning = true;
      this.prevFrameData = null;
      this.cachedTrackingFrame = null;
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao acessar câmera.';
      return { success: false, error: errorMsg };
    }
  }

  public stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.isRunning = false;
    this.prevFrameData = null;
    this.cachedTrackingFrame = null;
    this.isHandFound = false;
  }

  public switchFacing(): Promise<{ success: boolean; error?: string }> {
    const nextFacing = this.cameraFacing === 'user' ? 'environment' : 'user';
    return this.startCamera(nextFacing);
  }

  /**
   * Inject manual touch or swipe for mobile or mouse testing
   */
  public startManualStroke(x: number, y: number) {
    const now = performance.now();
    this.lastX = x;
    this.lastY = y;
    this.smoothedX = x;
    this.smoothedY = y;
    this.lastTime = now;
    this.currentSpeed = 1.6;
    this.confidence = 1.0;
    this.isHandFound = true;
    this.isPalmValidated = true;
    this.bodyPartDetected = 'palm';
    this.bladePoints.push({ x, y, time: now, speed: 1.6 });
    this.cachedTrackingFrame = null;
  }

  public addManualPoint(x: number, y: number) {
    const now = performance.now();
    if (!this.lastTime || now - this.lastTime > 250) {
      this.startManualStroke(x, y);
      return;
    }

    const dt = Math.max(1, now - this.lastTime);
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = dist / dt;

    this.lastX = x;
    this.lastY = y;
    this.smoothedX = x;
    this.smoothedY = y;
    this.lastTime = now;
    this.currentSpeed = speed;
    this.confidence = 1.0;
    this.isHandFound = true;
    this.isPalmValidated = true;
    this.bodyPartDetected = 'palm';

    this.bladePoints.push({ x, y, time: now, speed: Math.max(1.0, speed) });
    this.cachedTrackingFrame = null;
  }

  /**
   * Process camera frame with universal gesture recognition and fluid 60fps tracking
   */
  public processFrame(viewWidth: number, viewHeight: number): TrackingFrame {
    const now = performance.now();

    // 1. Throttling: If called within < 8ms in the same animation cycle,
    // return cached tracking frame to avoid CPU thrashing
    if (this.cachedTrackingFrame && (now - this.lastProcessTimestamp < 8)) {
      this.pruneTrail(now);
      return this.cachedTrackingFrame;
    }

    // 2. Fallback if camera is off, in touch mode, or video not yet ready
    if (
      this.controlMode === 'touch_mouse' || 
      !this.isRunning || 
      !this.video || 
      (this.video.readyState < 2 && this.video.currentTime === 0) || 
      !this.procCtx
    ) {
      this.pruneTrail(now);
      const res: TrackingFrame = {
        x: this.smoothedX || viewWidth / 2,
        y: this.smoothedY || viewHeight / 2,
        isSlashing: this.currentSpeed >= 0.10 / this.sensitivity,
        speed: this.currentSpeed,
        confidence: this.confidence,
        lightLevel: this.lightLevel,
        isHandFound: this.isHandFound,
        isPalmValidated: true,
        bodyPartDetected: 'palm',
      };
      this.lastProcessTimestamp = now;
      this.cachedTrackingFrame = res;
      return res;
    }

    const w = this.procCanvas.width;
    const h = this.procCanvas.height;

    // Draw downsampled video frame
    try {
      this.procCtx.drawImage(this.video, 0, 0, w, h);
    } catch {
      this.pruneTrail(now);
      return {
        x: this.smoothedX || viewWidth / 2,
        y: this.smoothedY || viewHeight / 2,
        isSlashing: false,
        speed: 0,
        confidence: 0,
        lightLevel: 0.5,
        isHandFound: false,
        isPalmValidated: true,
        bodyPartDetected: 'palm',
      };
    }

    const frame = this.procCtx.getImageData(0, 0, w, h);
    const data = frame.data;

    let totalBrightness = 0;
    const gridCols = this.gridCols;
    const gridRows = this.gridRows;
    const cellW = w / gridCols;
    const cellH = h / gridRows;

    // Spatial motion grids
    const gridScores = new Float32Array(gridCols * gridRows);
    const gridX = new Float32Array(gridCols * gridRows);
    const gridY = new Float32Array(gridCols * gridRows);

    let totalMotionPixels = 0;

    // Highly responsive motion threshold to detect all hand gestures
    const motionThreshold = Math.max(8, Math.min(20, 13 / this.sensitivity));

    if (this.prevFrameData) {
      const prev = this.prevFrameData;
      const step = 4 * 2; // sample alternate pixels for smooth 60fps performance without frame drops

      for (let i = 0; i < data.length; i += step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const pr = prev[i];
        const pg = prev[i + 1];
        const pb = prev[i + 2];

        totalBrightness += (r + g + b) / 3;

        // Temporal RGB channel difference
        const motionDiff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);

        if (motionDiff > motionThreshold) {
          totalMotionPixels++;

          const pixelIdx = i / 4;
          const px = pixelIdx % w;
          const py = Math.floor(pixelIdx / w);

          const col = Math.min(gridCols - 1, Math.floor(px / cellW));
          const row = Math.min(gridRows - 1, Math.floor(py / cellH));
          const cellIdx = row * gridCols + col;

          gridScores[cellIdx] += motionDiff;
          gridX[cellIdx] += px * motionDiff;
          gridY[cellIdx] += py * motionDiff;
        }
      }

      this.lightLevel = totalBrightness / ((data.length / (4 * 2)) * 255);
    }

    // Retain current frame for subsequent delta
    this.prevFrameData = new Uint8ClampedArray(data);

    // Find the primary moving gesture cell cluster
    let maxScore = 0;
    let maxCellIdx = -1;

    for (let c = 0; c < gridScores.length; c++) {
      if (gridScores[c] > maxScore) {
        maxScore = gridScores[c];
        maxCellIdx = c;
      }
    }

    // Capture any hand gesture (low threshold so chops, fists, swipes, or waves register instantly)
    const minRequiredScore = Math.max(25, 50 / this.sensitivity);
    if (maxScore > minRequiredScore && maxCellIdx >= 0 && totalMotionPixels >= 4) {
      const bestCol = maxCellIdx % gridCols;
      const bestRow = Math.floor(maxCellIdx / gridCols);

      // Smooth 3x3 centroid calculation around peak motion cell
      let clusterScore = 0;
      let clusterX = 0;
      let clusterY = 0;

      for (let dr = -1; dr <= 1; dr++) {
        const nr = bestRow + dr;
        if (nr < 0 || nr >= gridRows) continue;
        for (let dc = -1; dc <= 1; dc++) {
          const nc = bestCol + dc;
          if (nc < 0 || nc >= gridCols) continue;
          const idx = nr * gridCols + nc;
          clusterScore += gridScores[idx];
          clusterX += gridX[idx];
          clusterY += gridY[idx];
        }
      }

      if (clusterScore > 0) {
        const rawTargetX = clusterX / clusterScore;
        const rawTargetY = clusterY / clusterScore;

        // Mirror horizontal coordinate in selfie camera mode
        let displayRawX = rawTargetX;
        if (this.cameraFacing === 'user') {
          displayRawX = w - displayRawX;
        }

        // Map to game canvas viewport
        const targetX = (displayRawX / w) * viewWidth;
        const targetY = (rawTargetY / h) * viewHeight;

        // First frame initialization
        if (this.smoothedX === 0 && this.smoothedY === 0) {
          this.smoothedX = targetX;
          this.smoothedY = targetY;
          this.lastX = targetX;
          this.lastY = targetY;
          this.lastTime = now;
        }

        const dt = this.lastTime ? Math.max(1, now - this.lastTime) : 16;
        const rawDx = targetX - this.smoothedX;
        const rawDy = targetY - this.smoothedY;
        const rawDist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
        const instantSpeed = rawDist / dt;

        // Low-latency smoothing:
        // Slashing fast -> high alpha (up to 0.75) for instant cuts with any gesture
        const alpha = Math.min(0.75, 0.32 + 0.38 * Math.min(1.0, instantSpeed / 1.0)) * Math.min(1.8, this.sensitivity);

        this.smoothedX += rawDx * alpha;
        this.smoothedY += rawDy * alpha;

        const dx = this.smoothedX - this.lastX;
        const dy = this.smoothedY - this.lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const filteredSpeed = dist / dt;

        this.lastX = this.smoothedX;
        this.lastY = this.smoothedY;
        this.lastTime = now;
        this.currentSpeed = this.currentSpeed * 0.45 + filteredSpeed * 0.55;
        this.confidence = Math.min(1.0, clusterScore / 700);
        this.isHandFound = true;
        this.isPalmValidated = true;
        this.bodyPartDetected = 'palm';

        // Register slash trail points for ANY gesture
        const minSlashSpeed = 0.09 / this.sensitivity;
        if (this.currentSpeed >= minSlashSpeed || instantSpeed >= minSlashSpeed) {
          this.bladePoints.push({
            x: this.smoothedX,
            y: this.smoothedY,
            time: now,
            speed: Math.max(1.0, this.currentSpeed),
          });
        }
      }
    } else {
      // Natural decay when motionless
      this.currentSpeed *= 0.85;
      this.confidence *= 0.88;
      if (this.confidence < 0.1) {
        this.isHandFound = false;
      }
    }

    this.pruneTrail(now);

    const isSlashing = this.currentSpeed >= (0.09 / this.sensitivity) || this.bladePoints.length > 0;

    const resultFrame: TrackingFrame = {
      x: this.smoothedX || viewWidth / 2,
      y: this.smoothedY || viewHeight / 2,
      isSlashing,
      speed: this.currentSpeed,
      confidence: this.confidence,
      lightLevel: this.lightLevel,
      isHandFound: this.isHandFound,
      isPalmValidated: true,
      bodyPartDetected: 'palm',
    };

    this.lastProcessTimestamp = now;
    this.cachedTrackingFrame = resultFrame;

    return resultFrame;
  }

  private pruneTrail(now: number) {
    this.bladePoints = this.bladePoints.filter(p => now - p.time < this.maxTrailAge);
    if (this.bladePoints.length > this.maxTrailLength) {
      this.bladePoints.splice(0, this.bladePoints.length - this.maxTrailLength);
    }
  }

  public getBladeTrail(): BladePoint[] {
    return this.bladePoints;
  }

  public clearTrail() {
    this.bladePoints = [];
    this.currentSpeed = 0;
    this.cachedTrackingFrame = null;
  }
}
