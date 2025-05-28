const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
    description: { type: String, required: true },
    image: { type: String }
});

const recipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, required: true },
    servings: { type: Number, required: true },
    cookingTime: { type: Number, required: true }, // В минутах
    ingredients: [{ type: String, required: true }],
    ingredientQuantities: [{ type: Number, required: true }], // Граммовки в граммах
    ingredientCount: { type: Number, required: true }, // Автоматически вычисляется
    image: { type: String },
    steps: [stepSchema] // Массив шагов с описанием и фото
});

// Превентивная валидация: проверяем, что длина ingredients совпадает с ingredientQuantities
recipeSchema.pre('save', function (next) {
    this.ingredientCount = this.ingredients.length;
    if (this.ingredients.length !== this.ingredientQuantities.length) {
        return next(new Error('Ingredients and ingredientQuantities must have the same length'));
    }
    next();
});

module.exports = mongoose.model('Recipe', recipeSchema);
