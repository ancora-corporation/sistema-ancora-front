import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import schoolRoutes from './routes/schools.js';
import userRoutes from './routes/users.js';
import classRoutes from './routes/classes.js';
import studentRoutes from './routes/students.js';
import studentCreateRoutes from './routes/studentsCreate.js';
import studentGuardianRoutes from './routes/studentGuardians.js';
import attendanceRoutes from './routes/attendance.js';
import gradeRoutes from './routes/grades.js';
import alertRoutes from './routes/alerts.js';
import interventionRoutes from './routes/interventions.js';
import mlRoutes from './routes/ml.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { pool } from './db/pool.js';

const app = express();
const origins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: origins, credentials: false, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Authorization', 'Content-Type'] }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', service: 'sistema-ancora-api' });
});

const api = express.Router();
api.use('/auth', authRoutes);
api.use('/schools', schoolRoutes);
api.use('/users', userRoutes);
api.use('/classes', classRoutes);
api.use('/students', studentRoutes);
api.use('/students', studentCreateRoutes);
api.use('/students', studentGuardianRoutes);
api.use('/attendance', attendanceRoutes);
api.use('/grades', gradeRoutes);
api.use('/alerts', alertRoutes);
api.use('/interventions', interventionRoutes);
api.use('/ml', mlRoutes);
app.use('/api/v1', api);

app.use(notFound);
app.use(errorHandler);

export default app;
