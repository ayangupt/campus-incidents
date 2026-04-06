import { useState, useEffect, useCallback } from 'react';
import AdminLogin from '../components/AdminLogin';
import IncidentTable from '../components/IncidentTable';

const CATEGORIES = ['All', 'Safety', 'Maintenance', 'Theft', 'Noise Complaint', 'Vandalism', 'Other'];
const SEVERITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['All', 'Open', 'In Review', 'Resolved'];

const styles = {
  heading: { color: '#800000', marginBottom: 16 },
  filterBar: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  filterLabel: { fontSize: 12, fontWeight: 600, color: '#666' },
  filterSelect: {
    padding: '6px 10px',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: 13,
    width: 'auto',
    minWidth: 130,
  },
  counts: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  logoutBtn: {
    background: 'transparent',
    color: '#800000',
    border: '1px solid #800000',
    padding: '6px 16px',
    fontSize: 13,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
};

export default function AdminDashboard() {
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken'));
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: 'All',
    severity: 'All',
    status: 'All',
  });

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setToken(null);
    setIncidents([]);
  };

  const handleUnauthorized = useCallback(() => {
    sessionStorage.removeItem('adminToken');
    setToken(null);
    setError('Session expired. Please log in again.');
  }, []);

  const fetchIncidents = useCallback(async (authToken) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/incidents', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch incidents');

      const data = await res.json();
      setIncidents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    if (token) fetchIncidents(token);
  }, [token, fetchIncidents]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    setError('');
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) throw new Error('Failed to update status');

      fetchIncidents(token);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFilterChange = (key) => (e) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
  };

  if (!token) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const filtered = incidents.filter((inc) => {
    if (filters.category !== 'All' && inc.category !== filters.category) return false;
    if (filters.severity !== 'All' && inc.severity !== filters.severity) return false;
    if (filters.status !== 'All' && inc.status !== filters.status) return false;
    return true;
  });

  return (
    <>
      <div style={styles.topBar}>
        <h1 style={styles.heading}>Admin Dashboard</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={styles.filterBar}>
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Category</span>
            <select
              value={filters.category}
              onChange={handleFilterChange('category')}
              style={styles.filterSelect}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Severity</span>
            <select
              value={filters.severity}
              onChange={handleFilterChange('severity')}
              style={styles.filterSelect}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Status</span>
            <select
              value={filters.status}
              onChange={handleFilterChange('status')}
              style={styles.filterSelect}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.counts}>
          Showing <strong>{filtered.length}</strong> of <strong>{incidents.length}</strong> incidents
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888' }}>Loading incidents…</p>
      ) : (
        <div className="card">
          <IncidentTable incidents={filtered} onStatusChange={handleStatusChange} />
        </div>
      )}
    </>
  );
}
