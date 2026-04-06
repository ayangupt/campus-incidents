'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Set environment variables before requiring app
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD = 'test-password';

// Mock the database module so tests don't need a real SQLite database
jest.mock('../db');
const { runQuery, allQuery } = require('../db');

const app = require('../app');

// Helper: create a valid admin JWT token
function makeAdminToken() {
  return jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Sample valid incident payload
const validIncident = {
  title: 'Test Incident',
  description: 'Something happened near the quad.',
  location: 'Regenstein Library',
  incident_date: '2024-11-01T14:00',
  reporter_name: 'Jane Doe',
  reporter_email: 'jane@uchicago.edu',
  category: 'Safety',
  severity: 'Medium',
};

// ---------------------------------------------------------------------------
// POST /api/incidents
// ---------------------------------------------------------------------------
describe('POST /api/incidents', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates an incident and returns 201 with the new record', async () => {
    const newId = 42;
    runQuery.mockReturnValue(newId);
    allQuery.mockReturnValue([{ id: newId, ...validIncident, status: 'Open' }]);

    const res = await request(app).post('/api/incidents').send(validIncident);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: newId, title: validIncident.title, status: 'Open' });
    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(allQuery).toHaveBeenCalledWith('SELECT * FROM incidents WHERE id = ?', [newId]);
  });

  it('returns 400 when required fields are missing', async () => {
    const { title, category, ...rest } = validIncident;
    const res = await request(app).post('/api/incidents').send(rest);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
    expect(res.body.error).toMatch(/category/);
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid category', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({ ...validIncident, category: 'Unknown' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid category/);
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid severity', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({ ...validIncident, severity: 'Extreme' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid severity/);
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('returns 500 when the database throws an error', async () => {
    runQuery.mockImplementation(() => { throw new Error('DB failure'); });

    const res = await request(app).post('/api/incidents').send(validIncident);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create incident');
  });
});

// ---------------------------------------------------------------------------
// GET /api/incidents
// ---------------------------------------------------------------------------
describe('GET /api/incidents', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 401 when no authorization header is provided', async () => {
    const res = await request(app).get('/api/incidents');

    expect(res.status).toBe(401);
    expect(allQuery).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(allQuery).not.toHaveBeenCalled();
  });

  it('returns all incidents for an authenticated admin', async () => {
    const incidents = [
      { id: 1, ...validIncident, status: 'Open' },
      { id: 2, ...validIncident, title: 'Second incident', status: 'Resolved' },
    ];
    allQuery.mockReturnValue(incidents);

    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(allQuery).toHaveBeenCalledTimes(1);
  });

  it('applies category filter when provided', async () => {
    allQuery.mockReturnValue([]);

    await request(app)
      .get('/api/incidents?category=Safety')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    const [sql, params] = allQuery.mock.calls[0];
    expect(sql).toContain('AND category = ?');
    expect(params).toContain('Safety');
  });

  it('applies severity filter when provided', async () => {
    allQuery.mockReturnValue([]);

    await request(app)
      .get('/api/incidents?severity=High')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    const [sql, params] = allQuery.mock.calls[0];
    expect(sql).toContain('AND severity = ?');
    expect(params).toContain('High');
  });

  it('applies status filter when provided', async () => {
    allQuery.mockReturnValue([]);

    await request(app)
      .get('/api/incidents?status=Open')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    const [sql, params] = allQuery.mock.calls[0];
    expect(sql).toContain('AND status = ?');
    expect(params).toContain('Open');
  });

  it('sorts by a valid column in ascending order', async () => {
    allQuery.mockReturnValue([]);

    await request(app)
      .get('/api/incidents?sort=title&order=asc')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    const [sql] = allQuery.mock.calls[0];
    expect(sql).toMatch(/ORDER BY title ASC/);
  });

  it('defaults to sorting by created_at DESC for an unknown sort column', async () => {
    allQuery.mockReturnValue([]);

    await request(app)
      .get('/api/incidents?sort=bad_col&order=desc')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    const [sql] = allQuery.mock.calls[0];
    expect(sql).toMatch(/ORDER BY created_at DESC/);
  });

  it('returns 500 when the database throws an error', async () => {
    allQuery.mockImplementation(() => { throw new Error('DB failure'); });

    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch incidents');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/incidents/:id/status
// ---------------------------------------------------------------------------
describe('PATCH /api/incidents/:id/status', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 401 without authorization', async () => {
    const res = await request(app)
      .patch('/api/incidents/1/status')
      .send({ status: 'Resolved' });

    expect(res.status).toBe(401);
    expect(allQuery).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid status value', async () => {
    const res = await request(app)
      .patch('/api/incidents/1/status')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ status: 'Deleted' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid status/);
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('returns 404 when the incident does not exist', async () => {
    allQuery.mockReturnValue([]); // no incident found

    const res = await request(app)
      .patch('/api/incidents/999/status')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ status: 'Resolved' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Incident not found');
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('updates the incident status and returns the updated record', async () => {
    const existing = [{ id: 1, ...validIncident, status: 'Open' }];
    const updated = [{ id: 1, ...validIncident, status: 'Resolved' }];
    allQuery
      .mockReturnValueOnce(existing) // SELECT existing
      .mockReturnValueOnce(updated);  // SELECT after UPDATE

    const res = await request(app)
      .patch('/api/incidents/1/status')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ status: 'Resolved' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
    expect(runQuery).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when the database throws an error', async () => {
    allQuery.mockImplementation(() => { throw new Error('DB failure'); });

    const res = await request(app)
      .patch('/api/incidents/1/status')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ status: 'Resolved' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to update incident status');
  });
});

// ---------------------------------------------------------------------------
// POST /api/admin/login
// ---------------------------------------------------------------------------
describe('POST /api/admin/login', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns a JWT token on successful login', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ password: 'test-password' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.role).toBe('admin');
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid password');
  });

  it('returns 401 when password field is missing', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid password');
  });
});
