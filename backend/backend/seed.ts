import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { OrgAccount } from './src/types';

const orgs: Array<Omit<OrgAccount, 'passwordHash'> & { password: string }> = [
  { id: 'fire-dept-01', orgName: 'City Fire Department',      department: 'fire',    password: 'fire2024!' },
  { id: 'medical-01',   orgName: 'Emergency Medical Service', department: 'medical', password: 'med2024!' },
  { id: 'police-01',    orgName: 'City Police Department',    department: 'police',  password: 'police2024!' },
  { id: 'defense-01',   orgName: 'Civil Defense Authority',   department: 'defense', password: 'defense2024!' },
];

const seeded: OrgAccount[] = orgs.map((o) => ({
  id: o.id,
  orgName: o.orgName,
  department: o.department,
  passwordHash: bcrypt.hashSync(o.password, 10),
}));

const target = path.join(__dirname, 'src', 'data', 'orgs.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(seeded, null, 2));
console.log(`Seeded ${seeded.length} orgs → ${target}`);
