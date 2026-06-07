import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CasesContext';
import { DEPT_CONFIG } from '../constants/deptConfig';

export function Sidebar() {
  const { org, logout } = useAuth();
  const { cases, isConnected, pendingCount } = useCases();
  const navigate = useNavigate();

  if (!org) return null;
  const dept = DEPT_CONFIG[org.department];

  const active = cases.filter((c) => c.status === 'active').length;
  const responding = cases.filter((c) => c.status === 'responding').length;
  const resolved = cases.filter((c) => c.status === 'resolved').length;

  return (
    <aside className="sidebar" style={{ borderTopColor: dept.color }}>
      <div className="sidebar-org">
        <div className="sidebar-icon">{dept.icon}</div>
        <div className="sidebar-org-name">{org.orgName}</div>
      </div>

      <nav className="sidebar-nav">
        {dept.menuItems.map((m) => (
          <NavLink
            key={m.path}
            to={m.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            style={({ isActive }) =>
              isActive ? { borderLeftColor: dept.color } : {}
            }
          >
            {m.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-stats">
        <div>🔴 Active <strong>{active}</strong></div>
        <div>🟡 Responding <strong>{responding}</strong></div>
        <div>🟢 Resolved <strong>{resolved}</strong></div>
      </div>

      <div className="sidebar-footer">
        <div className={`status-dot ${isConnected ? 'status-live' : 'status-dead'}`}>
          ● {isConnected ? 'LIVE' : 'DISCONNECTED'}
        </div>
        {pendingCount > 0 && (
          <div className="alert-bell">🔔 {pendingCount}</div>
        )}
        <button
          className="logout-btn"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
