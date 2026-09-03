// SehatAI — Video Call Signaling Server (WebSocket)
// Port: 3004
// Protocol: WebSocket messages are JSON: { type, from, to, data }
//
// Message types:
//   join    — { type: 'join', room: 'appt-xxx' }
//   offer   — { type: 'offer', from, to, sdp }
//   answer  — { type: 'answer', from, to, sdp }
//   ice     — { type: 'ice', from, to, candidate }
//   leave   — { type: 'leave', room }
//
// The signaling server just relays messages between peers in the same room.
// WebRTC media flows directly between browsers (P2P).

const PORT = 3004;

// Use Node's ws module via Bun's compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: PORT });

// Room → Set of WebSocket connections
const rooms = new Map();

console.log(`[video-signal] Signaling server running on port ${PORT}`);

wss.on('connection', (ws) => {
  let currentRoom = null;
  let clientId = Math.random().toString(36).slice(2, 10);

  console.log(`[video-signal] Client connected: ${clientId}`);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'join': {
          const room = msg.room;
          currentRoom = room;

          // Add to room
          if (!rooms.has(room)) rooms.set(room, new Set());
          rooms.get(room).add(ws);

          // Notify others in the room
          rooms.get(room).forEach((peer) => {
            if (peer !== ws && peer.readyState === 1) {
              peer.send(JSON.stringify({ type: 'peer-joined', from: clientId }));
            }
          });

          // If room has 2+ people, notify the newcomer
          const roomSize = rooms.get(room).size;
          if (roomSize > 1) {
            ws.send(JSON.stringify({ type: 'room-full', room, peers: roomSize - 1 }));
          }

          console.log(`[video-signal] ${clientId} joined room ${room} (size: ${roomSize})`);
          break;
        }

        case 'offer':
        case 'answer':
        case 'ice':
        case 'renegotiate': {
          // Relay to all other peers in the room
          if (!currentRoom || !rooms.has(currentRoom)) break;
          rooms.get(currentRoom).forEach((peer) => {
            if (peer !== ws && peer.readyState === 1) {
              peer.send(JSON.stringify({ ...msg, from: clientId }));
            }
          });
          break;
        }

        case 'leave': {
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom).delete(ws);
            rooms.get(currentRoom).forEach((peer) => {
              if (peer.readyState === 1) {
                peer.send(JSON.stringify({ type: 'peer-left', from: clientId }));
              }
            });
            if (rooms.get(currentRoom).size === 0) rooms.delete(currentRoom);
          }
          currentRoom = null;
          break;
        }
      }
    } catch (err) {
      console.error('[video-signal] Parse error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
      rooms.get(currentRoom).forEach((peer) => {
        if (peer.readyState === 1) {
          peer.send(JSON.stringify({ type: 'peer-left', from: clientId }));
        }
      });
      if (rooms.get(currentRoom).size === 0) rooms.delete(currentRoom);
    }
    console.log(`[video-signal] Client disconnected: ${clientId}`);
  });
});
