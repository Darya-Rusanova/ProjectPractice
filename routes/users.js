const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');

// Получить рецепты пользователя
router.get('/:id/recipes', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const recipes = await Recipe.find({ author: req.params.id });
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 
