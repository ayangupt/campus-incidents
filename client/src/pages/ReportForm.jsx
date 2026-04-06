import { useState } from 'react';

const LOCATIONS = [
  'Regenstein Library',
  'Mansueto Library',
  'Harper Memorial Library',
  'Bartlett Dining Commons',
  'South Campus Dining Commons',
  'Ratner Athletic Center',
  'Henry Crown Field House',
  'Reynolds Club',
  'Ida Noyes Hall',
  'Stuart Hall',
  'Pick Hall',
  'Saieh Hall',
  'Kent Chemical Lab',
  'John Crerar Library',
  'Rockefeller Chapel',
  'Cobb Hall',
  'Rosenwald Hall',
  'Swift Hall',
  'Main Quadrangle',
  'Midway Plaisance',
  '53rd Street',
  '55th Street',
  '57th Street',
  'Max Palevsky Residential Commons',
  'South Campus Residence Hall',
  'Campus North Residential Commons',
  'International House',
  'Other',
];

const CATEGORIES = [
  'Safety',
  'Maintenance',
  'Theft',
  'Noise Complaint',
  'Vandalism',
  'Other',
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const initialForm = () => ({
  title: '',
  description: '',
  location: LOCATIONS[0],
  dateTime: new Date().toISOString().slice(0, 16),
  reporterName: '',
  reporterEmail: '',
  category: CATEGORIES[0],
  severity: 'Low',
});

const styles = {
  heading: {
    color: '#800000',
    marginBottom: 20,
  },
  radioGroup: {
    display: 'flex',
    gap: 20,
    marginTop: 4,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 400,
    fontSize: 14,
    cursor: 'pointer',
  },
  submitBtn: {
    marginTop: 8,
    fontSize: 16,
    padding: '12px 32px',
  },
};

export default function ReportForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit incident');
      }

      setStatus({ type: 'success', msg: 'Incident reported successfully!' });
      setForm(initialForm());
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 style={styles.heading}>Report an Incident</h1>

      {status && (
        <div className={status.type === 'success' ? 'banner-success' : 'banner-error'}>
          {status.msg}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Brief incident title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the incident in detail"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dateTime">Date &amp; Time</label>
            <input
              id="dateTime"
              type="datetime-local"
              name="dateTime"
              value={form.dateTime}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reporterName">Reporter Name</label>
            <input
              id="reporterName"
              type="text"
              name="reporterName"
              value={form.reporterName}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reporterEmail">Reporter Email</label>
            <input
              id="reporterEmail"
              type="email"
              name="reporterEmail"
              value={form.reporterEmail}
              onChange={handleChange}
              placeholder="you@uchicago.edu"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Severity</label>
            <div style={styles.radioGroup}>
              {SEVERITIES.map((sev) => (
                <label key={sev} style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="severity"
                    value={sev}
                    checked={form.severity === sev}
                    onChange={handleChange}
                  />
                  {sev}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </div>
    </>
  );
}
