const express = require('express'), path = require('path'), cfg = require('../config/app_config');
const app = express();
const allowedOrigins = new Set((process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean));
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && allowedOrigins.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(!origin || allowedOrigins.has(origin) ? 204 : 403);
  }
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', require('./routes'));
app.use('/api', (q, s) => s.status(404).json({ error: 'Not found' }));
app.use(require('./middleware/auth').errorHandler);
app.listen(cfg.port, () => console.log(`Pet shop system running at http://localhost:${cfg.port}`));
