import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';

import authRouter from './routes/auth';
import tokenRouter from './routes/token';
import uploadRouter from './routes/upload';
import alertRouter from './routes/alert';
import casesRouter from './routes/cases';
import { initWsServer } from './services/ws';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter);
app.use('/token', tokenRouter);
app.use('/upload', uploadRouter);
app.use('/alert', alertRouter);
app.use('/cases', casesRouter);

const PORT = Number(process.env.PORT ?? 3000);

const server = http.createServer(app);
initWsServer(server);

server.listen(PORT, () => {
  console.log(`[ARIA backend] listening on :${PORT}`);
  console.log(`[ARIA backend] WS upgrade path: /ws?token=<jwt>`);
});
