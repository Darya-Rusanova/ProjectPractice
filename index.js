// Подключаем зависимости
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Добавляем cors
const recipeRoutes = require('./routes/recipes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Загружаем переменные окружения из .env
dotenv.config();

// Создаём приложение Express
const app = express();

// Разрешаем CORS для фронтенда на http://localhost:8080
app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Парсим JSON в теле запросов
app.use(express.json());

// Подключаемся к MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Настраиваем маршруты
app.use('/api/recipes', recipeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Базовый маршрут для проверки
app.get('/', (req, res) => {
    res.send('Recipe API is running');
});

// Запускаем сервер
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));