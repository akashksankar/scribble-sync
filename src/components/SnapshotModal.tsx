import React from 'react';
import { Download, X, Check, Image as ImageIcon } from 'lucide-react';
import { sounds } from '../lib/sound';

interface SnapshotModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  const handleDownload = () => {
    sounds.playPop();
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `doodlecall-snapshot-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] rounded-2xl p-4 w-full max-w-md flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-[#FF5500] text-white rounded-md border border-black">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span className="font-black text-sm uppercase">Doodle Snapshot</span>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1 bg-white hover:bg-gray-100 border-2 border-black rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot Image */}
        <div className="w-full aspect-[9/14] sm:aspect-[3/4] bg-black rounded-xl overflow-hidden border-2 border-black">
          <img
            src={imageUrl}
            alt="DoodleCall Snapshot"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Download & Close buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="snapshot-download-btn"
            onClick={handleDownload}
            className="py-3 px-3 bg-[#FF5500] hover:bg-[#E64A19] text-white border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Download className="w-4 h-4" />
            <span>Save Photo</span>
          </button>

          <button
            id="snapshot-close-btn"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="py-3 px-3 bg-white hover:bg-gray-100 text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 active:translate-x-[1px] active:translate-y-[1px]"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
