import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(orgId.trim(), password);
      setSuccess(true);
      setTimeout(() => navigate('/incidents'), 500);
    } catch (e) {
      setError('Invalid credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-title">
          🚨 <span>ARIA</span>
        </div>
        <div className="login-subtitle">Emergency Response Command</div>

        <label className="login-label">Organisation ID</label>
        <input
          className="login-input"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="login-label">Password</label>
        <input
          className="login-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">ACCESS GRANTED</div>}

        <button className="login-submit" type="submit" disabled={loading}>
          {loading ? '…' : 'ACCESS SYSTEM'}
        </button>
      </form>
    </div>
  );
}
