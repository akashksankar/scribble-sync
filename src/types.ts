export type RoomRole = 'host' | 'guest';

export type AppState = 'landing' | 'waiting' | 'calling' | 'ended';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface Point {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
}

export interface DrawStroke {
  id: string;
  points: Point[];
  color: string;
  size: number; // normalized or base pixel size
  isEraser?: boolean;
  isHighlighter?: boolean;
  timestamp: number;
}

export interface EmojiStamp {
  id: string;
  emoji: string;
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  scale: number;
  rotation: number;
  timestamp: number;
}

export interface LaserPoint {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  timestamp: number;
}

export type DrawingTool = 'brush' | 'highlighter' | 'eraser' | 'laser' | 'stamp';

export type PeerDataMessage =
  | { type: 'draw_start'; stroke: DrawStroke }
  | { type: 'draw_move'; id: string; point: Point }
  | { type: 'draw_end'; id: string }
  | { type: 'clear' }
  | { type: 'undo'; strokeId: string }
  | { type: 'stamp'; stamp: EmojiStamp }
  | { type: 'laser_move'; point: LaserPoint }
  | { type: 'laser_end' }
  | { type: 'reaction'; emoji: string }
  | { type: 'ping'; timestamp: number }
  | { type: 'pong'; timestamp: number }
  | { type: 'media_state'; audio: boolean; video: boolean };

export interface PeerMediaState {
  audio: boolean;
  video: boolean;
}
