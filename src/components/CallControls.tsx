import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  SwitchCamera,
  LayoutGrid,
  Smile,
  Zap,
} from 'lucide-react';
import { sounds } from '../lib/sound';
import { AnimatePresence, motion } from 'motion/react';

interface CallControlsProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
  layoutMode: 'stack' | 'pip';
  onToggleLayout: () => void;
  onSendReaction: (emoji: string) => void;
  pingMs: number | null;
}

const QUICK_REACTIONS = ['🧡', '🔥', '😂', '🎉', '👏', '🚀'];

export const CallControls: React.FC<CallControlsProps> = ({
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
  onSwitchCamera,
  onEndCall,
  layoutMode,
  onToggleLayout,
  onSendReaction,
  pingMs,
}) => {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-[390px] px-3 pointer-events-auto">
      {/* Floating Reaction Tray */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            className="mb-2 p-2 bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl flex items-center justify-around"
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  sounds.playPop();
                  onSendReaction(emoji);
                  setShowReactions(false);
                }}
                className="text-2xl p-1.5 hover:scale-130 active:scale-95 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bottom Control Bar */}
      <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl px-3 py-2 flex items-center justify-between gap-1.5">
        {/* Mic toggle */}
        <button
          id="btn-toggle-mic"
          onClick={() => {
            sounds.playClick();
            onToggleAudio();
          }}
          title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
          className={`p-3 rounded-xl border-2 border-black font-bold transition-all ${
            isAudioMuted
              ? 'bg-black text-white shadow-[2px_2px_0px_#FF5500]'
              : 'bg-white hover:bg-gray-100 text-black active:translate-x-[1px] active:translate-y-[1px]'
          }`}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5 text-[#FF5500]" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera toggle */}
        <button
          id="btn-toggle-video"
          onClick={() => {
            sounds.playClick();
            onToggleVideo();
          }}
          title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          className={`p-3 rounded-xl border-2 border-black font-bold transition-all ${
            isVideoMuted
              ? 'bg-black text-white shadow-[2px_2px_0px_#FF5500]'
              : 'bg-white hover:bg-gray-100 text-black active:translate-x-[1px] active:translate-y-[1px]'
          }`}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5 text-[#FF5500]" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Flip camera */}
        <button
          id="btn-flip-camera"
          onClick={() => {
            sounds.playClick();
            onSwitchCamera();
          }}
          title="Switch Camera (Front/Back)"
          className="p-3 bg-white hover:bg-gray-100 border-2 border-black rounded-xl text-black active:translate-x-[1px] active:translate-y-[1px]"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>

        {/* Layout toggle */}
        <button
          id="btn-toggle-layout"
          onClick={() => {
            sounds.playClick();
            onToggleLayout();
          }}
          title={layoutMode === 'stack' ? 'Switch to Picture-in-Picture' : 'Switch to Vertical Split'}
          className={`p-3 rounded-xl border-2 border-black transition-all ${
            layoutMode === 'pip'
              ? 'bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]'
              : 'bg-white hover:bg-gray-100 text-black'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        {/* Reactions menu trigger */}
        <button
          id="btn-reactions"
          onClick={() => {
            sounds.playPop();
            setShowReactions(!showReactions);
          }}
          title="Send Reaction"
          className="p-3 bg-white hover:bg-gray-100 border-2 border-black rounded-xl text-black active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Smile className="w-5 h-5 text-orange-600" />
        </button>

        {/* End Call Button */}
        <button
          id="btn-end-call"
          onClick={() => {
            sounds.playClear();
            onEndCall();
          }}
          title="End Call"
          className="p-3 bg-[#FF5500] hover:bg-red-600 text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Latency / WebRTC Connection indicator */}
      {pingMs !== null && (
        <div className="flex items-center justify-center mt-1.5">
          <div className="bg-black text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-black flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-[#FF5500]" />
            <span>{pingMs}ms</span>
            <span className="text-gray-400">| P2P Live</span>
          </div>
        </div>
      )}
    </div>
  );
};
