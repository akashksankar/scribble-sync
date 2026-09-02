import React from 'react';
import { PhoneCall, RotateCcw, Sparkles, Trophy, Palette } from 'lucide-react';
import { sounds } from '../lib/sound';

interface CallEndedViewProps {
  roomCode: string;
  totalStrokes: number;
  totalStamps: number;
  onRestart: () => void;
}

export const CallEndedView: React.FC<CallEndedViewProps> = ({
  roomCode,
  totalStrokes,
  totalStamps,
  onRestart,
}) => {
  return (
    <div className="w-full max-w-[420px] mx-auto px-3 py-6 flex flex-col gap-4">
      <div className="bg-white border-3 border-black shadow-[6px_6px_0px_#000000] rounded-2xl p-6 text-center flex flex-col items-center gap-4">
        {/* Top badge */}
        <div className="w-16 h-16 bg-[#FF5500] border-3 border-black rounded-2xl shadow-[3px_3px_0px_#000000] flex items-center justify-center text-white text-3xl">
          🎨
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">
            Call Finished!
          </h2>
          <p className="text-xs text-gray-600 font-bold mt-1">
            Room #{roomCode} has been ephemerally cleared.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full my-1">
          <div className="p-3 bg-orange-50 border-2 border-black rounded-xl text-center">
            <span className="text-2xl font-black text-[#FF5500]">{totalStrokes}</span>
            <span className="block text-[10px] font-black uppercase text-gray-600 mt-0.5">
              Live Strokes
            </span>
          </div>

          <div className="p-3 bg-yellow-50 border-2 border-black rounded-xl text-center">
            <span className="text-2xl font-black text-black">{totalStamps}</span>
            <span className="block text-[10px] font-black uppercase text-gray-600 mt-0.5">
              Stickers Placed
            </span>
          </div>
        </div>

        {/* Start new call button */}
        <button
          id="btn-call-ended-restart"
          onClick={() => {
            sounds.playPop();
            onRestart();
          }}
          className="w-full py-3.5 bg-[#FF5500] hover:bg-[#E64A19] text-white border-3 border-black rounded-xl font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Call</span>
        </button>
      </div>
    </div>
  );
};
