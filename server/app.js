require('dotenv').config();
const express = require('express');
const cors = require('cors');
const incidentsRouter = require('./routes/incidents');

const app = express();

app.use(cors());
app.use(express.json());
app.use(incidentsRouter);

module.exports = app;
