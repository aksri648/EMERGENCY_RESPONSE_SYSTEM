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

export interface OrgAccount {
  id: string;
  orgName: string;
  department: Department;
  passwordHash: string;
}

export interface JwtPayload {
  orgId: string;
  department: Department;
  orgName: string;
}

export type WsMessageType = 'NEW_CASE' | 'CASE_UPDATE' | 'PING';

export interface WsMessage {
  type: WsMessageType;
  payload: EmergencyCase | { id: string; status: CaseStatus } | null;
}

declare global {
  namespace Express {
    interface Request {
      org?: JwtPayload;
    }
  }
}
