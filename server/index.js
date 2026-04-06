const { getDb } = require('./db');
const app = require('./app');

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
