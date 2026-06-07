import { CaseStatus, EmergencyCase } from '../types';
import { DEPT_CONFIG } from '../constants/deptConfig';

interface Props {
  c: EmergencyCase;
  onOpen: () => void;
  onUpdate: (status: CaseStatus) => void;
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const sec = Math.max(0, Math.round((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  return `${hr}h ago`;
}

const SEV_COLOR: Record<EmergencyCase['severity'], string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
};

const STATUS_COLOR: Record<CaseStatus, string> = {
  active: '#ef4444',
  responding: '#eab308',
  resolved: '#22c55e',
};

export function CaseCard({ c, onOpen, onUpdate }: Props) {
  const dept = DEPT_CONFIG[c.department];
  const sevColor = SEV_COLOR[c.severity];
  const isCritical = c.severity === 'critical';

  return (
    <div
      className={`case-card ${isCritical ? 'case-card-critical' : ''}`}
      style={{ borderLeftColor: sevColor }}
      onClick={onOpen}
    >
      <div className="case-card-row1">
        <span className="case-sev-badge" style={{ background: sevColor }}>
          {c.severity.toUpperCase()}
        </span>
        <span className="case-dept-label">{dept.icon} {dept.label}</span>
        <span className="case-time">{timeAgo(c.createdAt)}</span>
        <span className="case-status-badge" style={{ background: STATUS_COLOR[c.status] }}>
          {c.status.toUpperCase()}
        </span>
      </div>
      <div className="case-card-ticket">#{c.id.slice(0, 8).toUpperCase()}</div>
      <div className="case-card-summary">{c.summary}</div>
      {c.callerLocation && (
        <div className="case-card-location">📍 {c.callerLocation}</div>
      )}
      {c.photoUrl && (
        <img className="case-card-thumb" src={c.photoUrl} alt="" />
      )}
      <div className="case-card-actions">
        {c.actions.slice(0, 2).map((a, i) => (
          <span key={i} className="case-action-chip">
            {a.length > 40 ? `${a.slice(0, 40)}…` : a}
          </span>
        ))}
      </div>
      <div className="case-card-buttons" onClick={(e) => e.stopPropagation()}>
        {c.status !== 'responding' && c.status !== 'resolved' && (
          <button
            className="case-btn"
            onClick={() => onUpdate('responding')}
          >
            Mark Responding
          </button>
        )}
        {c.status !== 'resolved' && (
          <button
            className="case-btn case-btn-resolve"
            onClick={() => onUpdate('resolved')}
          >
            Mark Resolved
          </button>
        )}
      </div>
    </div>
  );
}
