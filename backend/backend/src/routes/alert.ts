import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { caseStore } from '../services/caseStore';
import { broadcastToDept } from '../services/ws';
import { sendRoomData } from '../services/livekit';
import { Department, EmergencyCase, Severity } from '../types';

const router = Router();

const VALID_DEPTS: Department[] = ['police', 'medical', 'fire', 'defense'];
const VALID_SEVS: Severity[] = ['critical', 'high', 'medium'];

router.post('/', async (req, res) => {
  const provided = req.header('X-Agent-Secret');
  if (!provided || provided !== process.env.AGENT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const {
    department,
    severity,
    summary,
    actions,
    photoUrl,
    callerLocation,
    transcript,
    roomName,
  } = req.body ?? {};

  if (!VALID_DEPTS.includes(department)) {
    return res.status(400).json({ error: 'Invalid department' });
  }
  if (!VALID_SEVS.includes(severity)) {
    return res.status(400).json({ error: 'Invalid severity' });
  }
  if (!summary || typeof summary !== 'string') {
    return res.status(400).json({ error: 'summary required' });
  }
  if (!Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ error: 'actions[] required' });
  }
  if (!roomName || typeof roomName !== 'string') {
    return res.status(400).json({ error: 'roomName required' });
  }

  const now = new Date().toISOString();
  const newCase: EmergencyCase = {
    id: uuidv4(),
    department,
    severity,
    status: 'active',
    summary,
    actions,
    photoUrl: photoUrl || undefined,
    callerLocation: callerLocation || undefined,
    transcript: transcript || undefined,
    roomName,
    createdAt: now,
    updatedAt: now,
  };

  caseStore.add(newCase);
  broadcastToDept(department, { type: 'NEW_CASE', payload: newCase });

  void sendRoomData(roomName, {
    type: 'ALERT_SENT',
    department,
    severity,
  });

  res.json({ caseId: newCase.id });
});

export default router;
