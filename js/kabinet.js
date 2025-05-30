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
const categoryButtons = document.querySelectorAll('.category-btn');

// Проверка токена при загрузке
async function checkToken() {
    if (!token || !userId) {
        console.log('Токен отсутствует, перенаправляем на вход');
        window.location.href = 'signIn.html';
        return;
    }
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }
        cabinetSection.style.display = 'block';
        fetchRecipes();
    } catch (err) {
        console.error('Проверка токена не удалась:', err.message, err.stack);
        token = '';
        userId = '';
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = 'signIn.html';
        errorDiv.textContent = err.message.includes('Failed to fetch') || err.name === 'AbortError'
            ? 'Не удалось проверить сессию. Сервер недоступен, попробуйте позже.'
            : 'Сессия истекла: ' + err.message;
        if (err.message.includes('CORS')) {
            errorDiv.textContent += ' Возможна проблема с CORS. Проверьте настройки сервера.';
        }
    }
}

checkToken();

// Обработчик выхода
logoutButton.addEventListener('click', () => {
    console.log('Выход из системы');
    token = '';
    userId = '';
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'signIn.html';
});

// Функция загрузки рецептов
async function fetchRecipes() {
    try {
        console.log('Загрузка рецептов');
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }
        const recipes = await response.json();
        recipesList.innerHTML = '';
        if (recipes.length === 0) {
            recipesList.innerHTML = '<p>У вас пока нет рецептов</p>';
        } else {
            recipes.forEach(recipe => {
                const recipeDiv = document.createElement('div');
                recipeDiv.className = 'myRecipe';
                recipeDiv.innerHTML = `
                    <h4>${recipe.title}</h4>
                    <p>Категории: ${recipe.categories.join(', ')}</p>
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
                                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
                            }
                            const recipeDiv = button.closest('.myRecipe');
                            recipeDiv.style.transition = 'opacity 0.5s';
                            recipeDiv.style.opacity = '0';
                            setTimeout(() => {
                                errorDiv.textContent = 'Рецепт удалён!';
                                fetchRecipes();
                            }, 500);
                        } catch (err) {
                            console.error('Ошибка удаления:', err.message, err.stack);
                            errorDiv.textContent = err.message.includes('Failed to fetch') || err.name === 'AbortError'
                                ? 'Не удалось удалить рецепт. Сервер недоступен.'
                                : 'Ошибка удаления рецепта: ' + err.message;
                        }
                    }
                });
            });
        }
    } catch (err) {
        console.error('Ошибка загрузки рецептов:', err.message, err.stack);
        errorDiv.textContent = err.message.includes('Failed to fetch') || err.name === 'AbortError'
            ? 'Не удалось загрузить рецепты. Сервер недоступен.'
            : 'Ошибка загрузки рецептов: ' + err.message;
    }
}

// Обработчик выбора категорий
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        button.classList.toggle('active');
        console.log('Категория переключена:', button.dataset.category, button.classList.contains('active'));
    });
});

// Обработчик добавления ингредиента
addIngredientButton.addEventListener('click', () => {
    console.log('Добавление ингредиента');
    const ingredientDiv = document.createElement('div');
    ingredientDiv.className = 'ingredient';
    ingredientDiv.innerHTML = `
        <label>Ингредиент: <input type="text" class="ingredient-name" required></label>
        <label>Количество (г): <input type="number" class="ingredient-quantity" min="0" max="1000" step="0.01" required></label>
    `;
    ingredientsContainer.appendChild(ingredientDiv);
});

// Обработчик добавления шага
addStepButton.addEventListener('click', () => {
    console.log('Добавление шага');
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
    console.log('Форма рецепта отправлена');
    const button = recipeForm.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Загрузка...';

    // Собираем категории
    const selectedCategories = Array.from(categoryButtons)
        .filter(button => button.classList.contains('active'))
        .map(button => button.dataset.category);
    
    if (selectedCategories.length === 0) {
        errorDiv.textContent = 'Выберите хотя бы одну категорию';
        button.disabled = false;
        button.textContent = originalText;
        return;
    }

    // Собираем данные рецепта
    const servings = parseInt(document.getElementById('recipe-servings').value);
    const cookingTime = parseInt(document.getElementById('recipe-cookingTime').value);
    
    // Валидация числовых полей
    if (servings < 1 || servings > 100) {
        errorDiv.textContent = 'Порции должны быть от 1 до 100';
        button.disabled = false;
        button.textContent = originalText;
        return;
    }
    if (cookingTime < 1 || cookingTime > 100000) {
        errorDiv.textContent = 'Время приготовления должно быть от 1 до 100000 минут';
        button.disabled = false;
        button.textContent = originalText;
        return;
    }

    const recipe = {
        title: document.getElementById('recipe-title').value,
        categories: selectedCategories,
        description: document.getElementById('recipe-description').value,
        servings: servings,
        cookingTime: cookingTime,
        ingredients: [],
        ingredientQuantities: [],
        image: document.getElementById('recipe-image').value,
        steps: []
    };

    const ingredientDivs = ingredientsContainer.getElementsByClassName('ingredient');
    for (let div of ingredientDivs) {
        const name = div.querySelector('.ingredient-name').value;
        const quantity = parseFloat(div.querySelector('.ingredient-quantity').value);
        if (quantity < 0 || quantity > 1000) {
            errorDiv.textContent = 'Количество ингредиента должно быть от 0 до 1000';
            button.disabled = false;
            button.textContent = originalText;
            return;
        }
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
        console.log('Данные ответа на добавление рецепта:', data);
        if (data._id) {
            recipeForm.reset();
            categoryButtons.forEach(button => button.classList.remove('active'));
            ingredientsContainer.innerHTML = `
                <div class="ingredient">
                    <label>Ингредиент: <input type="text" class="ingredient-name" required></label>
                    <label>Количество (г): <input type="number" class="ingredient-quantity" min="0" max="1000" step="0.01" required></label>
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
        console.error('Ошибка добавления:', err.message, err.stack);
        errorDiv.textContent = err.message.includes('Failed to fetch') || err.name === 'AbortError'
            ? 'Не удалось добавить рецепт. Сервер недоступен.'
            : 'Ошибка добавления рецепта: ' + err.message;
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});