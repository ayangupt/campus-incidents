import { useState } from 'react';

const styles = {
  wrapper: {
    maxWidth: 400,
    margin: '60px auto',
  },
  heading: {
    textAlign: 'center',
    color: '#800000',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    width: '100%',
  },
  error: {
    color: '#721c24',
    background: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: 4,
    padding: '10px 14px',
    marginBottom: 16,
    fontSize: 14,
  },
};

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid password');
      }

      const data = await res.json();
      sessionStorage.setItem('adminToken', data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div className="card">
        <h2 style={styles.heading}>Admin Login</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
