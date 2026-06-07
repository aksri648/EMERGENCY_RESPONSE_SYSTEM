import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL!;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

export async function createAccessToken(opts: {
  identity: string;
  roomName: string;
  metadata?: string;
}): Promise<string> {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: opts.identity,
    ttl: '2h',
  });
  at.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  if (opts.metadata) at.metadata = opts.metadata;
  return await at.toJwt();
}

let _roomService: RoomServiceClient | null = null;

function roomService(): RoomServiceClient {
  if (_roomService) return _roomService;
  const httpUrl = LIVEKIT_URL.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
  _roomService = new RoomServiceClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  return _roomService;
}

export async function setRoomMetadata(roomName: string, metadata: string): Promise<void> {
  try {
    await roomService().updateRoomMetadata(roomName, metadata);
  } catch (e) {
    // Room may not exist yet — caller can still use metadata via token instead.
    console.warn(`[livekit] setRoomMetadata failed for ${roomName}:`, (e as Error).message);
  }
}

export async function sendRoomData(roomName: string, payload: object): Promise<void> {
  const data = Buffer.from(JSON.stringify(payload));
  try {
    await roomService().sendData(roomName, data, 0 /* DataPacket_Kind.RELIABLE */);
  } catch (e) {
    console.warn(`[livekit] sendRoomData failed for ${roomName}:`, (e as Error).message);
  }
}

export function getLiveKitUrl(): string {
  return LIVEKIT_URL;
}
