import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import attendanceRoutes from './routes/attendanceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Mount Better Auth handler BEFORE express.json()
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
  res.send('Finova API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
