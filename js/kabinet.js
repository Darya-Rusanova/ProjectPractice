// JavaScript для личного кабинета (kabinet.html)

// Инициализация переменных
let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';

const authSection = document.getElementById('auth-section');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const cabinetSection = document.getElementById('cabinet-section');
const errorDiv = document.getElementById('error');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutButton = document.getElementById('logout');
const recipeForm = document.getElementById('recipe-form');
const recipesList = document.getElementById('recipes-list');
const addIngredientButton = document.getElementById('add-ingredient');
const addStepButton = document.getElementById('add-step');
const ingredientsContainer = document.getElementById('ingredients-container');
const stepsContainer = document.getElementById('steps-container');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

const API_BASE_URL = 'https://chudobludo-backend.onrender.com';

// Проверка токена при загрузке
async function checkToken() {
    if (!token) {
        authSection.style.display = 'block';
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        cabinetSection.style.display = 'none';
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        authSection.style.display = 'none';
        cabinetSection.style.display = 'block';
        fetchRecipes();
    } catch (err) {
        token = '';
        userId = '';
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        authSection.style.display = 'block';
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        cabinetSection.style.display = 'none';
        errorDiv.textContent = 'Сессия истекла, пожалуйста, войдите или зарегистрируйтесь';
    }
}

checkToken();

// Переключение на форму регистрации
showRegisterLink.addEventListener('click', () => {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
});

// Переключение на форму входа
showLoginLink.addEventListener('click', () => {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
});

// Обработчик регистрации
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email-register').value;
    const password = document.getElementById('password-register').value;
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (data.token) {
            token = data.token;
            userId = data.userId;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            authSection.style.display = 'none';
            cabinetSection.style.display = 'block';
            errorDiv.textContent = '';
            fetchRecipes();
        } else {
            errorDiv.textContent = data.message || 'Ошибка регистрации';
        }
    } catch (err) {
        console.error('Fetch Error:', err);
        errorDiv.textContent = 'Ошибка соединения с сервером: ' + err.message;
    }
});

// Обработчик входа
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.token) {
            token = data.token;
            userId = data.userId;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            authSection.style.display = 'none';
            cabinetSection.style.display = 'block';
            errorDiv.textContent = '';
            fetchRecipes();
        } else {
            errorDiv.textContent = data.message || 'Ошибка входа';
        }
    } catch (err) {
        console.error('Fetch Error:', err);
        errorDiv.textContent = 'Ошибка соединения с сервером: ' + err.message;
    }
});

// Обработчик выхода
logoutButton.addEventListener('click', () => {
    token = '';
    userId = '';
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    authSection.style.display = 'block';
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
    cabinetSection.style.display = 'none';
    recipesList.innerHTML = '';
    errorDiv.textContent = '';
});

// Функция загрузки рецептов
async function fetchRecipes() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/recipes`, {
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
            // Добавляем обработчики для кнопок удаления
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const recipeId = button.getAttribute('data-id');
                    if (confirm('Вы уверены, что хотите удалить этот рецепт?')) {
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
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
                            console.error('Delete Error:', err);
                            errorDiv.textContent = 'Ошибка удаления рецепта: ' + err.message;
                        }
                    }
                });
            });
        }
    } catch (err) {
        console.error('Fetch Recipes Error:', err);
        errorDiv.textContent = `Ошибка загрузки рецептов: ${err.message}`;
    }
}

// Обработчик добавления ингредиента
addIngredientButton.addEventListener('click', () => {
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
        const response = await fetch(`${API_BASE_URL}/api/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(recipe)
        });
        const data = await response.json();
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
        console.error('Fetch Error:', err);
        errorDiv.textContent = 'Ошибка соединения с сервером';
    }
});