import React, { useState } from 'react';
import type { DrawingTool } from '../types';
import {
  Pencil,
  Highlighter,
  Eraser,
  Flame,
  RotateCcw,
  Trash2,
  Camera,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sticker,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sound';

interface DoodleToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  strokeSize: number;
  onSizeChange: (size: number) => void;
  selectedStampEmoji: string;
  onStampSelect: (emoji: string) => void;
  onUndo: () => void;
  onClear: () => void;
  onTakeSnapshot: () => void;
  canUndo: boolean;
  isDrawingEnabled: boolean;
  onToggleDrawing: () => void;
}

const COLOR_PALETTE = [
  { name: 'Punchy Orange', hex: '#FF5500' },
  { name: 'Crisp White', hex: '#FFFFFF' },
  { name: 'Deep Black', hex: '#000000' },
  { name: 'Electric Yellow', hex: '#FFD600' },
  { name: 'Neon Cyan', hex: '#00E5FF' },
  { name: 'Lime Green', hex: '#76FF03' },
];

const STROKE_SIZES = [
  { label: 'S', size: 3, dotSize: 'w-1.5 h-1.5' },
  { label: 'M', size: 7, dotSize: 'w-3 h-3' },
  { label: 'L', size: 14, dotSize: 'w-4.5 h-4.5' },
];

const EMOJI_STAMPS = ['🧡', '🔥', '👑', '⭐', '🎯', '🚀', '😎', '💡', '💯', '✨'];

export const DoodleToolbar: React.FC<DoodleToolbarProps> = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  strokeSize,
  onSizeChange,
  selectedStampEmoji,
  onStampSelect,
  onUndo,
  onClear,
  onTakeSnapshot,
  canUndo,
  isDrawingEnabled,
  onToggleDrawing,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showStampsMenu, setShowStampsMenu] = useState(false);

  const handleToolSelect = (tool: DrawingTool) => {
    sounds.playClick();
    onToolChange(tool);
    if (tool !== 'stamp') {
      setShowStampsMenu(false);
    }
  };

  const handleColorSelect = (hex: string) => {
    sounds.playClick();
    onColorChange(hex);
  };

  const handleClear = () => {
    sounds.playClear();
    onClear();
  };

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-[390px] px-3 pointer-events-auto">
      <div className="bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-2xl p-2.5 transition-all">
        {/* Top Header / Quick Row */}
        <div className="flex items-center justify-between gap-1 pb-2 border-b-2 border-black/10">
          <div className="flex items-center gap-1.5">
            <button
              id="toolbar-toggle-drawing-btn"
              onClick={onToggleDrawing}
              className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider border-2 border-black rounded-lg transition-all flex items-center gap-1 ${
                isDrawingEnabled
                  ? 'bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isDrawingEnabled ? 'Doodling ON' : 'Doodling OFF'}
            </button>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Live Canvas</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="toolbar-snapshot-btn"
              onClick={() => {
                sounds.playPop();
                onTakeSnapshot();
              }}
              title="Take Photo + Doodle Snapshot"
              className="p-1.5 bg-white hover:bg-gray-100 border-2 border-black rounded-lg text-black active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              id="toolbar-undo-btn"
              onClick={() => {
                sounds.playPop();
                onUndo();
              }}
              disabled={!canUndo}
              title="Undo Last Stroke"
              className={`p-1.5 border-2 border-black rounded-lg transition-all ${
                canUndo
                  ? 'bg-white hover:bg-gray-100 text-black active:translate-x-[1px] active:translate-y-[1px]'
                  : 'bg-gray-100 text-gray-400 border-gray-300 opacity-60 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="toolbar-clear-btn"
              onClick={handleClear}
              title="Clear Shared Canvas"
              className="p-1.5 bg-[#FF5500] hover:bg-[#E64A19] text-white border-2 border-black rounded-lg active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_#000000]"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              id="toolbar-collapse-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-lg text-black ml-1"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Tool Options */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden pt-2.5 flex flex-col gap-2.5"
            >
              {/* Tool Selection Row */}
              <div className="flex items-center justify-between gap-1">
                <div className="grid grid-cols-5 gap-1.5 w-full">
                  <button
                    id="tool-brush-btn"
                    onClick={() => handleToolSelect('brush')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 border-2 border-black rounded-xl font-bold text-xs transition-all ${
                      activeTool === 'brush'
                        ? 'bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]'
                        : 'bg-white hover:bg-gray-50 text-black'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pen</span>
                  </button>

                  <button
                    id="tool-highlighter-btn"
                    onClick={() => handleToolSelect('highlighter')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 border-2 border-black rounded-xl font-bold text-xs transition-all ${
                      activeTool === 'highlighter'
                        ? 'bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]'
                        : 'bg-white hover:bg-gray-50 text-black'
                    }`}
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark</span>
                  </button>

                  <button
                    id="tool-laser-btn"
                    onClick={() => handleToolSelect('laser')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 border-2 border-black rounded-xl font-bold text-xs transition-all ${
                      activeTool === 'laser'
                        ? 'bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]'
                        : 'bg-white hover:bg-gray-50 text-black'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Laser</span>
                  </button>

                  <button
                    id="tool-stamp-btn"
                    onClick={() => {
                      handleToolSelect('stamp');
                      setShowStampsMenu(!showStampsMenu);
                    }}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 border-2 border-black rounded-xl font-bold text-xs transition-all ${
                      activeTool === 'stamp'
                        ? 'bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]'
                        : 'bg-white hover:bg-gray-50 text-black'
                    }`}
                  >
                    <Sticker className="w-3.5 h-3.5" />
                    <span>{selectedStampEmoji}</span>
                  </button>

                  <button
                    id="tool-eraser-btn"
                    onClick={() => handleToolSelect('eraser')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 border-2 border-black rounded-xl font-bold text-xs transition-all ${
                      activeTool === 'eraser'
                        ? 'bg-[#FF5500] text-white shadow-[2px_2px_0px_#000000]'
                        : 'bg-white hover:bg-gray-50 text-black'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Erase</span>
                  </button>
                </div>
              </div>

              {/* Stamp Selection Tray (if stamp mode) */}
              {showStampsMenu && (
                <div className="p-2 bg-orange-50 border-2 border-black rounded-xl flex items-center justify-between gap-1 overflow-x-auto">
                  {EMOJI_STAMPS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        sounds.playPop();
                        onStampSelect(emoji);
                        onToolChange('stamp');
                      }}
                      className={`text-xl p-1.5 rounded-lg border-2 transition-transform hover:scale-125 ${
                        selectedStampEmoji === emoji && activeTool === 'stamp'
                          ? 'border-black bg-white shadow-[2px_2px_0px_#000000]'
                          : 'border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Color & Size Row */}
              <div className="flex items-center justify-between gap-2">
                {/* Colors */}
                <div className="flex items-center gap-1.5">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleColorSelect(c.hex)}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`w-6 h-6 rounded-full border-2 border-black transition-transform ${
                        activeColor === c.hex && activeTool !== 'eraser'
                          ? 'scale-125 ring-2 ring-[#FF5500] ring-offset-1 shadow-[1px_1px_0px_#000000]'
                          : 'hover:scale-110 opacity-90'
                      }`}
                    />
                  ))}
                </div>

                {/* Stroke Sizes */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 border-2 border-black rounded-xl">
                  {STROKE_SIZES.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => {
                        sounds.playClick();
                        onSizeChange(s.size);
                      }}
                      className={`w-6 h-6 flex items-center justify-center rounded-lg border font-bold text-[10px] transition-all ${
                        strokeSize === s.size
                          ? 'bg-black text-white border-black shadow-[1px_1px_0px_#FF5500]'
                          : 'bg-transparent text-black border-transparent hover:bg-white'
                      }`}
                    >
                      <div className={`rounded-full bg-current ${s.dotSize}`} />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
