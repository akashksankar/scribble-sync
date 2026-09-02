import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  Share2,
  ExternalLink,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { sounds } from '../lib/sound';
import { motion } from 'motion/react';

interface WaitingViewProps {
  roomCode: string;
  localStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onCancel: () => void;
}

export const WaitingView: React.FC<WaitingViewProps> = ({
  roomCode,
  localStream,
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
  onCancel,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoMuted]);

  const joinLink = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?room=${roomCode}` : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    sounds.playPop();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinLink);
    sounds.playPop();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenGuestTab = () => {
    sounds.playPop();
    window.open(joinLink, '_blank');
  };

  return (
    <div className="w-full max-w-[420px] mx-auto px-3 py-2 flex flex-col gap-3 pb-8">
      {/* Code Display Card */}
      <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl p-4 flex flex-col items-center text-center gap-3">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-300 border-2 border-black rounded-lg text-xs font-black uppercase">
          <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
          <span>Room Created &bull; Waiting for Guest</span>
        </div>

        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Room Code</span>
          <div className="mt-1 py-3 px-6 bg-orange-50 border-3 border-black rounded-2xl shadow-[3px_3px_0px_#FF5500] flex items-center justify-center">
            <span className="font-mono font-black text-4xl tracking-widest text-black select-all">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="grid grid-cols-2 gap-2 w-full mt-1">
          <button
            id="waiting-copy-code-btn"
            onClick={handleCopyCode}
            className="py-2.5 px-3 bg-white hover:bg-gray-50 border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
          >
            {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-black" />}
            <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
          </button>

          <button
            id="waiting-copy-link-btn"
            onClick={handleCopyLink}
            className="py-2.5 px-3 bg-[#FF5500] hover:bg-[#E64A19] text-white border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied Link!' : 'Share Link'}</span>
          </button>
        </div>

        {/* 2-Tab Testing Helper */}
        <button
          id="waiting-open-second-tab-btn"
          onClick={handleOpenGuestTab}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl font-bold text-xs text-black flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>Test in 2nd Tab (Simulate Guest)</span>
        </button>
      </div>

      {/* Video Preview Box */}
      <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-[#FF5500]" />
            Your Camera Preview
          </span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#FF5500]">
            <Loader2 className="w-3 h-3 animate-spin" />
            Signaling Ready
          </div>
        </div>

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
              <span className="text-xs font-bold text-white">Camera Muted</span>
            </div>
          )}

          {/* Quick controls on preview */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
            <button
              id="waiting-toggle-mic-btn"
              onClick={() => {
                sounds.playClick();
                onToggleAudio();
              }}
              className={`p-2 rounded-lg border-2 border-black font-bold transition-all ${
                isAudioMuted ? 'bg-black text-[#FF5500]' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              id="waiting-toggle-video-btn"
              onClick={() => {
                sounds.playClick();
                onToggleVideo();
              }}
              className={`p-2 rounded-lg border-2 border-black font-bold transition-all ${
                isVideoMuted ? 'bg-black text-[#FF5500]' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Room Button */}
      <button
        id="waiting-cancel-btn"
        onClick={() => {
          sounds.playClear();
          onCancel();
        }}
        className="w-full py-3 bg-white hover:bg-red-50 text-red-600 border-3 border-black rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-2"
      >
        <PhoneOff className="w-4 h-4" />
        <span>Cancel &amp; Return Home</span>
      </button>
    </div>
  );
};
