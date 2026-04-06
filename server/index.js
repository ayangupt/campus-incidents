require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');
const incidentsRouter = require('./routes/incidents');

const app = express();

app.use(cors());
app.use(express.json());
app.use(incidentsRouter);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await getDb();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Campus Incidents API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
