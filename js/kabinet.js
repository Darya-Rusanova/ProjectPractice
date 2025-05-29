// JavaScript для личного кабинета (kabinet.html)

let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';

const errorDiv = document.getElementById('error');
const cabinetSection = document.getElementById('cabinet-section');
const logoutButton = document.getElementById('logout');
const recipeForm = document.getElementById('recipe-form');
const recipesList = document.getElementById('recipes-list');
const addIngredientButton = document.getElementById('add-ingredient');
const addStepButton = document.getElementById('add-step');
const ingredientsContainer = document.getElementById('ingredients-container');
const stepsContainer = document.getElementById('steps-container');

const API_BASE_URL = 'https://chudobludo-backend.onrender.com';

// Функция для выполнения запроса с повторными попытками
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempt ${i + 1} to fetch ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            console.log(`Response status for ${url}: ${response.status}`);
            return response;
        } catch (err) {
            console.error(`Fetch attempt ${i + 1} failed for ${url}:`, err.message);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Проверка токена при загрузке
async function checkToken() {
    if (!token || !userId) {
        console.log('No token, redirecting to login');
        window.location.href = 'signIn.html';
        return;
    }
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        cabinetSection.style.display = 'block';
        fetchRecipes();
    } catch (err) {
        console.error('Token check failed:', err.message);
        token = '';
        userId = '';
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = 'signIn.html';
        errorDiv.textContent = err.message.includes('Failed to fetch') 
            ? 'Не удалось проверить сессию. Сервер недоступен, попробуйте позже.' 
            : 'Сессия истекла: ' + err.message;
    }
}

checkToken();

// Обработчик выхода
logoutButton.addEventListener('click', () => {
    console.log('Logging out');
    token = '';
    userId = '';
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'signIn.html';
});

// Функция загрузки рецептов
async function fetchRecipes() {
    try {
        console.log('Fetching recipes');
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const recipes = await response.json();
        recipesList.innerHTML = '';
        if (recipes.length === 0) {
            recipesList.innerHTML = '<p>У вас пока нет рецептов</p>';
        } else {
            recipes.forEach(recipe => {
                const recipeDiv = document.createElement('div');
                recipeDiv.className = 'recipe';
                recipeDiv.innerHTML = `
                    <h4>${recipe.title}</h4>
                    <p>Категория: ${recipe.category}</p>
                    <p>Описание: ${recipe.description}</p>
                    ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" style="max-width: 200px;">` : ''}
                    <button class="delete-btn" data-id="${recipe._id}">Удалить</button>
                `;
                recipesList.appendChild(recipeDiv);
            });
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const recipeId = button.getAttribute('data-id');
                    if (confirm('Вы уверены, что хотите удалить этот рецепт?')) {
                        try {
                            const response = await fetchWithRetry(`${API_BASE_URL}/api/recipes/${recipeId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (!response.ok) {
                                throw new Error(`HTTP error! Status: ${response.status}`);
                            }
                            const recipeDiv = button.closest('.recipe');
                            recipeDiv.style.transition = 'opacity 0.5s';
                            recipeDiv.style.opacity = '0';
                            setTimeout(() => {
                                errorDiv.textContent = 'Рецепт удалён!';
                                fetchRecipes();
                            }, 500);
                        } catch (err) {
                            console.error('Delete Error:', err.message);
                            errorDiv.textContent = err.message.includes('Failed to fetch') 
                                ? 'Не удалось удалить рецепт. Сервер недоступен.' 
                                : 'Ошибка удаления рецепта: ' + err.message;
                        }
                    }
                });
            });
        }
    } catch (err) {
        console.error('Fetch Recipes Error:', err.message);
        errorDiv.textContent = err.message.includes('Failed to fetch') 
            ? 'Не удалось загрузить рецепты. Сервер недоступен.' 
            : 'Ошибка загрузки рецептов: ' + err.message;
    }
}

// Обработчик добавления ингредиента
addIngredientButton.addEventListener('click', () => {
    console.log('Adding ingredient');
    const ingredientDiv = document.createElement('div');
    ingredientDiv.className = 'ingredient';
    ingredientDiv.innerHTML = `
        <label>Ингредиент: <input type="text" class="ingredient-name" required></label>
        <label>Количество (г): <input type="number" class="ingredient-quantity" required></label>
    `;
    ingredientsContainer.appendChild(ingredientDiv);
});

// Обработчик добавления шага
addStepButton.addEventListener('click', () => {
    console.log('Adding step');
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step';
    stepDiv.innerHTML = `
        <label>Шаг: <input type="text" class="step-description" required></label>
        <label>Изображение шага (URL): <input type="text" class="step-image"></label>
    `;
    stepsContainer.appendChild(stepDiv);
});

// Обработчик добавления рецепта
recipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Recipe form submitted');
    const button = recipeForm.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Загрузка...';
    const recipe = {
        title: document.getElementById('recipe-title').value,
        category: document.getElementById('recipe-category').value,
        description: document.getElementById('recipe-description').value,
        servings: parseInt(document.getElementById('recipe-servings').value),
        cookingTime: parseInt(document.getElementById('recipe-cookingTime').value),
        ingredients: [],
        ingredientQuantities: [],
        image: document.getElementById('recipe-image').value,
        steps: []
    };

    const ingredientDivs = ingredientsContainer.getElementsByClassName('ingredient');
    for (let div of ingredientDivs) {
        const name = div.querySelector('.ingredient-name').value;
        const quantity = parseInt(div.querySelector('.ingredient-quantity').value);
        recipe.ingredients.push(name);
        recipe.ingredientQuantities.push(quantity);
    }

    const stepDivs = stepsContainer.getElementsByClassName('step');
    for (let div of stepDivs) {
        const description = div.querySelector('.step-description').value;
        const image = div.querySelector('.step-image').value;
        recipe.steps.push({ description, image });
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(recipe)
        });
        const data = await response.json();
        console.log('Recipe response data:', data);
        if (data._id) {
            recipeForm.reset();
            ingredientsContainer.innerHTML = `
                <div class="ingredient">
                    <label>Ингредиент: <input type="text" class="ingredient-name" required></label>
                    <label>Количество (г): <input type="number" class="ingredient-quantity" required></label>
                </div>
            `;
            stepsContainer.innerHTML = `
                <div class="step">
                    <label>Шаг: <input type="text" class="step-description" required></label>
                    <label>Изображение шага (URL): <input type="text" class="step-image"></label>
                </div>
            `;
            errorDiv.textContent = 'Рецепт добавлен!';
            fetchRecipes();
        } else {
            errorDiv.textContent = data.message || 'Ошибка добавления рецепта';
        }
    } catch (err) {
        console.error('Fetch Error:', err.message);
        errorDiv.textContent = err.message.includes('Failed to fetch') 
            ? 'Не удалось добавить рецепт. Сервер недоступен.' 
            : 'Ошибка добавления рецепта: ' + err.message;
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});