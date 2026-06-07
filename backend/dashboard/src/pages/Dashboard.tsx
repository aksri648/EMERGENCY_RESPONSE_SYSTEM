import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { DEPT_CONFIG } from '../constants/deptConfig';
import { useEffect, useState } from 'react';

export function Dashboard() {
  const { org } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const dept = org ? DEPT_CONFIG[org.department] : null;

  useEffect(() => {
    if (dept) document.documentElement.style.setProperty('--dept-color', dept.color);
  }, [dept]);

  if (!org || !dept) return null;

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-title">ARIA — {dept.label}</div>
          <div className="dashboard-header-time">
            {now.toLocaleTimeString()}
          </div>
        </header>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
