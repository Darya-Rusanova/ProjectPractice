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
const servingsInput = document.getElementById('recipe-servings');
const cookingTimeInput = document.getElementById('recipe-cookingTime');

// Отладка: проверяем количество найденных кнопок
console.log('Найдено кнопок категорий:', categoryButtons.length, Array.from(categoryButtons).map(btn => btn.dataset.category));

// Функция ограничения ввода
function restrictInput(input, isDecimal = false) {
    input.addEventListener('input', () => {
        let value = input.value;
        if (isDecimal) {
            value = value.replace(/\./g, ',').replace(/[^0-9,]/g, '');
            if (value.startsWith(',')) {
                value = '0' + value;
            }
            const parts = value.split(',');
            if (parts.length > 2) {
                value = parts[0] + ',' + parts[1];
            }
            if (parts[0].startsWith('0') && parts[0].length > 1 && !value.startsWith('0,')) {
                parts[0] = parts[0].replace(/^0+/, '') || '0';
                value = parts[0] + (parts[1] !== undefined ? ',' + parts[1] : parts[0].endsWith(',') ? ',' : '');
            }
        } else {
            value = value.replace(/[^0-9]/g, '').replace(/^0+/, '') || '0';
        }
        input.value = value;
    });
}

// Функция проверки границ
function enforceMinMax(input, isDecimal = false) {
    input.addEventListener('change', () => {
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        let value = input.value;
        if (isDecimal) {
            if (value.endsWith(',')) {
                input.value = value.slice(0, -1);
                value = input.value;
            }
            value = parseFloat(value.replace(',', '.'));
        } else {
            value = parseFloat(value);
        }
        if (isNaN(value)) {
            input.value = isDecimal ? min.toString().replace('.', ',') : min;
        } else if (value < min) {
            input.value = isDecimal ? min.toString().replace('.', ',') : min;
        } else if (value > max) {
            input.value = isDecimal ? max.toString().replace('.', ',') : max;
        }
    });
}

// Применяем ограничения к начальным полям
restrictInput(servingsInput);
restrictInput(cookingTimeInput);
enforceMinMax(servingsInput);
enforceMinMax(cookingTimeInput);

// Применяем ограничения к начальному полю Количество
const initialQuantityInput = document.querySelector('.ingredient-quantity');
restrictInput(initialQuantityInput, true);
enforceMinMax(initialQuantityInput, true);

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
                // Формируем список ингредиентов с количеством и единицами
                const ingredientsList = recipe.ingredients.map((ing, index) => 
                    `${ing}: ${recipe.ingredientQuantities[index]}${recipe.ingredientUnits[index] || 'г'}`
                ).join(', ');
                recipeDiv.innerHTML = `
                    <h4>${recipe.title}</h4>
                    <p>Категории: ${recipe.categories.join(', ')}</p>
                    <p>Описание: ${recipe.description}</p>
                    <p>Ингредиенты: ${ingredientsList}</p>
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
        console.log('Категория переключена:', button.dataset.category, 'Active:', button.classList.contains('active'), 'Classes:', button.className);
    });
});

// Обработчик добавления ингредиента
addIngredientButton.addEventListener('click', () => {
    console.log('Добавление ингредиента');
    const ingredientDiv = document.createElement('div');
    ingredientDiv.className = 'ingredient';
    ingredientDiv.innerHTML = `
        <label>Ингредиент: <input type="text" class="ingredient-name" required></label>
        <label>Количество: 
          <input type="text" class="ingredient-quantity" min="0" max="1000" pattern="[0-9]+(,[0-9]*)?" inputmode="decimal" required>
          <select class="ingredient-unit" required>
            <option value="г">г</option>
            <option value="кг">кг</option>
            <option value="мл">мл</option>
            <option value="л">л</option>
            <option value="шт">шт.</option>
            <option value="ст">ст.</option>
            <option value="стл">ст.л.</option>
            <option value="чл">ч.л.</option>
            <option value="пв">по вкусу</option>
          </select>
        </label>
    `;
    ingredientsContainer.appendChild(ingredientDiv);
    const newQuantityInput = ingredientDiv.querySelector('.ingredient-quantity');
    restrictInput(newQuantityInput, true);
    enforceMinMax(newQuantityInput, true);
});

// Обработчик добавления шага
addStepButton.addEventListener('click', () => {
    const stepCount = stepsContainer.getElementsByClassName('step').length;
    if (stepCount >= 50) {
        errorDiv.textContent = 'Максимальное количество шагов (50) достигнуто';
        return;
    }
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
    const button = document.getElementById('addREc');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Загрузка...';

    const selectedCategories = Array.from(categoryButtons)
        .filter(button => button.classList.contains('active'))
        .map(button => button.dataset.category);
    
    if (selectedCategories.length === 0) {
        errorDiv.textContent = 'Выберите хотя бы одну категорию';
        button.disabled = false;
        button.textContent = originalText;
        return;
    }

    const servings = parseInt(servingsInput.value);
    const cookingTime = parseInt(cookingTimeInput.value);
    
    const recipe = {
        title: document.getElementById('recipe-title').value,
        categories: selectedCategories,
        description: document.getElementById('recipe-description').value,
        servings: servings,
        cookingTime: cookingTime,
        ingredients: [],
        ingredientQuantities: [],
        ingredientUnits: [],
        image: document.getElementById('recipe-image').value,
        steps: []
    };

    const ingredientDivs = ingredientsContainer.getElementsByClassName('ingredient');
    for (let div of ingredientDivs) {
        const name = div.querySelector('.ingredient-name').value;
        let quantity = div.querySelector('.ingredient-quantity').value;
        const unit = div.querySelector('.ingredient-unit').value;
        if (quantity.endsWith(',')) {
            quantity = quantity.slice(0, -1);
        }
        quantity = parseFloat(quantity.replace(',', '.'));
        recipe.ingredients.push(name);
        recipe.ingredientQuantities.push(quantity);
        recipe.ingredientUnits.push(unit);
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
                    <label>Количество: 
                      <input type="text" class="ingredient-quantity" min="0" max="1000" pattern="[0-9]+(,[0-9]*)?" inputmode="decimal" required>
                      <select class="ingredient-unit" required>
                        <option value="г">г</option>
                        <option value="кг">кг</option>
                        <option value="мл">мл</option>
                        <option value="л">л</option>
                        <option value="шт">шт.</option>
                        <option value="ст">ст.</option>
                        <option value="стл">ст.л.</option>
                        <option value="чл">ч.л.</option>
                        <option value="пв">по вкусу</option>
                      </select>
                    </label>
                </div>
            `;
            const newInitialQuantityInput = ingredientsContainer.querySelector('.ingredient-quantity');
            restrictInput(newInitialQuantityInput, true);
            enforceMinMax(newInitialQuantityInput, true);
            stepsContainer.innerHTML = `
                <div class="step">
                    <label>Шаг: <input type="text" class="step-description" required></label>
                    <label>Изображение шага: <input type="text" class="step-image"></label>
                </div>
            `;
            errorDiv.textContent = 'Рецепт добавлен!';
            fetchRecipes();
        } else {
            errorDiv.textContent = data.message || 'Ошибка добавления рецепта';
        }
    } catch (err) {
        console.error('Ошибка:', err.message, err);
        errorDiv.textContent = err.message.includes('Failed to fetch') || err.name === 'AbortError'
            ? 'Не удалось добавить рецепт. Сервер недоступен.'
            : 'Ошибка добавления рецепта: ' + err.message;
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});