import { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { URL } from 'url';
import { Department, JwtPayload, WsMessage } from '../types';

interface ClientInfo {
  department: Department;
  orgName: string;
}

const clients = new Map<WebSocket, ClientInfo>();
let wss: WebSocketServer | null = null;

export function initWsServer(server: HttpServer): void {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    try {
      const url = new URL(req.url ?? '', `http://${req.headers.host}`);
      if (url.pathname !== '/ws') {
        socket.destroy();
        return;
      }
      const token = url.searchParams.get('token');
      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      wss!.handleUpgrade(req, socket, head, (ws) => {
        clients.set(ws, { department: payload.department, orgName: payload.orgName });
        ws.send(JSON.stringify({ type: 'PING', payload: null } satisfies WsMessage));
        wss!.emit('connection', ws, req);
      });
    } catch (e) {
      console.warn('[ws] upgrade rejected:', (e as Error).message);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });

  setInterval(() => {
    for (const ws of clients.keys()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'PING', payload: null } satisfies WsMessage));
        } catch {}
      }
    }
  }, 25_000);
}

export function broadcastToDept(dept: Department, message: WsMessage): void {
  const payload = JSON.stringify(message);
  for (const [ws, info] of clients.entries()) {
    if (info.department !== dept) continue;
    if (ws.readyState !== WebSocket.OPEN) continue;
    try {
      ws.send(payload);
    } catch (e) {
      console.warn('[ws] broadcast failed:', (e as Error).message);
    }
  }
}
