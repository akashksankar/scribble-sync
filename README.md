<div align="center">
  <h1>馃枍锔� ScribbleSync</h1>
  <p><b>Instant, serverless WebRTC video rooms featuring a real-time synchronized drawing canvas.</b></p>
  <p>No login, no database鈥攋ust create a room code and start doodling! 馃敟</p>
</div>

<br/>

## 鉁� The Vibe & Features

- **鈿� Serverless Signaling:** Absolutely zero database required! We hijack PeerJS custom IDs to match room codes, connecting users peer-to-peer instantly.
- **馃帹 Synchronized Live Doodling:** An HTML5 `<canvas>` layered directly over the video feeds. Draw in real-time with your friend using WebRTC `RTCDataChannel`!
- **馃摫 Mobile-Optimized:** Built primarily for portrait mobile screens鈥攑erfect for quick catch-ups on the go.
- **馃暥锔� Bold 2D Aesthetic:** Neo-brutalism UI styling. Sharp contrasts, deep blacks, crisp whites, and a punchy vibrant orange. No soft shadows allowed here.
- **馃懟 Truly Ephemeral:** The moment the room closes, everything vanishes. No user data stored, ever.

---

## 馃洜锔� Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js (App Router)** | Full-stack React framework for structure and routing. |
| **Tailwind CSS** | Crafting that beautiful, harsh 2D orange/black UI. |
| **PeerJS** | Simplifying WebRTC connections and data channels. |
| **HTML5 Canvas** | The drawing layer for the live doodle feature. |

---

## 馃殌 Getting Started

Ready to run this locally? It takes less than two minutes.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/scribble-sync.git
cd scribble-sync
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. 

*(Pro tip: Open a second tab or window to test the P2P connection locally!)*

---

## 馃 How the "No-Database" Room Code Works

Instead of saving a generated room code to Firebase, we use **PeerJS's exact ID assignment**.
1. **Host** generates code `ABCD`.
2. **Host** initializes PeerJS as: `new Peer('doodle-room-ABCD')`.
3. **Guest** enters code `ABCD` and initializes: `new Peer()`.
4. **Guest** calls the host directly: `peer.call('doodle-room-ABCD', localStream)`.

Boom. Connected. 馃挜

---

<div align="center">
  <i>Built with good vibes and WebRTC magic. 鉁�</i>
</div>
