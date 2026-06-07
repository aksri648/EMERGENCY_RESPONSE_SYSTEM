import { EmergencyCase } from '../types';
import { DEPT_CONFIG } from '../constants/deptConfig';

interface Props {
  c: EmergencyCase | null;
  onClose: () => void;
}

export function CaseDetail({ c, onClose }: Props) {
  if (!c) return null;
  const dept = DEPT_CONFIG[c.department];

  return (
    <div className="case-detail-backdrop" onClick={onClose}>
      <div className="case-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="case-detail-header">
          <span className="case-detail-dept">
            {dept.icon} {dept.label}
          </span>
          <button className="case-detail-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <h2 className="case-detail-title">{c.summary}</h2>
        <div className="case-detail-meta">
          <span>Ticket #{c.id.slice(0, 8).toUpperCase()}</span>
          <span>Severity: {c.severity.toUpperCase()}</span>
          <span>Status: {c.status.toUpperCase()}</span>
        </div>
        {c.callerLocation && (
          <div className="case-detail-section">
            <h4>Location</h4>
            <p>📍 {c.callerLocation}</p>
          </div>
        )}
        <div className="case-detail-section">
          <h4>Required Actions</h4>
          <ol>
            {c.actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        </div>
        {c.photoUrl && (
          <div className="case-detail-section">
            <h4>Caller Photo</h4>
            <img className="case-detail-photo" src={c.photoUrl} alt="" />
          </div>
        )}
        {c.transcript && (
          <div className="case-detail-section">
            <h4>Transcript</h4>
            <pre className="case-detail-transcript">{c.transcript}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
