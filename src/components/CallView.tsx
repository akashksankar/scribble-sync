import React, { useRef, useEffect, useState, useCallback } from 'react';
import type {
  RoomRole,
  DrawStroke,
  Point,
  DrawingTool,
  LaserPoint,
  EmojiStamp,
  PeerMediaState,
} from '../types';
import { DoodleCanvas } from './DoodleCanvas';
import { DoodleToolbar } from './DoodleToolbar';
import { CallControls } from './CallControls';
import { SnapshotModal } from './SnapshotModal';
import {
  User,
  Mic,
  MicOff,
  VideoOff,
  Sparkles,
  Wifi,
  Smile,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sound';
import confetti from 'canvas-confetti';

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

interface CallViewProps {
  role: RoomRole | null;
  roomCode: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  peerMediaState: PeerMediaState;
  strokes: DrawStroke[];
  currentRemoteStroke: DrawStroke | null;
  laserPoints: LaserPoint[];
  stamps: EmojiStamp[];
  pingMs: number | null;
  onDrawStart: (stroke: DrawStroke) => void;
  onDrawMove: (id: string, point: Point) => void;
  onDrawEnd: (stroke: DrawStroke) => void;
  onLaserMove: (point: LaserPoint) => void;
  onLaserEnd: () => void;
  onStamp: (stamp: EmojiStamp) => void;
  onUndo: () => void;
  onClear: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
  incomingReaction: string | null;
}

export const CallView: React.FC<CallViewProps> = ({
  role,
  roomCode,
  localStream,
  remoteStream,
  isConnected,
  isAudioMuted,
  isVideoMuted,
  peerMediaState,
  strokes,
  currentRemoteStroke,
  laserPoints,
  stamps,
  pingMs,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onLaserMove,
  onLaserEnd,
  onStamp,
  onUndo,
  onClear,
  onSendReaction,
  onToggleAudio,
  onToggleVideo,
  onSwitchCamera,
  onEndCall,
  incomingReaction,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawingTool>('brush');
  const [activeColor, setActiveColor] = useState<string>('#FF5500'); // Punchy Orange default!
  const [strokeSize, setStrokeSize] = useState<number>(7);
  const [selectedStampEmoji, setSelectedStampEmoji] = useState<string>('🧡');
  const [isDrawingEnabled, setIsDrawingEnabled] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<'stack' | 'pip'>('stack');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Trigger celebration on initial connect
  useEffect(() => {
    if (isConnected) {
      sounds.playConnect();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FF5500', '#000000', '#FFFFFF', '#FFD600'],
        });
      } catch {
        // Ignore
      }
    }
  }, [isConnected]);

  // Hook up video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoMuted]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, peerMediaState.video]);

  // Handle incoming reaction animations
  useEffect(() => {
    if (incomingReaction) {
      sounds.playPop();
      const newReaction: FloatingReaction = {
        id: `react-${Date.now()}-${Math.random()}`,
        emoji: incomingReaction,
        x: 20 + Math.random() * 60, // random percentage across width
      };
      setFloatingReactions((prev) => [...prev, newReaction]);

      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2500);
    }
  }, [incomingReaction]);

  // Capture Snapshot of Video + Doodle Canvas combined
  const handleTakeSnapshot = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const doodleCanvas = document.getElementById('doodle-live-canvas') as HTMLCanvasElement | null;
    const localVideo = localVideoRef.current;
    const remoteVideo = remoteVideoRef.current;

    const offscreen = document.createElement('canvas');
    const rect = container.getBoundingClientRect();
    offscreen.width = rect.width * 2;
    offscreen.height = rect.height * 2;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Background fill
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    if (layoutMode === 'stack') {
      const halfH = offscreen.height / 2;

      // Draw remote video top half
      if (remoteVideo && !peerMediaState.video && remoteVideo.videoWidth) {
        ctx.drawImage(remoteVideo, 0, 0, offscreen.width, halfH);
      } else {
        ctx.fillStyle = '#1E1E1E';
        ctx.fillRect(0, 0, offscreen.width, halfH);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Remote Peer Video', offscreen.width / 2, halfH / 2);
      }

      // Draw local video bottom half (mirrored horizontally)
      if (localVideo && !isVideoMuted && localVideo.videoWidth) {
        ctx.save();
        ctx.translate(offscreen.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(localVideo, 0, halfH, offscreen.width, halfH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(0, halfH, offscreen.width, halfH);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Your Video', offscreen.width / 2, halfH + halfH / 2);
      }
    } else {
      // PiP mode
      if (remoteVideo && !peerMediaState.video && remoteVideo.videoWidth) {
        ctx.drawImage(remoteVideo, 0, 0, offscreen.width, offscreen.height);
      }
      if (localVideo && !isVideoMuted && localVideo.videoWidth) {
        const pipW = offscreen.width * 0.35;
        const pipH = pipW * 1.33;
        const pipX = offscreen.width - pipW - 20;
        const pipY = 40;
        ctx.save();
        ctx.translate(pipX + pipW, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(localVideo, 0, pipY, pipW, pipH);
        ctx.restore();
      }
    }

    // Overlay the Doodles
    if (doodleCanvas) {
      ctx.drawImage(doodleCanvas, 0, 0, offscreen.width, offscreen.height);
    }

    // Add Neo-brutalist watermark badge
    ctx.save();
    ctx.fillStyle = '#FF5500';
    ctx.fillRect(20, offscreen.height - 60, 200, 36);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(20, offscreen.height - 60, 200, 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`DOODLECALL #${roomCode}`, 32, offscreen.height - 36);
    ctx.restore();

    setSnapshotUrl(offscreen.toDataURL('image/png'));
  }, [layoutMode, isVideoMuted, peerMediaState.video, roomCode]);

  return (
    <div className="relative w-full max-w-[420px] mx-auto h-[calc(100dvh-75px)] px-3 pb-2 flex flex-col select-none">
      {/* Video Viewport Stage */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 bg-black border-4 border-black shadow-[6px_6px_0px_#000000] rounded-3xl overflow-hidden flex flex-col"
      >
        {/* Floating Emojis Animation Layer */}
        <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: 500, opacity: 1, scale: 0.8 }}
              animate={{ y: -80, opacity: 0, scale: 1.6 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              style={{ left: `${r.x}%` }}
              className="absolute text-5xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
            >
              {r.emoji}
            </motion.div>
          ))}
        </div>

        {/* 1. Stacked Layout Mode (Mobile Vertical Split) */}
        {layoutMode === 'stack' && (
          <div className="w-full h-full flex flex-col">
            {/* Top: Remote Stream */}
            <div className="relative w-full flex-1 bg-[#1A1A1A] overflow-hidden border-b-3 border-black">
              {remoteStream && !peerMediaState.video ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                  {isConnected ? (
                    <>
                      <div className="w-14 h-14 bg-black border-2 border-[#FF5500] rounded-2xl flex items-center justify-center text-white mb-2">
                        <User className="w-8 h-8 text-[#FF5500]" />
                      </div>
                      <span className="text-xs font-black uppercase text-white tracking-wider">
                        {role === 'host' ? 'Guest Video Muted' : 'Host Video Muted'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-black border-2 border-yellow-400 rounded-2xl flex items-center justify-center text-yellow-400 mb-2 animate-bounce">
                        <Wifi className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black uppercase text-white tracking-wider">
                        Connecting to Peer...
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">
                        Waiting for peer stream handshake
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Peer Label Badge */}
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-black/80 backdrop-blur-xs border-2 border-black rounded-lg text-white text-[11px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>{role === 'host' ? 'Guest' : 'Host (Connected)'}</span>
                {peerMediaState.audio && <MicOff className="w-3 h-3 text-[#FF5500] ml-1" />}
              </div>
            </div>

            {/* Bottom: Local Stream */}
            <div className="relative w-full flex-1 bg-[#222222] overflow-hidden">
              {localStream && !isVideoMuted ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-14 h-14 bg-black border-2 border-white rounded-2xl flex items-center justify-center text-white mb-2">
                    <VideoOff className="w-7 h-7 text-[#FF5500]" />
                  </div>
                  <span className="text-xs font-black uppercase text-white tracking-wider">
                    Your Camera is Off
                  </span>
                </div>
              )}

              {/* Local Label Badge */}
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-[#FF5500] border-2 border-black rounded-lg text-white text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000]">
                <span>You ({role === 'host' ? 'Host' : 'Guest'})</span>
                {isAudioMuted && <MicOff className="w-3 h-3 text-black ml-1" />}
              </div>
            </div>
          </div>
        )}

        {/* 2. PiP Mode (Alternative view) */}
        {layoutMode === 'pip' && (
          <div className="relative w-full h-full bg-[#1A1A1A] overflow-hidden">
            {/* Fullscreen Remote */}
            {remoteStream && !peerMediaState.video ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                <User className="w-12 h-12 text-[#FF5500] mb-2" />
                <span className="text-xs font-black uppercase text-white">Remote Video</span>
              </div>
            )}

            {/* Floating Local PiP Window */}
            <div className="absolute top-3 right-3 z-20 w-28 aspect-[3/4] bg-black border-2 border-white rounded-xl overflow-hidden shadow-[3px_3px_0px_#000000]">
              {localStream && !isVideoMuted ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold">
                  Camera Off
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-black text-white">
                You
              </div>
            </div>
          </div>
        )}

        {/* Absolute Live Synchronized Doodle Canvas Overlay */}
        <DoodleCanvas
          strokes={strokes}
          currentRemoteStroke={currentRemoteStroke}
          laserPoints={laserPoints}
          stamps={stamps}
          activeTool={activeTool}
          activeColor={activeColor}
          strokeSize={strokeSize}
          isDrawingEnabled={isDrawingEnabled}
          selectedStampEmoji={selectedStampEmoji}
          onDrawStart={onDrawStart}
          onDrawMove={onDrawMove}
          onDrawEnd={onDrawEnd}
          onLaserMove={onLaserMove}
          onLaserEnd={onLaserEnd}
          onStamp={onStamp}
        />

        {/* Floating Neo-Brutalist Doodle Toolbar */}
        <DoodleToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          strokeSize={strokeSize}
          onSizeChange={setStrokeSize}
          selectedStampEmoji={selectedStampEmoji}
          onStampSelect={setSelectedStampEmoji}
          onUndo={onUndo}
          onClear={onClear}
          onTakeSnapshot={handleTakeSnapshot}
          canUndo={strokes.length > 0}
          isDrawingEnabled={isDrawingEnabled}
          onToggleDrawing={() => setIsDrawingEnabled(!isDrawingEnabled)}
        />
      </div>

      {/* Main Call Controls (Mute, Camera, Flip, Layout, End) */}
      <CallControls
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        onToggleAudio={onToggleAudio}
        onToggleVideo={onToggleVideo}
        onSwitchCamera={onSwitchCamera}
        onEndCall={onEndCall}
        layoutMode={layoutMode}
        onToggleLayout={() => setLayoutMode(layoutMode === 'stack' ? 'pip' : 'stack')}
        onSendReaction={onSendReaction}
        pingMs={pingMs}
      />

      {/* Snapshot Modal */}
      <SnapshotModal
        imageUrl={snapshotUrl}
        onClose={() => setSnapshotUrl(null)}
      />
    </div>
  );
};
