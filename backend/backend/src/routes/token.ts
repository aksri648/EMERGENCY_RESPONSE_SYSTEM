import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createAccessToken, setRoomMetadata, getLiveKitUrl } from '../services/livekit';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { identity, roomName, photoUrl } = req.body ?? {};
    if (!identity) return res.status(400).json({ error: 'identity required' });

    const finalRoom = roomName || `room-${uuidv4()}`;
    const metadata = photoUrl ? String(photoUrl) : undefined;

    const token = await createAccessToken({
      identity,
      roomName: finalRoom,
      metadata,
    });

    if (photoUrl) {
      void setRoomMetadata(finalRoom, String(photoUrl));
    }

    res.json({ token, roomName: finalRoom, wsUrl: getLiveKitUrl() });
  } catch (e) {
    console.error('[/token] error:', e);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

export default router;
