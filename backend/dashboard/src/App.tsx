import { ReactNode } from 'react';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CasesProvider, useCases } from './context/CasesContext';
import { AlertOverlay } from './components/AlertOverlay';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Incidents } from './pages/Incidents';
import { History } from './pages/History';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { useState } from 'react';
import { CaseDetail } from './components/CaseDetail';
import { EmergencyCase } from './types';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { org, isLoading } = useAuth();
  if (isLoading) return <div className="boot-loader">Loading…</div>;
  if (!org) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OverlayHost() {
  const { activeAlert, dismissAlert } = useCases();
  const [openDetail, setOpenDetail] = useState<EmergencyCase | null>(null);
  return (
    <>
      <AlertOverlay
        alert={activeAlert}
        onAcknowledge={dismissAlert}
        onViewFullCase={(c) => {
          dismissAlert();
          setOpenDetail(c);
        }}
      />
      <CaseDetail c={openDetail} onClose={() => setOpenDetail(null)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <PrivateRoute>
                <CasesProvider>
                  <Dashboard />
                  <OverlayHost />
                </CasesProvider>
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Navigate to="/incidents" replace />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/history" element={<History />} />
            <Route path="/units" element={<PlaceholderPage title="Active Units" />} />
            <Route path="/map" element={<PlaceholderPage title="Incident Map" />} />
            <Route path="/intake" element={<PlaceholderPage title="Patient Intake" />} />
            <Route path="/hospitals" element={<PlaceholderPage title="Hospital Status" />} />
            <Route path="/profiles" element={<PlaceholderPage title="Suspect Profiles" />} />
            <Route path="/resources" element={<PlaceholderPage title="Resource Status" />} />
            <Route path="/protocols" element={<PlaceholderPage title="Protocol Library" />} />
          </Route>
          <Route path="*" element={<Navigate to="/incidents" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
