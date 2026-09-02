/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  AppState,
  RoomRole,
  DrawStroke,
  Point,
  LaserPoint,
  EmojiStamp,
  PeerMediaState,
} from './types';
import { WebRTCManager, generateRoomCode, parseRoomCode } from './lib/webrtc';
import { Header } from './components/Header';
import { LandingView } from './components/LandingView';
import { WaitingView } from './components/WaitingView';
import { CallView } from './components/CallView';
import { CallEndedView } from './components/CallEndedView';
import { sounds } from './lib/sound';
import { AlertCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [role, setRole] = useState<RoomRole | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [initialCode, setInitialCode] = useState<string>('');
  
  // Media streams & connection
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMediaLoading, setIsMediaLoading] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [currentFacing, setCurrentFacing] = useState<'user' | 'environment'>('user');
  const [peerMediaState, setPeerMediaState] = useState<PeerMediaState>({ audio: false, video: false });
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Doodle state
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [currentRemoteStroke, setCurrentRemoteStroke] = useState<DrawStroke | null>(null);
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);
  const [stamps, setStamps] = useState<EmojiStamp[]>([]);
  const [incomingReaction, setIncomingReaction] = useState<string | null>(null);

  // Stats for call ended screen
  const [strokeCount, setStrokeCount] = useState<number>(0);
  const [stampCount, setStampCount] = useState<number>(0);

  const webrtcRef = useRef<WebRTCManager | null>(null);

  // Check URL query parameters for ?room=ABCD
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInitialCode(roomParam.trim().toUpperCase());
      }
    }
  }, []);

  // Initialize WebRTC Manager instance
  const getWebRTC = useCallback(() => {
    if (!webrtcRef.current) {
      const manager = new WebRTCManager();

      manager.onRemoteStream = (stream) => {
        setRemoteStream(stream);
      };

      manager.onConnectionStateChange = (connected) => {
        setIsConnected(connected);
        if (connected) {
          setAppState('calling');
        }
      };

      manager.onError = (err) => {
        setErrorMessage(err);
      };

      manager.onPingUpdated = (latency) => {
        setPingMs(latency);
      };

      manager.onPeerMediaState = (state) => {
        setPeerMediaState(state);
      };

      manager.onDataMessage = (msg) => {
        switch (msg.type) {
          case 'draw_start':
            setCurrentRemoteStroke(msg.stroke);
            break;
          case 'draw_move':
            setCurrentRemoteStroke((prev) => {
              if (!prev || prev.id !== msg.id) return prev;
              return {
                ...prev,
                points: [...prev.points, msg.point],
              };
            });
            break;
          case 'draw_end':
            setCurrentRemoteStroke((prev) => {
              if (prev && prev.id === msg.id) {
                setStrokes((s) => [...s, prev]);
                setStrokeCount((c) => c + 1);
              }
              return null;
            });
            break;
          case 'clear':
            sounds.playClear();
            setStrokes([]);
            setStamps([]);
            setCurrentRemoteStroke(null);
            setLaserPoints([]);
            break;
          case 'undo':
            setStrokes((prev) => prev.filter((st) => st.id !== msg.strokeId));
            break;
          case 'stamp':
            sounds.playPop();
            setStamps((prev) => [...prev, msg.stamp]);
            setStampCount((c) => c + 1);
            break;
          case 'laser_move':
            setLaserPoints((prev) => [
              ...prev.filter((p) => Date.now() - p.timestamp < 1200),
              msg.point,
            ]);
            break;
          case 'laser_end':
            break;
          case 'reaction':
            setIncomingReaction(msg.emoji);
            break;
        }
      };

      webrtcRef.current = manager;
    }
    return webrtcRef.current;
  }, []);

  // Request initial media stream for preview on landing
  useEffect(() => {
    let isMounted = true;
    const initLocalPreview = async () => {
      setIsMediaLoading(true);
      const manager = getWebRTC();
      try {
        const stream = await manager.getMediaStream('user');
        if (isMounted) {
          setLocalStream(stream);
        }
      } catch (e) {
        console.warn('Initial camera init failed:', e);
      } finally {
        if (isMounted) setIsMediaLoading(false);
      }
    };

    initLocalPreview();

    return () => {
      isMounted = false;
    };
  }, [getWebRTC]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      webrtcRef.current?.destroy();
    };
  }, []);

  // Host creates a room
  const handleCreateRoom = async () => {
    setErrorMessage(null);
    setIsMediaLoading(true);
    const code = generateRoomCode();
    setRoomCode(code);
    setRole('host');

    const manager = getWebRTC();
    try {
      let stream = localStream;
      if (!stream) {
        stream = await manager.getMediaStream('user');
        setLocalStream(stream);
      }

      await manager.initHost(code, stream);
      setAppState('waiting');
    } catch (err: unknown) {
      console.error('Failed to create host room:', err);
      setErrorMessage('Failed to initialize room. Please check your connection.');
    } finally {
      setIsMediaLoading(false);
    }
  };

  // Guest joins an existing room
  const handleJoinRoom = async (code: string) => {
    setErrorMessage(null);
    setIsMediaLoading(true);
    const cleanCode = code.trim().toUpperCase();
    setRoomCode(cleanCode);
    setRole('guest');

    const manager = getWebRTC();
    try {
      let stream = localStream;
      if (!stream) {
        stream = await manager.getMediaStream('user');
        setLocalStream(stream);
      }

      setAppState('calling');
      await manager.initGuest(cleanCode, stream);
    } catch (err: unknown) {
      console.error('Failed to join room:', err);
      setErrorMessage(`Could not join room "${cleanCode}". Please verify the code.`);
      setAppState('landing');
    } finally {
      setIsMediaLoading(false);
    }
  };

  // Solo Playground mode
  const handleStartSolo = async () => {
    setErrorMessage(null);
    setRoomCode('SOLO');
    setRole('host');
    const manager = getWebRTC();
    let stream = localStream;
    if (!stream) {
      stream = await manager.getMediaStream('user');
      setLocalStream(stream);
    }
    setIsConnected(true);
    setAppState('calling');
  };

  // Media Controls
  const handleToggleAudio = () => {
    const manager = getWebRTC();
    const newMuted = !isAudioMuted;
    manager.toggleAudio(!newMuted);
    setIsAudioMuted(newMuted);
    manager.sendData({
      type: 'media_state',
      audio: newMuted,
      video: isVideoMuted,
    });
  };

  const handleToggleVideo = () => {
    const manager = getWebRTC();
    const newMuted = !isVideoMuted;
    manager.toggleVideo(!newMuted);
    setIsVideoMuted(newMuted);
    manager.sendData({
      type: 'media_state',
      audio: isAudioMuted,
      video: newMuted,
    });
  };

  const handleSwitchCamera = async () => {
    const manager = getWebRTC();
    try {
      const { stream, facing } = await manager.switchCamera(currentFacing);
      setLocalStream(stream);
      setCurrentFacing(facing);
    } catch (err) {
      console.warn('Camera switch error:', err);
    }
  };

  // Doodling Callbacks
  const handleDrawStart = (stroke: DrawStroke) => {
    const manager = getWebRTC();
    manager.sendData({ type: 'draw_start', stroke });
  };

  const handleDrawMove = (id: string, point: Point) => {
    const manager = getWebRTC();
    manager.sendData({ type: 'draw_move', id, point });
  };

  const handleDrawEnd = (stroke: DrawStroke) => {
    setStrokes((prev) => [...prev, stroke]);
    setStrokeCount((c) => c + 1);
    const manager = getWebRTC();
    manager.sendData({ type: 'draw_end', id: stroke.id });
  };

  const handleLaserMove = (point: LaserPoint) => {
    setLaserPoints((prev) => [
      ...prev.filter((p) => Date.now() - p.timestamp < 1200),
      point,
    ]);
    const manager = getWebRTC();
    manager.sendData({ type: 'laser_move', point });
  };

  const handleLaserEnd = () => {
    const manager = getWebRTC();
    manager.sendData({ type: 'laser_end' });
  };

  const handleStamp = (stamp: EmojiStamp) => {
    sounds.playPop();
    setStamps((prev) => [...prev, stamp]);
    setStampCount((c) => c + 1);
    const manager = getWebRTC();
    manager.sendData({ type: 'stamp', stamp });
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const lastStroke = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    const manager = getWebRTC();
    manager.sendData({ type: 'undo', strokeId: lastStroke.id });
  };

  const handleClear = () => {
    setStrokes([]);
    setStamps([]);
    setLaserPoints([]);
    setCurrentRemoteStroke(null);
    const manager = getWebRTC();
    manager.sendData({ type: 'clear' });
  };

  const handleSendReaction = (emoji: string) => {
    setIncomingReaction(emoji);
    const manager = getWebRTC();
    manager.sendData({ type: 'reaction', emoji });
  };

  // End Call & Cleanup
  const handleEndCall = () => {
    webrtcRef.current?.destroy();
    webrtcRef.current = null;
    setIsConnected(false);
    setRemoteStream(null);
    setAppState('ended');
  };

  const handleRestart = async () => {
    setStrokes([]);
    setStamps([]);
    setLaserPoints([]);
    setCurrentRemoteStroke(null);
    setRole(null);
    setRoomCode('');
    setStrokeCount(0);
    setStampCount(0);
    setPingMs(null);
    setErrorMessage(null);
    setAppState('landing');

    // Re-acquire fresh local stream for preview
    const manager = getWebRTC();
    const stream = await manager.getMediaStream('user');
    setLocalStream(stream);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-black flex flex-col justify-start">
      {/* Neo-brutalist Header */}
      <Header
        appState={appState}
        roomCode={roomCode}
        role={role}
        isConnected={isConnected}
        onLeave={handleEndCall}
      />

      {/* Global Error Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="w-full max-w-[420px] mx-auto px-3 my-1"
          >
            <div className="bg-red-500 text-white border-3 border-black shadow-[3px_3px_0px_#000000] rounded-xl p-3 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-tight">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="p-1 hover:bg-red-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View Router */}
      <main className="flex-1 flex flex-col justify-center">
        {appState === 'landing' && (
          <LandingView
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onStartSoloPlayground={handleStartSolo}
            initialCode={initialCode}
            isMediaLoading={isMediaLoading}
            localStream={localStream}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
          />
        )}

        {appState === 'waiting' && (
          <WaitingView
            roomCode={roomCode}
            localStream={localStream}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onCancel={handleRestart}
          />
        )}

        {appState === 'calling' && (
          <CallView
            role={role}
            roomCode={roomCode}
            localStream={localStream}
            remoteStream={remoteStream}
            isConnected={isConnected}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            peerMediaState={peerMediaState}
            strokes={strokes}
            currentRemoteStroke={currentRemoteStroke}
            laserPoints={laserPoints}
            stamps={stamps}
            pingMs={pingMs}
            onDrawStart={handleDrawStart}
            onDrawMove={handleDrawMove}
            onDrawEnd={handleDrawEnd}
            onLaserMove={handleLaserMove}
            onLaserEnd={handleLaserEnd}
            onStamp={handleStamp}
            onUndo={handleUndo}
            onClear={handleClear}
            onSendReaction={handleSendReaction}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onSwitchCamera={handleSwitchCamera}
            onEndCall={handleEndCall}
            incomingReaction={incomingReaction}
          />
        )}

        {appState === 'ended' && (
          <CallEndedView
            roomCode={roomCode}
            totalStrokes={strokeCount}
            totalStamps={stampCount}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}
