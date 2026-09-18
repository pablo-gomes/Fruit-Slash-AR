import { BladePoint } from '../types';

export interface TrackingFrame {
  x: number;
  y: number;
  isSlashing: boolean;
  speed: number;
  confidence: number;
  lightLevel: number;
  isHandFound: boolean;
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

  private isRunning: boolean = false;
  private stream: MediaStream | null = null;
  public cameraFacing: 'user' | 'environment' = 'user';
  public sensitivity: number = 1.0;
  public controlMode: 'camera_hand' | 'touch_mouse' = 'camera_hand';

  // Trajectory history for blade trail
  private bladePoints: BladePoint[] = [];
  private maxTrailLength: number = 22;
  private maxTrailAge: number = 190; // milliseconds

  // Grid dimensions for clustering hand motion (16x12 grid)
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
      this.video.setAttribute('playsinline', 'true');
      this.video.setAttribute('webkit-playsinline', 'true');
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
        this.video.setAttribute('playsinline', 'true');
        this.video.setAttribute('webkit-playsinline', 'true');
        this.video.srcObject = this.stream;
        try {
          await this.video.play();
        } catch {
          // In some mobile browsers, play() resolves on first user touch
        }
      }
      this.isRunning = true;
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
    this.bladePoints.push({ x, y, time: now, speed: 1.4 });
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

    // Smooth trail point insertion
    const minSlashSpeed = 0.22 / this.sensitivity;
    if (speed >= minSlashSpeed || this.bladePoints.length > 0) {
      this.bladePoints.push({ x, y, time: now, speed: Math.max(0.8, speed) });
    }
  }

  /**
   * Process camera frame with Head-Rejection and Hand-Specific Clustering
   */
  public processFrame(viewWidth: number, viewHeight: number): TrackingFrame {
    const now = performance.now();

    // Fallback if camera is off, loading, or in touch mode
    if (
      this.controlMode === 'touch_mouse' || 
      !this.isRunning || 
      !this.video || 
      this.video.readyState < 2 || 
      !this.procCtx
    ) {
      this.pruneTrail(now);
      return {
        x: this.smoothedX || viewWidth / 2,
        y: this.smoothedY || viewHeight / 2,
        isSlashing: this.currentSpeed >= 0.38 / this.sensitivity,
        speed: this.currentSpeed,
        confidence: this.confidence,
        lightLevel: this.lightLevel,
        isHandFound: this.isHandFound,
      };
    }

    const w = this.procCanvas.width;
    const h = this.procCanvas.height;

    // Downsampled video frame
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
      };
    }

    const frame = this.procCtx.getImageData(0, 0, w, h);
    const data = frame.data;

    let totalBrightness = 0;
    const gridCols = this.gridCols;
    const gridRows = this.gridRows;
    const cellW = w / gridCols;
    const cellH = h / gridRows;

    // Accumulate skin motion scores in a spatial grid
    const gridScores = new Float32Array(gridCols * gridRows);
    const gridX = new Float32Array(gridCols * gridRows);
    const gridY = new Float32Array(gridCols * gridRows);

    if (this.prevFrameData) {
      const prev = this.prevFrameData;
      const step = 4 * 2; // sample alternate pixels for 60fps performance

      for (let i = 0; i < data.length; i += step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const pr = prev[i];
        const pg = prev[i + 1];
        const pb = prev[i + 2];

        totalBrightness += (r + g + b) / 3;

        // Temporal motion difference
        const motionDiff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);

        if (motionDiff > 30) {
          // Precise skin-chrominance test
          const sum = r + g + b;
          const isSkin = (
            r > 70 && g > 38 && b > 20 &&
            r > g && g > b * 0.9 &&
            (r - g) > 10 &&
            sum > 140 && sum < 690 &&
            (r / sum) > 0.35 && (r / sum) < 0.58 &&
            (g / sum) > 0.25 && (g / sum) < 0.38
          );

          if (isSkin) {
            const pixelIdx = i / 4;
            const px = pixelIdx % w;
            const py = Math.floor(pixelIdx / w);

            // Spatial head-suppression filter:
            // When using the selfie camera, the user's face is centered in the upper-middle frame.
            // We penalize the static face region to prevent the cursor from jumping to the nose/forehead.
            let facePenalty = 1.0;
            if (this.cameraFacing === 'user') {
              const relX = px / w;
              const relY = py / h;
              const inFaceZone = (relX > 0.26 && relX < 0.74 && relY < 0.46);
              if (inFaceZone) {
                facePenalty = 0.12; // 88% attenuation for central face area
              } else if (relY > 0.40) {
                facePenalty = 1.4; // Boost for lower/mid frame where hands operate
              }
            }

            const col = Math.min(gridCols - 1, Math.floor(px / cellW));
            const row = Math.min(gridRows - 1, Math.floor(py / cellH));
            const cellIdx = row * gridCols + col;

            const score = motionDiff * facePenalty;
            gridScores[cellIdx] += score;
            gridX[cellIdx] += px * score;
            gridY[cellIdx] += py * score;
          }
        }
      }

      this.lightLevel = totalBrightness / ((data.length / 4) * 255);
    }

    // Save current frame for next delta
    this.prevFrameData = new Uint8ClampedArray(data);

    // Find the dominant moving hand cell cluster
    let maxScore = 0;
    let maxCellIdx = -1;

    for (let c = 0; c < gridScores.length; c++) {
      if (gridScores[c] > maxScore) {
        maxScore = gridScores[c];
        maxCellIdx = c;
      }
    }

    // Significant hand movement detected
    if (maxScore > 180 && maxCellIdx >= 0) {
      const bestCol = maxCellIdx % gridCols;
      const bestRow = Math.floor(maxCellIdx / gridCols);

      // Compute localized sub-grid centroid around the dominant hand peak (3x3 neighborhood)
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

        // Mirror horizontal in selfie camera mode
        if (this.cameraFacing === 'user') {
          rawTargetX = w - rawTargetX;
        }

        // Map to display dimensions
        const targetX = (rawTargetX / w) * viewWidth;
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

        // Adaptive smoothing:
        // Slow gentle movement -> alpha = 0.20 (silky smooth, zero jitter/tremor)
        // Fast slashing movement -> alpha = 0.42 (instantaneous slice response)
        const alpha = Math.min(0.44, 0.20 + 0.22 * Math.min(1.0, instantSpeed / 1.5)) * Math.min(1.8, this.sensitivity);

        this.smoothedX += rawDx * alpha;
        this.smoothedY += rawDy * alpha;

        // Smooth speed calculation
        const dx = this.smoothedX - this.lastX;
        const dy = this.smoothedY - this.lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const filteredSpeed = dist / dt;

        this.lastX = this.smoothedX;
        this.lastY = this.smoothedY;
        this.lastTime = now;
        this.currentSpeed = this.currentSpeed * 0.6 + filteredSpeed * 0.4;
        this.confidence = Math.min(1.0, clusterScore / 1800);
        this.isHandFound = true;

        // Lethal slash threshold
        const minSlashSpeed = 0.35 / this.sensitivity;
        if (this.currentSpeed >= minSlashSpeed) {
          this.bladePoints.push({
            x: this.smoothedX,
            y: this.smoothedY,
            time: now,
            speed: this.currentSpeed,
          });
        }
      }
    } else {
      // Smooth decay when hand stops or leaves frame
      this.currentSpeed *= 0.82;
      this.confidence *= 0.85;
      if (this.confidence < 0.1) {
        this.isHandFound = false;
      }
    }

    this.pruneTrail(now);

    return {
      x: this.smoothedX,
      y: this.smoothedY,
      isSlashing: this.currentSpeed >= 0.35 / this.sensitivity,
      speed: this.currentSpeed,
      confidence: this.confidence,
      lightLevel: this.lightLevel,
      isHandFound: this.isHandFound,
    };
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
  }
}
