import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { caseStore } from '../services/caseStore';
import { broadcastToDept } from '../services/ws';
import { CaseStatus } from '../types';

const router = Router();

const VALID_STATUS: CaseStatus[] = ['active', 'responding', 'resolved'];

router.get('/', requireAuth, (req, res) => {
  const dept = req.org!.department;
  res.json(caseStore.getByDept(dept));
});

router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body ?? {};
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const existing = caseStore.getById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Case not found' });
  if (existing.department !== req.org!.department) {
    return res.status(403).json({ error: 'Not your department' });
  }
  const updated = caseStore.updateStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Case not found' });
  broadcastToDept(updated.department, {
    type: 'CASE_UPDATE',
    payload: { id: updated.id, status: updated.status },
  });
  res.json(updated);
});

export default router;
