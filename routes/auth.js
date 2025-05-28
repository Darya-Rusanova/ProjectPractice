const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Проверяем, существует ли пользователь с таким email
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        // Проверяем обязательные поля
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Все поля обязательны' });
        }

        // Создаём нового пользователя
        user = new User({ username, email, password });
        await user.save();

        // Создаём payload для токена
        const payload = {
            user: {
                id: user.id
            }
        };

        // Генерируем токен
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, userId: user._id });
        });
    } catch (err) {
        console.error('Ошибка регистрации:', err.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Вход пользователя
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Неверные учетные данные' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверные учетные данные' });
        }
        // Создаём payload для токена
        const payload = {
            user: {
                id: user.id
            }
        };
        // Генерируем токен
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, userId: user._id });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router;