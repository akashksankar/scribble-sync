import React, { useState } from 'react';
import { Copy, Check, Video, PhoneCall } from 'lucide-react';
import type { AppState, RoomRole } from '../types';
import { sounds } from '../lib/sound';

interface HeaderProps {
  appState: AppState;
  roomCode: string;
  role: RoomRole | null;
  isConnected: boolean;
  onLeave?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appState,
  roomCode,
  role,
  isConnected,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    sounds.playPop();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full max-w-[420px] mx-auto px-3 pt-3 pb-2 z-40">
      <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF5500] border-2 border-black rounded-lg flex items-center justify-center font-black text-white text-base shadow-[2px_2px_0px_#000000]">
            D
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-black text-sm tracking-tight text-black">DOODLE</span>
              <span className="font-black text-sm tracking-tight text-[#FF5500]">CALL</span>
            </div>
            <div className="text-[10px] font-bold text-gray-500 uppercase -mt-1 tracking-wider">
              {appState === 'calling' ? (role === 'host' ? 'Host View' : 'Guest View') : 'WebRTC P2P'}
            </div>
          </div>
        </div>

        {/* Status / Room badge */}
        <div className="flex items-center gap-2">
          {roomCode && (
            <button
              id="header-room-code-badge"
              onClick={handleCopy}
              title="Click to copy Room Code"
              className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border-2 border-black rounded-lg text-xs font-mono font-bold text-black transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span className="text-[#FF5500] font-black">#{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-700" />}
            </button>
          )}

          {appState === 'calling' && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black text-white rounded-lg text-xs font-bold border-2 border-black">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-[#FF5500]'}`} />
              <span className="text-[11px]">{isConnected ? 'LIVE' : 'SYNCING'}</span>
            </div>
          )}

          {appState === 'waiting' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-300 text-black border-2 border-black rounded-lg text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              <span>WAITING</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
