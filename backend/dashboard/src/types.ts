export type Department = 'police' | 'medical' | 'fire' | 'defense';
export type Severity = 'critical' | 'high' | 'medium';
export type CaseStatus = 'active' | 'responding' | 'resolved';

export interface EmergencyCase {
  id: string;
  department: Department;
  severity: Severity;
  status: CaseStatus;
  summary: string;
  actions: string[];
  photoUrl?: string;
  callerLocation?: string;
  transcript?: string;
  roomName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthOrg {
  orgName: string;
  department: Department;
  token: string;
}

export type WsMessage =
  | { type: 'NEW_CASE'; payload: EmergencyCase }
  | { type: 'CASE_UPDATE'; payload: { id: string; status: CaseStatus } }
  | { type: 'PING'; payload: null };
