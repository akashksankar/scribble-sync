import React, { useRef, useEffect, useCallback } from 'react';
import type { DrawStroke, Point, DrawingTool, LaserPoint, EmojiStamp } from '../types';

interface DoodleCanvasProps {
  strokes: DrawStroke[];
  currentRemoteStroke: DrawStroke | null;
  laserPoints: LaserPoint[];
  stamps: EmojiStamp[];
  activeTool: DrawingTool;
  activeColor: string;
  strokeSize: number;
  isDrawingEnabled: boolean;
  selectedStampEmoji: string;
  onDrawStart: (stroke: DrawStroke) => void;
  onDrawMove: (id: string, point: Point) => void;
  onDrawEnd: (stroke: DrawStroke) => void;
  onLaserMove: (point: LaserPoint) => void;
  onLaserEnd: () => void;
  onStamp: (stamp: EmojiStamp) => void;
}

export const DoodleCanvas: React.FC<DoodleCanvasProps> = ({
  strokes,
  currentRemoteStroke,
  laserPoints,
  stamps,
  activeTool,
  activeColor,
  strokeSize,
  isDrawingEnabled,
  selectedStampEmoji,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onLaserMove,
  onLaserEnd,
  onStamp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const currentLocalStrokeRef = useRef<DrawStroke | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Normalize client pointer coordinates to 0..1 based on canvas bounding rect
  const getNormalizedPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const x = Math.max(0, Math.min(1, rawX / rect.width));
    const y = Math.max(0, Math.min(1, rawY / rect.height));

    return { x, y };
  }, []);

  // Main Canvas Rendering Engine
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Helper to draw a single stroke
    const drawStroke = (stroke: DrawStroke) => {
      if (stroke.points.length === 0) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size * (width / 400); // Scale with resolution

      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else if (stroke.isHighlighter) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 0.45;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 1.0;
      }

      if (stroke.points.length === 1) {
        const pt = stroke.points[0];
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, (ctx.lineWidth / 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        const startPt = stroke.points[0];
        ctx.moveTo(startPt.x * width, startPt.y * height);

        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * width, pt.y * height);
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    // 1. Draw all committed strokes
    for (const stroke of strokes) {
      drawStroke(stroke);
    }

    // 2. Draw active local stroke in progress
    if (currentLocalStrokeRef.current) {
      drawStroke(currentLocalStrokeRef.current);
    }

    // 3. Draw active remote stroke in progress
    if (currentRemoteStroke) {
      drawStroke(currentRemoteStroke);
    }

    // 4. Draw Emoji Stamps
    for (const stamp of stamps) {
      ctx.save();
      const px = stamp.x * width;
      const py = stamp.y * height;
      const baseSize = 44 * stamp.scale * (width / 400);

      ctx.translate(px, py);
      ctx.rotate((stamp.rotation * Math.PI) / 180);

      // Neo-brutalist sticker background badge
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, baseSize * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Emoji text
      ctx.font = `${Math.round(baseSize * 0.75)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stamp.emoji, 0, 2);

      ctx.restore();
    }

    // 5. Draw Laser Pointer Trail (Fading animated effect)
    const now = Date.now();
    const activeLasers = laserPoints.filter((lp) => now - lp.timestamp < 1200);

    if (activeLasers.length > 0) {
      ctx.save();
      for (let i = 0; i < activeLasers.length; i++) {
        const lp = activeLasers[i];
        const age = now - lp.timestamp;
        const opacity = Math.max(0, 1 - age / 1200);
        const radius = (1 - age / 1200) * 16 + 4;

        const lx = lp.x * width;
        const ly = lp.y * height;

        // Outer glow
        const gradient = ctx.createRadialGradient(lx, ly, 2, lx, ly, radius);
        gradient.addColorStop(0, `rgba(255, 85, 0, ${opacity})`);
        gradient.addColorStop(0.4, `rgba(255, 170, 0, ${opacity * 0.7})`);
        gradient.addColorStop(1, `rgba(255, 85, 0, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }, [strokes, currentRemoteStroke, laserPoints, stamps]);

  // Animation render loop (for laser point decays)
  useEffect(() => {
    const loop = () => {
      renderCanvas();
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);

  // Handle Canvas Resize / High-DPI Scaling
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const displayWidth = Math.round(rect.width * dpr);
      const displayHeight = Math.round(rect.height * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      renderCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingEnabled) return;
    const pt = getNormalizedPoint(e);
    if (!pt) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;

    if (activeTool === 'stamp') {
      const stamp: EmojiStamp = {
        id: `stamp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emoji: selectedStampEmoji,
        x: pt.x,
        y: pt.y,
        scale: 1.0,
        rotation: (Math.random() - 0.5) * 20, // subtle playful rotation
        timestamp: Date.now(),
      };
      onStamp(stamp);
      return;
    }

    if (activeTool === 'laser') {
      const laserPt: LaserPoint = {
        x: pt.x,
        y: pt.y,
        timestamp: Date.now(),
      };
      onLaserMove(laserPt);
      return;
    }

    // Brush, highlighter, or eraser
    const stroke: DrawStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      points: [pt],
      color: activeColor,
      size: strokeSize,
      isEraser: activeTool === 'eraser',
      isHighlighter: activeTool === 'highlighter',
      timestamp: Date.now(),
    };

    currentLocalStrokeRef.current = stroke;
    onDrawStart(stroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || !isDrawingEnabled) return;
    const pt = getNormalizedPoint(e);
    if (!pt) return;

    if (activeTool === 'laser') {
      const laserPt: LaserPoint = {
        x: pt.x,
        y: pt.y,
        timestamp: Date.now(),
      };
      onLaserMove(laserPt);
      return;
    }

    if (currentLocalStrokeRef.current) {
      currentLocalStrokeRef.current.points.push(pt);
      onDrawMove(currentLocalStrokeRef.current.id, pt);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (activeTool === 'laser') {
      onLaserEnd();
      return;
    }

    if (currentLocalStrokeRef.current) {
      const finishedStroke = currentLocalStrokeRef.current;
      currentLocalStrokeRef.current = null;
      onDrawEnd(finishedStroke);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-auto select-none overflow-hidden touch-none">
      <canvas
        id="doodle-live-canvas"
        ref={canvasRef}
        className={`w-full h-full block ${
          !isDrawingEnabled
            ? 'pointer-events-none'
            : activeTool === 'eraser'
            ? 'cursor-cell'
            : activeTool === 'laser'
            ? 'cursor-crosshair'
            : activeTool === 'stamp'
            ? 'cursor-pointer'
            : 'cursor-crosshair'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </div>
  );
};
