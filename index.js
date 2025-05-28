// ���������� �����������
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // ��������� cors
const recipeRoutes = require('./routes/recipes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// ��������� ���������� ��������� �� .env
dotenv.config();

// ������ ���������� Express
const app = express();

// ��������� CORS ��� ��������� �� http://localhost:8080
app.use(cors({
    origin: ['http://localhost:8080', 'https://chudobludo.fun'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ������ JSON � ���� ��������
app.use(express.json());

// ������������ � MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// ����������� ��������
app.use('/api/recipes', recipeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ������� ������� ��� ��������
app.get('/', (req, res) => {
    res.send('Recipe API is running');
});

// ��������� ������
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));