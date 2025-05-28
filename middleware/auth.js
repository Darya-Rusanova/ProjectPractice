// Подключаем зависимости
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Модель пользователя

// Middleware для проверки токена
module.exports = async function (req, res, next) {
    // Получаем токен из заголовка Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Проверяем наличие токена
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Декодируем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Отладка

        // Извлекаем ID пользователя
        // Токен может содержать либо decoded.user.id, либо decoded.id
        const userId = decoded.user?.id || decoded.id;
        if (!userId) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        // Находим пользователя в базе
        req.user = await User.findById(userId).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Переходим к следующему middleware
        next();
    } catch (err) {
        console.error('Token error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};