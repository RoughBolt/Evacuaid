import express from 'express';
import http from 'http';
import cors from 'cors';
import { config } from './config';
import { initSocket } from './socket';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import incidentRoutes from './routes/incidents';
import zoneRoutes from './routes/zones';

const app = express();
const server = http.createServer(app);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'EvacuAid API',
    timestamp: new Date().toISOString(),
    version: '1.0.0-mvp',
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/incidents', incidentRoutes);
app.use('/zones', zoneRoutes);

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  await initSocket(server);
  
  server.listen(config.port, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║     🚨  EvacuAid API  🚨               ║');
    console.log(`║     Running on port ${config.port}                ║`);
    console.log(`║     Mode: ${config.nodeEnv.padEnd(29)}║`);
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log(`  Health:    http://localhost:${config.port}/health`);
    console.log(`  Auth:      http://localhost:${config.port}/auth`);
    console.log(`  Incidents: http://localhost:${config.port}/incidents`);
    console.log(`  Zones:     http://localhost:${config.port}/zones`);
    console.log('');
  });
};

startServer().catch((err) => {
  console.error('[FATAL] Failed to start server:', err);
  process.exit(1);
});

export default app;
