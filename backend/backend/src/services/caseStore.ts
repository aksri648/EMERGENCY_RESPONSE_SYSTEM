import { EmergencyCase, CaseStatus, Department } from '../types';

const cases = new Map<string, EmergencyCase>();

export const caseStore = {
  add(c: EmergencyCase): void {
    cases.set(c.id, c);
  },

  getById(id: string): EmergencyCase | undefined {
    return cases.get(id);
  },

  getByDept(dept: Department): EmergencyCase[] {
    return Array.from(cases.values())
      .filter((c) => c.department === dept)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  updateStatus(id: string, status: CaseStatus): EmergencyCase | undefined {
    const c = cases.get(id);
    if (!c) return undefined;
    c.status = status;
    c.updatedAt = new Date().toISOString();
    cases.set(id, c);
    return c;
  },

  getAll(): EmergencyCase[] {
    return Array.from(cases.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
