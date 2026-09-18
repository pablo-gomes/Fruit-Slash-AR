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
  private isPalmValidated: boolean = false;
  private bodyPartDetected: 'palm' | 'head_face' | 'torso_body' | 'none' = 'none';

  // Per-frame computation cache (prevents redundant calculation and zero-delta frame corruption)
  private lastProcessTimestamp: number = 0;
  private cachedTrackingFrame: TrackingFrame | null = null;
  private lastVideoCurrentTime: number = -1;

  private isRunning: boolean = false;
  private stream: MediaStream | null = null;
  public cameraFacing: 'user' | 'environment' = 'user';
  public sensitivity: number = 1.0;
  public controlMode: 'camera_hand' | 'touch_mouse' = 'camera_hand';

  // Trajectory history for blade trail
  private bladePoints: BladePoint[] = [];
  private maxTrailLength: number = 26;
  private maxTrailAge: number = 220; // milliseconds

  // Grid dimensions for clustering hand motion (16x12 grid = 192 cells)
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
        // Try ideal resolution first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch {
        // Fallback for mobile devices that dislike explicit width/height
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
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
      this.lastVideoCurrentTime = -1;
      this.prevFrameData = null;
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
    this.currentSpeed = 1.4;
    this.confidence = 1.0;
    this.isHandFound = true;
    this.isPalmValidated = true;
    this.bodyPartDetected = 'palm';
    this.bladePoints.push({ x, y, time: now, speed: 1.4 });
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

    // Smooth trail point insertion
    const minSlashSpeed = 0.16 / this.sensitivity;
    if (speed >= minSlashSpeed || this.bladePoints.length > 0) {
      this.bladePoints.push({ x, y, time: now, speed: Math.max(0.8, speed) });
    }
    this.cachedTrackingFrame = null;
  }

  /**
   * Process camera frame with Head/Torso-Rejection, Universal Chrominance,
   * and Stutter-Free Frame Caching
   */
  public processFrame(viewWidth: number, viewHeight: number): TrackingFrame {
    const now = performance.now();

    // 1. Stutter-Prevention Cache:
    // If called multiple times within the same rendering cycle (< 12ms),
    // return cached tracking frame to avoid CPU thrashing and zero-delta frame corruption!
    if (this.cachedTrackingFrame && (now - this.lastProcessTimestamp < 12)) {
      this.pruneTrail(now);
      return this.cachedTrackingFrame;
    }

    // 2. Fallback if camera is off, in touch mode, or video not yet ready
    if (
      this.controlMode === 'touch_mouse' || 
      !this.isRunning || 
      !this.video || 
      this.video.readyState < 2 || 
      !this.procCtx
    ) {
      this.pruneTrail(now);
      const res: TrackingFrame = {
        x: this.smoothedX || viewWidth / 2,
        y: this.smoothedY || viewHeight / 2,
        isSlashing: this.isPalmValidated && this.currentSpeed >= 0.20 / this.sensitivity,
        speed: this.currentSpeed,
        confidence: this.confidence,
        lightLevel: this.lightLevel,
        isHandFound: this.isHandFound,
        isPalmValidated: this.isPalmValidated,
        bodyPartDetected: this.bodyPartDetected,
      };
      this.lastProcessTimestamp = now;
      this.cachedTrackingFrame = res;
      return res;
    }

    // 3. 30fps-Webcam on 60Hz/120Hz Monitor Sync:
    // If webcam video currentTime has not advanced since last processed frame,
    // the video frame is identical. Re-sampling now would produce zero delta!
    if (this.video.currentTime === this.lastVideoCurrentTime && this.cachedTrackingFrame) {
      this.pruneTrail(now);
      this.lastProcessTimestamp = now;
      return this.cachedTrackingFrame;
    }
    this.lastVideoCurrentTime = this.video.currentTime;

    const w = this.procCanvas.width;
    const h = this.procCanvas.height;

    // Draw downsampled video frame
    try {
      this.procCtx.drawImage(this.video, 0, 0, w, h);
    } catch {
      this.pruneTrail(now);
      return {
        x: this.smoothedX,
        y: this.smoothedY,
        isSlashing: false,
        speed: 0,
        confidence: 0,
        lightLevel: 0.5,
        isHandFound: false,
        isPalmValidated: false,
        bodyPartDetected: 'none',
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
    let activeCellCount = 0;

    let totalMotionPixels = 0;
    let skinMinX = w;
    let skinMaxX = 0;
    let skinMinY = h;
    let skinMaxY = 0;

    // Dynamically scaled motion threshold according to sensitivity
    const motionThreshold = Math.max(14, Math.min(30, 20 / this.sensitivity));

    if (this.prevFrameData) {
      const prev = this.prevFrameData;
      const step = 4 * 2; // sample alternate pixels for smooth 60fps performance without CPU spikes

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

          if (px < skinMinX) skinMinX = px;
          if (px > skinMaxX) skinMaxX = px;
          if (py < skinMinY) skinMinY = py;
          if (py > skinMaxY) skinMaxY = py;

          // Universal Chrominance Analysis:
          // Robust across Fitzpatrick skin types I through VI and cool/warm room lighting
          const sum = r + g + b;
          const nr = sum > 0 ? r / sum : 0;
          const ng = sum > 0 ? g / sum : 0;

          const isSkinTone = (
            sum >= 40 && sum <= 740 &&
            nr >= 0.31 && nr <= 0.64 &&
            ng >= 0.22 && ng <= 0.42 &&
            r >= b * 0.82
          );

          // Skin tones get priority weight, but rapid motion from hands in gloves/sleeves is also supported
          const motionWeight = isSkinTone ? 1.7 : 1.0;

          const col = Math.min(gridCols - 1, Math.floor(px / cellW));
          const row = Math.min(gridRows - 1, Math.floor(py / cellH));
          const cellIdx = row * gridCols + col;

          const score = motionDiff * motionWeight;
          if (gridScores[cellIdx] === 0) activeCellCount++;
          gridScores[cellIdx] += score;
          gridX[cellIdx] += px * score;
          gridY[cellIdx] += py * score;
        }
      }

      this.lightLevel = totalBrightness / ((data.length / (4 * 2)) * 255);
    }

    // Retain current frame for subsequent delta
    this.prevFrameData = new Uint8ClampedArray(data);

    // Find the primary moving hand cell cluster
    let maxScore = 0;
    let maxCellIdx = -1;

    for (let c = 0; c < gridScores.length; c++) {
      if (gridScores[c] > maxScore) {
        maxScore = gridScores[c];
        maxCellIdx = c;
      }
    }

    // Detect if valid movement exists
    const minRequiredScore = 120 / this.sensitivity;
    if (maxScore > minRequiredScore && maxCellIdx >= 0 && totalMotionPixels >= 10) {
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
        let rawTargetX = clusterX / clusterScore;
        const rawTargetY = clusterY / clusterScore;

        const clusterWidth = Math.max(1, skinMaxX - skinMinX);
        const clusterHeight = Math.max(1, skinMaxY - skinMinY);
        const clusterAspectRatio = clusterWidth / clusterHeight;

        // Mirror horizontal coordinate in selfie mode
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

        // 4. Biometric Distinction: Palm vs Head vs Whole-Body
        // Whole body movement causes widespread motion over > 50% of the entire grid
        const isWholeBodyMotion = (
          activeCellCount > (gridCols * gridRows * 0.52) ||
          totalMotionPixels > 1100 ||
          (clusterHeight > h * 0.72 && clusterWidth > w * 0.65)
        );

        // A face/head sits in the upper-center and is SLOW-MOVING (< 0.20 px/ms)
        const isSlowHeadPresence = (
          this.cameraFacing === 'user' &&
          rawTargetY < h * 0.42 &&
          rawTargetX > w * 0.25 &&
          rawTargetX < w * 0.75 &&
          instantSpeed < 0.20
        );

        // A palm has localized, agile movement
        const isPalmCluster = (
          !isWholeBodyMotion &&
          !isSlowHeadPresence &&
          totalMotionPixels >= 10 &&
          clusterAspectRatio >= 0.25 &&
          clusterAspectRatio <= 3.8
        );

        if (isWholeBodyMotion) {
          this.bodyPartDetected = 'torso_body';
          this.isPalmValidated = false;
        } else if (isSlowHeadPresence) {
          this.bodyPartDetected = 'head_face';
          this.isPalmValidated = false;
        } else if (isPalmCluster) {
          this.bodyPartDetected = 'palm';
          this.isPalmValidated = true;
        } else {
          this.bodyPartDetected = 'none';
          this.isPalmValidated = false;
        }

        // Responsive, low-latency smoothing
        // When slashing fast, alpha goes up to 0.68 for zero-lag precision
        const alpha = Math.min(0.68, 0.28 + 0.32 * Math.min(1.0, instantSpeed / 1.2)) * Math.min(1.8, this.sensitivity);

        this.smoothedX += rawDx * alpha;
        this.smoothedY += rawDy * alpha;

        const dx = this.smoothedX - this.lastX;
        const dy = this.smoothedY - this.lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const filteredSpeed = dist / dt;

        this.lastX = this.smoothedX;
        this.lastY = this.smoothedY;
        this.lastTime = now;
        this.currentSpeed = this.currentSpeed * 0.5 + filteredSpeed * 0.5;
        this.confidence = this.isPalmValidated ? Math.min(1.0, clusterScore / 1100) : 0.25;
        this.isHandFound = this.isPalmValidated;

        // Register slash trail points - fluid and agile
        const minSlashSpeed = 0.18 / this.sensitivity;
        if (this.isPalmValidated && this.currentSpeed >= minSlashSpeed) {
          this.bladePoints.push({
            x: this.smoothedX,
            y: this.smoothedY,
            time: now,
            speed: this.currentSpeed,
          });
        }
      }
    } else {
      // Natural decay when motionless
      this.currentSpeed *= 0.85;
      this.confidence *= 0.88;
      if (this.confidence < 0.1) {
        this.isHandFound = false;
        this.isPalmValidated = false;
        this.bodyPartDetected = 'none';
      }
    }

    this.pruneTrail(now);

    const resultFrame: TrackingFrame = {
      x: this.smoothedX,
      y: this.smoothedY,
      isSlashing: this.isPalmValidated && this.currentSpeed >= 0.18 / this.sensitivity,
      speed: this.currentSpeed,
      confidence: this.confidence,
      lightLevel: this.lightLevel,
      isHandFound: this.isHandFound,
      isPalmValidated: this.isPalmValidated,
      bodyPartDetected: this.bodyPartDetected,
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
