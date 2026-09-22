import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../systems/GameEngine';
import { HandTracker } from '../systems/HandTracker';
import { BladePoint, BladeStyle, SpawnedObject } from '../types';

interface GameCanvasProps {
  engineRef: React.MutableRefObject<GameEngine>;
  trackerRef: React.MutableRefObject<HandTracker>;
  activeBlade: BladeStyle;
  width: number;
  height: number;
  onPointerDown?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engineRef,
  trackerRef,
  activeBlade,
  width,
  height,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const engine = engineRef.current;
      const tracker = trackerRef.current;

      const objects = engine.objects;
      const particles = engine.particles;
      const floatingTexts = engine.floatingTexts;
      const bladeTrail = tracker.getBladeTrail();
      const trackFrame = tracker.processFrame(width, height);
      const screenShake = engine.screenShake;
      const frenzyActive = engine.frenzyActive;
      const freezeActive = engine.freezeTimer > 0;

      // Dynamic responsive scale factor based on screen size (mobile -> desktop -> 4K TV)
      const scale = Math.max(0.75, Math.min(2.3, Math.sqrt(width * width + height * height) / 1000));

      // Device Pixel Ratio for ultra-crisp graphics on Retina and 4K displays
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const targetW = Math.round(width * dpr);
      const targetH = Math.round(height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear frame
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Screen Shake effect
      if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 1.5 * scale;
        const shakeY = (Math.random() - 0.5) * screenShake * 1.5 * scale;
        ctx.translate(shakeX, shakeY);
      }

      // Freeze overlay tint
      if (freezeActive) {
        ctx.fillStyle = 'rgba(0, 210, 252, 0.14)';
        ctx.fillRect(0, 0, width, height);
      }

      // Frenzy ambient edge pulses
      if (frenzyActive) {
        const pulseGradient = ctx.createRadialGradient(
          width / 2, height / 2, Math.min(width, height) * 0.35,
          width / 2, height / 2, Math.max(width, height) * 0.75
        );
        pulseGradient.addColorStop(0, 'rgba(255, 61, 113, 0)');
        pulseGradient.addColorStop(1, 'rgba(255, 61, 113, 0.3)');
        ctx.fillStyle = pulseGradient;
        ctx.fillRect(0, 0, width, height);
      }

      // 1. Render Sliced Halves & Intact Fruits
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (!obj.sliced) {
          ctx.save();
          ctx.translate(obj.x, obj.y);
          ctx.rotate(obj.rotation);

          if (obj.isBomb) {
            if (obj.isDisguisedBomb) {
              drawDisguisedBomb(ctx, obj);
            } else {
              drawBomb(ctx, obj.radius);
            }
          } else {
            drawFruit(ctx, obj);
          }
          ctx.restore();
        } else if (obj.halves) {
          // Draw Half 1
          ctx.save();
          ctx.translate(obj.halves.x1, obj.halves.y1);
          ctx.rotate(obj.halves.rot1);
          drawFruitHalf(ctx, obj, 1);
          ctx.restore();

          // Draw Half 2
          ctx.save();
          ctx.translate(obj.halves.x2, obj.halves.y2);
          ctx.rotate(obj.halves.rot2);
          drawFruitHalf(ctx, obj, 2);
          ctx.restore();
        }
      }

      // 2. Render Juice Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Render Blade Trail (with glowing gradient and dynamic responsive width)
      if (bladeTrail.length >= 2) {
        drawBladeTrail(ctx, bladeTrail, activeBlade, scale);
      }

      // 4. Render Hand Cursor / Blade Focus Point with Palm vs Body validation
      if (trackFrame.confidence > 0.08 || trackFrame.isHandFound || trackFrame.bodyPartDetected !== 'none') {
        drawHandCrosshair(
          ctx,
          trackFrame.x,
          trackFrame.y,
          trackFrame.isSlashing,
          activeBlade,
          trackFrame.confidence,
          trackFrame.isPalmValidated,
          trackFrame.bodyPartDetected,
          scale
        );
      }

      // 5. Render Floating Text
      for (let i = 0; i < floatingTexts.length; i++) {
        const ft = floatingTexts[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
        ctx.font = `800 ${Math.round(20 * ft.scale * scale)}px 'Orbitron', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outline
        ctx.strokeStyle = '#0B0B12';
        ctx.lineWidth = 4 * scale;
        ctx.strokeText(ft.text, ft.x, ft.y);

        // Fill
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 10 * scale;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // Screen shake restore
      ctx.restore(); // DPR scale restore

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engineRef, trackerRef, activeBlade, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-auto touch-none z-10"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
};

// Helper: Render fruit with arcade gradients, shine, and emoji badge
function drawFruit(ctx: CanvasRenderingContext2D, obj: SpawnedObject) {
  const r = obj.radius;

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);

  // Gradient fill
  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.2, obj.color);
  grad.addColorStop(0.85, obj.color);
  grad.addColorStop(1, '#1A1A24');
  ctx.fillStyle = grad;
  ctx.shadowColor = obj.color;
  ctx.shadowBlur = 16;
  ctx.fill();

  // Outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Emoji icon badge at center
  ctx.font = `${Math.round(r * 1.15)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(obj.emoji, 0, 2);

  // Special aura for golden or powerup fruits
  if (obj.type === 'golden') {
    ctx.strokeStyle = '#FFF380';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// Helper: Render disguised bomb (looks like a golden/yellow fruit with sneaky warning clues)
function drawDisguisedBomb(ctx: CanvasRenderingContext2D, obj: SpawnedObject) {
  const r = obj.radius;
  const now = Date.now();

  ctx.save();

  // 1. Subtle fuse peeking out of the top of the fruit
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.quadraticCurveTo(r * 0.35, -r * 1.2, r * 0.22, -r * 1.45);
  ctx.strokeStyle = '#D2B48C';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Sparkling animated fuse spark
  const sparkPulse = Math.sin(now * 0.035) * 2.5;
  ctx.fillStyle = '#FFE600';
  ctx.shadowColor = '#FF3300';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(r * 0.22, -r * 1.45, 5 + sparkPulse, 0, Math.PI * 2);
  ctx.fill();

  // 2. Fruit Body (looks like a juicy yellow/golden fruit)
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);

  // Gradient: bright golden yellow, but with a subtle warm amber/sinister shift at the core
  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#FFFFA0');
  grad.addColorStop(0.3, obj.color || '#FFD700');
  grad.addColorStop(0.75, '#FF9900');
  grad.addColorStop(1, '#B85E00');
  ctx.fillStyle = grad;
  ctx.shadowColor = '#FF6B00';
  ctx.shadowBlur = 16;
  ctx.fill();

  // Outline with subtle warning pulsation
  const warnPhase = Math.sin(now * 0.012);
  ctx.strokeStyle = warnPhase > 0.4 ? 'rgba(255, 60, 60, 0.7)' : 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Faint pulsing danger core behind emoji
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.6);
  coreGrad.addColorStop(0, `rgba(255, 50, 50, ${0.25 + warnPhase * 0.15})`);
  coreGrad.addColorStop(1, 'rgba(255, 50, 50, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Fruit emoji badge (yellow fruit: lemon, banana, star, pineapple)
  ctx.font = `${Math.round(r * 1.15)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(obj.emoji, 0, 2);

  // Outer aura: pulses between gold and warning crimson dash
  const auraColor = warnPhase > 0 ? '#FF3D71' : '#FFF380';
  ctx.strokeStyle = auraColor;
  ctx.lineWidth = 3.2;
  ctx.shadowColor = auraColor;
  ctx.shadowBlur = 14;
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = (now * 0.015) % 20;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

// Helper: Render split fruit halves
function drawFruitHalf(ctx: CanvasRenderingContext2D, obj: SpawnedObject, halfNum: number) {
  const r = obj.radius;
  ctx.save();

  // Semicircle path
  ctx.beginPath();
  if (halfNum === 1) {
    ctx.arc(0, 0, r, 0, Math.PI);
  } else {
    ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
  }
  ctx.closePath();

  // Inner juicy pulp color
  ctx.fillStyle = obj.juiceColor;
  ctx.fill();

  // Outer peel border
  ctx.strokeStyle = obj.color;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Highlight on cut edge
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();

  ctx.restore();
}

// Helper: Render bomb
function drawBomb(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  // Bomb body
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#555566');
  grad.addColorStop(0.5, '#222230');
  grad.addColorStop(1, '#0B0B12');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Danger red pulsing border
  ctx.strokeStyle = '#FF3333';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#FF3333';
  ctx.shadowBlur = 12;
  ctx.stroke();

  // Fuse
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.4, -r * 1.3, r * 0.3, -r * 1.6);
  ctx.strokeStyle = '#D2B48C';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Fuse spark
  ctx.fillStyle = '#FFEB3B';
  ctx.shadowColor = '#FF5722';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(r * 0.3, -r * 1.6, 6 + Math.sin(Date.now() * 0.02) * 3, 0, Math.PI * 2);
  ctx.fill();

  // Bomb symbol
  ctx.font = `${Math.round(r * 0.9)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💣', 0, 2);

  ctx.restore();
}

// Helper: Render glowing blade trail
function drawBladeTrail(
  ctx: CanvasRenderingContext2D,
  trail: BladePoint[],
  blade: BladeStyle,
  scale: number = 1.0
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const len = trail.length;

  for (let i = 0; i < len - 1; i++) {
    const p1 = trail[i];
    const p2 = trail[i + 1];
    const ratio = i / len;

    // Outer glow
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = blade.glowColor;
    ctx.lineWidth = (14 * ratio + 3) * scale;
    ctx.shadowColor = blade.color;
    ctx.shadowBlur = 18 * scale;
    ctx.stroke();

    // Inner bright core
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = (4 * ratio + 1.5) * scale;
    ctx.shadowBlur = 0;
    ctx.stroke();
  }

  // Blade tip flare
  const tip = trail[len - 1];
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 7 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = blade.color;
  ctx.shadowBlur = 20 * scale;
  ctx.fill();

  ctx.restore();
}

// Helper: Render smooth hand tracking target reticle
function drawHandCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isSlashing: boolean,
  blade: BladeStyle,
  confidence: number = 0.5,
  isPalmValidated: boolean = true,
  bodyPartDetected: 'palm' | 'head_face' | 'torso_body' | 'none' = 'palm',
  scale: number = 1.0
) {
  ctx.save();
  ctx.translate(x, y);

  const t = Date.now() * 0.003;
  const radius = (isSlashing ? 28 : 20) * scale;

  // Indicator colors and status message for universal gestures
  const strokeColor = isSlashing ? blade.color : 'rgba(66, 232, 255, 0.85)';
  const glowColor = blade.color;
  let label = isSlashing ? '⚡ CORTE!' : `⚔️ GESTO ATIVO ${Math.round(confidence * 100)}%`;
  const labelColor = isSlashing ? blade.color : '#FFFFFF';

  if (!isSlashing && confidence < 0.25) {
    label = '✋ MOVA A MÃO';
  }

  // Outer segmented targeting arcs that gently rotate
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = (isSlashing ? 2.5 : 1.6) * scale;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = (isSlashing ? 16 : 8) * scale;

  // Segment 1
  ctx.beginPath();
  ctx.arc(0, 0, radius, t, t + Math.PI * 0.6);
  ctx.stroke();

  // Segment 2
  ctx.beginPath();
  ctx.arc(0, 0, radius, t + Math.PI, t + Math.PI * 1.6);
  ctx.stroke();

  // Thin full guide ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1 * scale;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  // Core energy dot
  ctx.fillStyle = isSlashing ? '#FFFFFF' : strokeColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = (isSlashing ? 18 : 8) * scale;
  ctx.beginPath();
  ctx.arc(0, 0, (isSlashing ? 6 : 3.5) * scale, 0, Math.PI * 2);
  ctx.fill();

  // Hand Status Badge below cursor with protective dark pill background
  const fontSize = Math.max(9, Math.round(11 * scale));
  ctx.font = `700 ${fontSize}px "Orbitron", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textWidth = ctx.measureText(label).width;
  const pillPaddingX = 8 * scale;
  const pillHeight = (fontSize + 6) * scale;
  const pillY = radius + 14 * scale;

  ctx.fillStyle = 'rgba(11, 11, 18, 0.78)';
  ctx.beginPath();
  ctx.roundRect(-textWidth / 2 - pillPaddingX, pillY - pillHeight / 2, textWidth + pillPaddingX * 2, pillHeight, 4 * scale);
  ctx.fill();

  ctx.strokeStyle = isPalmValidated ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255, 61, 113, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = labelColor;
  ctx.shadowBlur = 0;
  ctx.fillText(label, 0, pillY);

  ctx.restore();
}
