const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');

// Получить все рецепты
router.get('/', async (req, res) => {
    try {
        const recipes = await Recipe.find().populate('author', 'username');
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Получить рецепт по ID
router.get('/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).populate('author', 'username');
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
        res.json(recipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Добавить новый рецепт (требуется авторизация)
router.post('/', auth, async (req, res) => {
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

    // Валидация входных данных
    if (!ingredients || !ingredientQuantities || ingredients.length !== ingredientQuantities.length) {
        return res.status(400).json({ message: 'Ingredients and ingredientQuantities must have the same length' });
    }
    if (!steps || !steps.every(step => step.description)) {
        return res.status(400).json({ message: 'Each step must have a description' });
    }

    const recipe = new Recipe({
        title,
        category,
        author: req.user.id,
        description,
        servings,
        cookingTime,
        ingredients,
        ingredientQuantities,
        ingredientCount: ingredients.length,
        image,
        steps
    });

    try {
        const newRecipe = await recipe.save();
        // Добавляем рецепт в список createdRecipes пользователя
        await User.findByIdAndUpdate(req.user.id, { $push: { createdRecipes: newRecipe._id } });
        res.status(201).json(newRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 
