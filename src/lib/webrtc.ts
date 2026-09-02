import { Peer, type DataConnection, type MediaConnection } from 'peerjs';
import type { PeerDataMessage, PeerMediaState } from '../types';

export const ROOM_PREFIX = 'doodle-room-';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatRoomId(code: string): string {
  return `${ROOM_PREFIX}${code.trim().toUpperCase()}`;
}

export function parseRoomCode(roomId: string): string {
  if (roomId.startsWith(ROOM_PREFIX)) {
    return roomId.substring(ROOM_PREFIX.length);
  }
  return roomId;
}

export const STUN_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class WebRTCManager {
  private peer: Peer | null = null;
  private mediaCall: MediaConnection | null = null;
  private dataConn: DataConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pingInterval: number | null = null;

  public onRemoteStream?: (stream: MediaStream) => void;
  public onDataMessage?: (msg: PeerDataMessage) => void;
  public onConnectionStateChange?: (connected: boolean) => void;
  public onError?: (error: string) => void;
  public onPingUpdated?: (latencyMs: number) => void;
  public onPeerMediaState?: (state: PeerMediaState) => void;

  public async getMediaStream(facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    if (this.localStream) {
      // Stop old video tracks if switching camera
      this.localStream.getVideoTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.localStream = stream;
      return stream;
    } catch (err: unknown) {
      console.warn('Camera/Mic permission failed or not available:', err);
      // Fallback: create a dummy canvas video + silent audio stream so app stays fully interactive!
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#FF5500';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Camera Disabled', 320, 240);
      }
      const stream = canvas.captureStream(10);
      // create silent audio track
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch {
        // Ignore audio fallback error
      }
      this.localStream = stream;
      return stream;
    }
  }

  public initHost(roomCode: string, localStream: MediaStream): Promise<string> {
    return new Promise((resolve, reject) => {
      this.localStream = localStream;
      const hostPeerId = formatRoomId(roomCode);

      try {
        this.peer = new Peer(hostPeerId, {
          config: STUN_CONFIG,
          debug: 1,
        });

        this.peer.on('open', (id) => {
          resolve(id);
        });

        this.peer.on('error', (err) => {
          console.error('Peer error (host):', err);
          if (err.type === 'unavailable-id') {
            this.onError?.('Room code already active! Please try generating a new code or joining instead.');
          } else {
            this.onError?.(err.message || 'Connection error occurred');
          }
          reject(err);
        });

        // Host listens for incoming media call
        this.peer.on('call', (call) => {
          this.mediaCall = call;
          call.answer(this.localStream || undefined);

          call.on('stream', (remoteStream) => {
            this.remoteStream = remoteStream;
            this.onRemoteStream?.(remoteStream);
          });

          call.on('close', () => {
            this.onConnectionStateChange?.(false);
          });

          call.on('error', (err) => {
            console.error('Call error:', err);
            this.onError?.(err.message);
          });
        });

        // Host listens for incoming data connection
        this.peer.on('connection', (conn) => {
          this.setupDataConnection(conn);
        });
      } catch (err: unknown) {
        reject(err);
      }
    });
  }

  public initGuest(roomCode: string, localStream: MediaStream): Promise<void> {
    return new Promise((resolve, reject) => {
      this.localStream = localStream;
      const targetHostId = formatRoomId(roomCode);

      try {
        this.peer = new Peer({
          config: STUN_CONFIG,
          debug: 1,
        });

        this.peer.on('open', () => {
          if (!this.peer) return;

          // Initiate Media Call to host
          const call = this.peer.call(targetHostId, this.localStream!);
          this.mediaCall = call;

          call.on('stream', (remoteStream) => {
            this.remoteStream = remoteStream;
            this.onRemoteStream?.(remoteStream);
          });

          call.on('close', () => {
            this.onConnectionStateChange?.(false);
          });

          call.on('error', (err) => {
            console.error('Guest call error:', err);
            this.onError?.(err.message);
          });

          // Initiate Data Connection to host
          const conn = this.peer.connect(targetHostId, {
            reliable: true,
          });
          this.setupDataConnection(conn);

          resolve();
        });

        this.peer.on('error', (err) => {
          console.error('Peer error (guest):', err);
          if (err.type === 'peer-unavailable') {
            this.onError?.(`Room "${roomCode}" not found. Please verify the code.`);
          } else {
            this.onError?.(err.message || 'Failed to connect to room');
          }
          reject(err);
        });
      } catch (err: unknown) {
        reject(err);
      }
    });
  }

  private setupDataConnection(conn: DataConnection) {
    this.dataConn = conn;

    conn.on('open', () => {
      this.onConnectionStateChange?.(true);
      this.startPingLoop();
    });

    conn.on('data', (data) => {
      const msg = data as PeerDataMessage;
      if (msg.type === 'ping') {
        this.sendData({ type: 'pong', timestamp: msg.timestamp });
        return;
      }
      if (msg.type === 'pong') {
        const latency = Math.round((Date.now() - msg.timestamp) / 2);
        this.onPingUpdated?.(Math.max(1, latency));
        return;
      }
      if (msg.type === 'media_state') {
        this.onPeerMediaState?.({ audio: msg.audio, video: msg.video });
        return;
      }
      this.onDataMessage?.(msg);
    });

    conn.on('close', () => {
      this.onConnectionStateChange?.(false);
      this.stopPingLoop();
    });

    conn.on('error', (err) => {
      console.error('Data connection error:', err);
      this.onError?.(err.message);
    });
  }

  public sendData(msg: PeerDataMessage) {
    if (this.dataConn && this.dataConn.open) {
      try {
        this.dataConn.send(msg);
      } catch (err) {
        console.warn('Failed to send data over data channel:', err);
      }
    }
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = window.setInterval(() => {
      if (this.dataConn && this.dataConn.open) {
        this.sendData({ type: 'ping', timestamp: Date.now() });
      }
    }, 2500);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const tracks = this.localStream.getAudioTracks();
    if (tracks.length === 0) return false;
    const newState = enabled !== undefined ? enabled : !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = newState));
    return newState;
  }

  public toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const tracks = this.localStream.getVideoTracks();
    if (tracks.length === 0) return false;
    const newState = enabled !== undefined ? enabled : !tracks[0].enabled;
    tracks.forEach((t) => (t.enabled = newState));
    return newState;
  }

  public async switchCamera(currentFacing: 'user' | 'environment'): Promise<{ stream: MediaStream; facing: 'user' | 'environment' }> {
    const targetFacing = currentFacing === 'user' ? 'environment' : 'user';
    const newStream = await this.getMediaStream(targetFacing);
    
    // Replace tracks on media connection if active
    if (this.mediaCall && this.mediaCall.peerConnection) {
      const senders = this.mediaCall.peerConnection.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (videoSender && newVideoTrack) {
        await videoSender.replaceTrack(newVideoTrack);
      }
    }
    return { stream: newStream, facing: targetFacing };
  }

  public destroy() {
    this.stopPingLoop();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }
    if (this.dataConn) {
      this.dataConn.close();
      this.dataConn = null;
    }
    if (this.mediaCall) {
      this.mediaCall.close();
      this.mediaCall = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
