import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  PlusCircle,
  LogIn,
  Palette,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { sounds } from '../lib/sound';
import { motion } from 'motion/react';

interface LandingViewProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartSoloPlayground: () => void;
  initialCode?: string;
  isMediaLoading: boolean;
  localStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartSoloPlayground,
  initialCode = '',
  isMediaLoading,
  localStream,
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
}) => {
  const [joinCode, setJoinCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-fill code from URL if passed
  useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode.toUpperCase());
      setActiveTab('join');
    }
  }, [initialCode]);

  // Attach local stream to preview video
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoMuted]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (clean.length < 3) {
      setErrorMsg('Please enter a valid 4-character room code');
      return;
    }
    setErrorMsg('');
    sounds.playPop();
    onJoinRoom(clean);
  };

  return (
    <div className="w-full max-w-[420px] mx-auto px-3 py-2 flex flex-col gap-3 pb-8">
      {/* Hero Badge */}
      <div className="bg-[#FF5500] border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black text-white text-[10px] font-black uppercase rounded-md tracking-wider">
            <Zap className="w-3 h-3 text-[#FF5500]" />
            Ephemeral WebRTC
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-black px-2 py-0.5 rounded-md border border-black">
            <Palette className="w-3 h-3 text-[#FF5500]" />
            Live Doodling
          </div>
        </div>

        <h1 className="text-2xl font-black tracking-tight mt-2.5 uppercase leading-none">
          Draw Directly Over Real Video
        </h1>
        <p className="text-xs text-white/90 font-medium mt-1 leading-relaxed">
          Zero login, zero database. P2P video calls with synchronized live canvas overlays.
        </p>
      </div>

      {/* Camera & Mic Preview Box */}
      <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-[#FF5500]" />
            Camera Preview
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Pre-Call Check</span>
        </div>

        {/* Video Screen */}
        <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border-2 border-black">
          {localStream && !isVideoMuted ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#111111] text-gray-400 p-4 text-center">
              <VideoOff className="w-8 h-8 text-[#FF5500] mb-2" />
              <span className="text-xs font-bold text-white">Camera is Off</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Click below to enable video</span>
            </div>
          )}

          {/* Quick overlay controls */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
            <button
              id="landing-toggle-mic-btn"
              onClick={() => {
                sounds.playClick();
                onToggleAudio();
              }}
              title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
              className={`p-2 rounded-lg border-2 border-black font-bold transition-all ${
                isAudioMuted ? 'bg-black text-[#FF5500]' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              id="landing-toggle-video-btn"
              onClick={() => {
                sounds.playClick();
                onToggleVideo();
              }}
              title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
              className={`p-2 rounded-lg border-2 border-black font-bold transition-all ${
                isVideoMuted ? 'bg-black text-[#FF5500]' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Action Tabs (Create Room / Join Room) */}
      <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl p-3 flex flex-col gap-3">
        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 border-2 border-black rounded-xl">
          <button
            id="tab-create-room"
            onClick={() => {
              sounds.playClick();
              setActiveTab('create');
            }}
            className={`py-2 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-[#FF5500] text-white border-2 border-black shadow-[2px_2px_0px_#000000]'
                : 'text-black hover:bg-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create Room
          </button>

          <button
            id="tab-join-room"
            onClick={() => {
              sounds.playClick();
              setActiveTab('join');
            }}
            className={`py-2 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-[#FF5500] text-white border-2 border-black shadow-[2px_2px_0px_#000000]'
                : 'text-black hover:bg-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Join Room
          </button>
        </div>

        {/* Tab 1: Create Room Content */}
        {activeTab === 'create' && (
          <div className="flex flex-col gap-2.5 pt-1">
            <p className="text-xs text-gray-600 font-medium">
              Start an instant ephemeral room. You&apos;ll receive a 4-letter code to share with your friend or colleague.
            </p>

            <button
              id="btn-main-create-room"
              onClick={() => {
                sounds.playPop();
                onCreateRoom();
              }}
              disabled={isMediaLoading}
              className="w-full py-3.5 px-4 bg-[#FF5500] hover:bg-[#E64A19] text-white border-3 border-black rounded-xl font-black text-base uppercase tracking-wider shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Create New Room</span>
            </button>
          </div>
        )}

        {/* Tab 2: Join Room Content */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="flex flex-col gap-2.5 pt-1">
            <p className="text-xs text-gray-600 font-medium">
              Enter the 4-character code provided by the host:
            </p>

            <div className="flex items-center gap-2">
              <input
                id="input-room-code"
                type="text"
                maxLength={8}
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setErrorMsg('');
                }}
                placeholder="e.g. ABCD"
                className="w-full py-3 px-3 border-3 border-black rounded-xl font-mono font-black text-lg tracking-widest text-center uppercase bg-orange-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500] transition-all"
              />

              <button
                id="btn-main-join-room"
                type="submit"
                className="py-3 px-5 bg-black hover:bg-neutral-800 text-white border-3 border-black rounded-xl font-black text-base uppercase shadow-[4px_4px_0px_#FF5500] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                <span>Join</span>
                <ArrowRight className="w-4 h-4 text-[#FF5500]" />
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-300 p-2 rounded-lg">
                {errorMsg}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Solo Practice Playground Banner */}
      <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl p-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-black text-xs uppercase text-black flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-[#FF5500]" />
            Solo Doodle Playground
          </h2>
          <p className="text-[11px] text-gray-600 font-medium">
            Test brushes, lasers, &amp; stickers over your video without calling.
          </p>
        </div>

        <button
          id="btn-solo-playground"
          onClick={() => {
            sounds.playPop();
            onStartSoloPlayground();
          }}
          className="px-3 py-2 bg-white hover:bg-gray-100 text-black border-2 border-black rounded-xl font-black text-xs uppercase tracking-wider shrink-0 active:translate-x-[1px] active:translate-y-[1px]"
        >
          Try Solo
        </button>
      </div>

      {/* Security & Zero Database Guarantee Notice */}
      <div className="flex items-center justify-center gap-1.5 text-center text-[10px] font-bold text-gray-500 uppercase">
        <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
        <span>Direct Peer-to-Peer Encrypted RTCDataChannel &bull; Zero Server Storage</span>
      </div>
    </div>
  );
};
