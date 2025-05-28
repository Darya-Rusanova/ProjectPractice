// Подключаем зависимости
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const User = require('../models/User');

// Создание нового рецепта
router.post('/', auth, async (req, res) => {
    try {
        // Получаем данные из тела запроса
        const {
            title,
            category,
            description,
            servings,
            cookingTime,
            ingredients,
            ingredientQuantities,
            image,
            steps
        } = req.body;

        // Проверяем обязательные поля
        if (!title || !category || !description || !servings || !cookingTime || !ingredients || !ingredientQuantities || !steps) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        // Проверяем длину массивов
        if (ingredients.length !== ingredientQuantities.length) {
            return res.status(400).json({ message: 'Ingredients and quantities must have the same length' });
        }

        // Проверяем наличие req.user
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Создаём новый рецепт
        const recipe = new Recipe({
            title,
            category,
            description,
            servings,
            cookingTime,
            ingredients,
            ingredientQuantities,
            ingredientCount: ingredients.length,
            image,
            steps,
            author: req.user._id // Устанавливаем автора
        });

        // Сохраняем рецепт
        await recipe.save();

        // Обновляем createdRecipes пользователя
        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { createdRecipes: recipe._id } },
            { new: true }
        );

        // Возвращаем рецепт
        res.status(201).json(recipe);
    } catch (err) {
        console.error('Error creating recipe:', err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;