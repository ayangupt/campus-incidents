const express = require('express');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');
const { runQuery, allQuery } = require('../db');

const router = express.Router();

const VALID_CATEGORIES = ['Safety', 'Maintenance', 'Theft', 'Noise Complaint', 'Vandalism', 'Other'];
const VALID_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const VALID_STATUSES = ['Open', 'In Review', 'Resolved'];
const SORTABLE_COLUMNS = ['id', 'title', 'category', 'severity', 'status', 'created_at', 'updated_at', 'incident_date'];

// POST /api/incidents — public
router.post('/api/incidents', (req, res) => {
  try {
    const { title, description, location, incident_date, reporter_name, reporter_email, category, severity } = req.body;

    const missing = [];
    if (!title) missing.push('title');
    if (!description) missing.push('description');
    if (!location) missing.push('location');
    if (!incident_date) missing.push('incident_date');
    if (!reporter_name) missing.push('reporter_name');
    if (!reporter_email) missing.push('reporter_email');
    if (!category) missing.push('category');
    if (!severity) missing.push('severity');

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    if (!VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` });
    }

    const lastId = runQuery(
      `INSERT INTO incidents (title, description, location, incident_date, reporter_name, reporter_email, category, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, location, incident_date, reporter_name, reporter_email, category, severity]
    );

    const rows = allQuery('SELECT * FROM incidents WHERE id = ?', [lastId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating incident:', err);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// GET /api/incidents — admin auth required
router.get('/api/incidents', adminAuth, (req, res) => {
  try {
    const { category, severity, status, sort, order } = req.query;

    let sql = 'SELECT * FROM incidents WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (severity) {
      sql += ' AND severity = ?';
      params.push(severity);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    const sortCol = SORTABLE_COLUMNS.includes(sort) ? sort : 'created_at';
    const sortOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortCol} ${sortOrder}`;

    const rows = allQuery(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching incidents:', err);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// PATCH /api/incidents/:id/status — admin auth required
router.patch('/api/incidents/:id/status', adminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const existing = allQuery('SELECT * FROM incidents WHERE id = ?', [Number(id)]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    runQuery(
      "UPDATE incidents SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, Number(id)]
    );

    const updated = allQuery('SELECT * FROM incidents WHERE id = ?', [Number(id)]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating incident status:', err);
    res.status(500).json({ error: 'Failed to update incident status' });
  }
});

// POST /api/admin/login — public
router.post('/api/admin/login', (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
