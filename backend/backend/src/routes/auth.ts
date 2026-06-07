import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { OrgAccount, JwtPayload } from '../types';
import { requireAuth } from '../middleware/auth';

const router = Router();

function loadOrgs(): OrgAccount[] {
  const file = path.join(__dirname, '..', 'data', 'orgs.json');
  if (!fs.existsSync(file)) {
    throw new Error(`orgs.json not found at ${file}. Run: npm run seed`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

router.post('/login', (req, res) => {
  const { orgId, password } = req.body ?? {};
  if (!orgId || !password) {
    return res.status(400).json({ error: 'orgId and password required' });
  }
  const orgs = loadOrgs();
  const org = orgs.find((o) => o.id === orgId);
  if (!org) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, org.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const payload: JwtPayload = {
    orgId: org.id,
    department: org.department,
    orgName: org.orgName,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '8h' });
  res.json({ token, org: { orgName: org.orgName, department: org.department } });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ orgName: req.org!.orgName, department: req.org!.department });
});

export default router;
