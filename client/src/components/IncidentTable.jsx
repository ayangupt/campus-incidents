import { useState, Fragment } from 'react';

const severityColors = {
  Low: '#28a745',
  Medium: '#FFA319',
  High: '#fd7e14',
  Critical: '#dc3545',
};

const styles = {
  badge: (bg, border) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    background: bg || 'transparent',
    color: bg ? '#fff' : '#800000',
    border: border ? '1px solid #800000' : 'none',
  }),
  statusSelect: {
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #ccc',
    fontSize: 13,
    cursor: 'pointer',
    width: 'auto',
  },
  expandedRow: {
    background: '#fdf6f0',
  },
  detailCell: {
    padding: '12px 16px',
    fontSize: 13,
    lineHeight: 1.6,
    color: '#555',
  },
  detailLabel: {
    fontWeight: 600,
    color: '#333',
    marginRight: 6,
  },
  clickableRow: {
    cursor: 'pointer',
  },
  noData: {
    textAlign: 'center',
    padding: 32,
    color: '#888',
    fontSize: 14,
  },
};

const STATUS_OPTIONS = ['Open', 'In Review', 'Resolved'];

export default function IncidentTable({ incidents, onStatusChange }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleRow = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (!incidents || incidents.length === 0) {
    return <div style={styles.noData}>No incidents to display.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Location</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc, idx) => {
            const isExpanded = expandedId === inc._id;
            const rowBg = idx % 2 === 0 ? '#fff' : '#fafafa';
            return (
              <Fragment key={inc._id}>
                <tr
                  style={{ ...styles.clickableRow, background: rowBg }}
                  onClick={() => toggleRow(inc._id)}
                >
                  <td>{inc.title}</td>
                  <td>
                    <span style={styles.badge(null, true)}>{inc.category}</span>
                  </td>
                  <td>
                    <span style={styles.badge(severityColors[inc.severity])}>
                      {inc.severity}
                    </span>
                  </td>
                  <td>{inc.location}</td>
                  <td>{new Date(inc.dateTime).toLocaleDateString()}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      value={inc.status}
                      onChange={(e) => onStatusChange(inc._id, e.target.value)}
                      style={styles.statusSelect}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                {isExpanded && (
                  <tr style={styles.expandedRow}>
                    <td colSpan={6} style={styles.detailCell}>
                      <p>
                        <span style={styles.detailLabel}>Description:</span>
                        {inc.description}
                      </p>
                      <p style={{ marginTop: 6 }}>
                        <span style={styles.detailLabel}>Reporter:</span>
                        {inc.reporterName}
                      </p>
                      <p style={{ marginTop: 4 }}>
                        <span style={styles.detailLabel}>Email:</span>
                        {inc.reporterEmail}
                      </p>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


