import { useEffect, useState } from 'react';
import { EmergencyCase } from '../types';
import { DEPT_CONFIG } from '../constants/deptConfig';

interface Props {
  alert: EmergencyCase | null;
  onAcknowledge: () => void;
  onViewFullCase: (c: EmergencyCase) => void;
}

const AUTO_DISMISS_SECONDS = 8;

export function AlertOverlay({ alert, onAcknowledge, onViewFullCase }: Props) {
  const [countdown, setCountdown] = useState(AUTO_DISMISS_SECONDS);

  useEffect(() => {
    if (!alert) return;
    setCountdown(AUTO_DISMISS_SECONDS);
    const interval = window.setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          window.clearInterval(interval);
          onAcknowledge();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [alert, onAcknowledge]);

  if (!alert) return null;

  const dept = DEPT_CONFIG[alert.department];
  const sevStyle = severityStyle(alert.severity);
  const ticketId = alert.id.slice(0, 8).toUpperCase();

  return (
    <div className="alert-overlay-root">
      <div className="alert-overlay-content">
        <div className="alert-overlay-header">🚨 EMERGENCY ALERT 🚨</div>

        <div className="alert-overlay-ticket-row">
          <div className="alert-overlay-ticket-left">
            <span className="alert-overlay-sev-badge" style={sevStyle}>
              {alert.severity.toUpperCase()}
            </span>
            <span className="alert-overlay-dept">
              {dept.icon} {dept.label}
            </span>
          </div>
          <div className="alert-overlay-ticket-right">
            Ticket #{ticketId} &nbsp;|&nbsp; Just now
          </div>
        </div>

        <div className="alert-overlay-main">
          <div className="alert-overlay-col-left">
            <div className="alert-overlay-summary">{alert.summary}</div>
            {alert.callerLocation && (
              <div className="alert-overlay-location">📍 {alert.callerLocation}</div>
            )}
            <div className="alert-overlay-divider" />
            <div className="alert-overlay-actions-header">REQUIRED ACTIONS</div>
            <ol className="alert-overlay-actions">
              {alert.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </div>
          {alert.photoUrl && (
            <div className="alert-overlay-col-right">
              <img src={alert.photoUrl} alt="Case" className="alert-overlay-photo" />
            </div>
          )}
        </div>

        <div className="alert-overlay-bottom">
          <div className="alert-overlay-countdown">
            Auto-dismiss in {countdown}s
          </div>
          <div className="alert-overlay-buttons">
            <button className="alert-overlay-btn-primary" onClick={onAcknowledge}>
              ACKNOWLEDGE
            </button>
            <button
              className="alert-overlay-btn-secondary"
              onClick={() => onViewFullCase(alert)}
            >
              VIEW FULL CASE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function severityStyle(s: EmergencyCase['severity']): React.CSSProperties {
  if (s === 'critical') {
    return {
      background: '#ff0000',
      color: '#fff',
      boxShadow: '0 0 12px #ff0000',
      animation: 'sevPulse 1.2s infinite',
    };
  }
  if (s === 'high') {
    return { background: '#f97316', color: '#fff' };
  }
  return { background: '#eab308', color: '#000' };
}
