import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import streamRoutes from './routes/streamRoutes';
import userRoutes from './routes/userRoutes';
import announcementRoutes from './routes/announcementRoutes';
import supportRoutes from './routes/supportRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/support', supportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Jamaat Waaz Relay API is running' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jamaat-relay')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
