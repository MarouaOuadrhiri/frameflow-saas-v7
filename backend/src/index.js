const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : '*',
    methods: ['GET', 'POST'],
  },
});
app.set('io', io);

// Uploaded project files live on disk under backend/uploads/ (metadata in `project_files`).
fs.mkdirSync(path.join(__dirname, '..', 'uploads'), { recursive: true });

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : '*',
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

// Broadcast write operations so other connected clients can refresh instantly.
app.use((req, res, next) => {
  res.on('finish', () => {
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      res.statusCode < 400 &&
      req.path.startsWith('/api')
    ) {
      io.emit('ff:update', { method: req.method, path: req.path });
    }
  });
  next();
});

// Public
app.get('/api/health', (req, res) => res.json({ data: { ok: true } }));
app.use('/api/auth', require('./routes/auth'));

// Protected — every route below requires a valid JWT (req.user = { id, name, email })
app.use('/api/clients', auth, require('./routes/clients'));
app.use('/api/projects', auth, require('./routes/projects'));
app.use('/api/equipment', auth, require('./routes/equipment'));
app.use('/api/expenses', auth, require('./routes/expenses'));
app.use('/api/payments', auth, require('./routes/payments'));
app.use('/api/purchase-items', auth, require('./routes/purchase'));
app.use('/api/tasks', auth, require('./routes/tasks'));
app.use('/api/events', auth, require('./routes/events'));
app.use('/api/notifications', auth, require('./routes/notifications'));
app.use('/api/dashboard', auth, require('./routes/dashboard'));
app.use('/api/files', auth, require('./routes/files'));

// Unknown API route
app.use('/api', (req, res) => res.status(404).json({ error: { message: 'Not found' } }));

// Central error handler
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

if (require.main === module) {
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`FrameFlow API listening on port ${PORT}`);
  });
}

module.exports = app;
