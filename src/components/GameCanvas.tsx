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

      // Clear frame
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Screen Shake effect
      if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 1.5;
        const shakeY = (Math.random() - 0.5) * screenShake * 1.5;
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
            drawBomb(ctx, obj.radius);
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

      // 3. Render Blade Trail (with glowing gradient and dynamic width)
      if (bladeTrail.length >= 2) {
        drawBladeTrail(ctx, bladeTrail, activeBlade);
      }

      // 4. Render Hand Cursor / Blade Focus Point
      if (trackFrame.confidence > 0.10 || trackFrame.isHandFound) {
        drawHandCrosshair(ctx, trackFrame.x, trackFrame.y, trackFrame.isSlashing, activeBlade, trackFrame.confidence);
      }

      // 5. Render Floating Text
      for (let i = 0; i < floatingTexts.length; i++) {
        const ft = floatingTexts[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
        ctx.font = `800 ${Math.round(22 * ft.scale)}px 'Orbitron', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outline
        ctx.strokeStyle = '#0B0B12';
        ctx.lineWidth = 4;
        ctx.strokeText(ft.text, ft.x, ft.y);

        // Fill
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 10;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore();

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
function drawBladeTrail(ctx: CanvasRenderingContext2D, trail: BladePoint[], blade: BladeStyle) {
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
    ctx.lineWidth = 14 * ratio + 3;
    ctx.shadowColor = blade.color;
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Inner bright core
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4 * ratio + 1.5;
    ctx.shadowBlur = 0;
    ctx.stroke();
  }

  // Blade tip flare
  const tip = trail[len - 1];
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = blade.color;
  ctx.shadowBlur = 20;
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
  confidence: number = 0.5
) {
  ctx.save();
  ctx.translate(x, y);

  const t = Date.now() * 0.003;
  const radius = isSlashing ? 26 : 18;

  // Outer segmented targeting arcs that gently rotate
  ctx.strokeStyle = isSlashing ? blade.color : 'rgba(66, 232, 255, 0.6)';
  ctx.lineWidth = isSlashing ? 2.5 : 1.5;
  ctx.shadowColor = blade.color;
  ctx.shadowBlur = isSlashing ? 15 : 6;

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
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  // Core energy dot
  ctx.fillStyle = isSlashing ? '#FFFFFF' : blade.color;
  ctx.shadowColor = blade.color;
  ctx.shadowBlur = isSlashing ? 18 : 8;
  ctx.beginPath();
  ctx.arc(0, 0, isSlashing ? 6 : 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Hand Status Badge below cursor
  ctx.font = '9px "Orbitron", sans-serif';
  ctx.fillStyle = isSlashing ? blade.color : 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'center';
  const label = isSlashing ? '⚡ SLASH' : `✋ MÃO ${Math.round(confidence * 100)}%`;
  ctx.fillText(label, 0, radius + 14);

  ctx.restore();
}
