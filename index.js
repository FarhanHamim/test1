const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
require('./config/firebase.config');

const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' })); 
app.use(express.urlencoded({ limit: '25mb', extended: true }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('HobbyHub API is running');
});

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ 
    message: 'Something broke!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 