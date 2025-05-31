let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';

const errorDiv = document.getElementById('error');
const cabinetSection = document.getElementById('cabinet-section');
const logoutButton = document.getElementById('logout');
const recipeForm = document.getElementById('recipe-form');
const recipesList = document.getElementById('recipes'); // Исправлено с recipes-list на recipes
const addIngredientButton = document.getElementById('add-ingredient-btn');
const addStepButton = document.getElementById('add-step-btn');
const ingredientsContainer = document.getElementById('ingredients-container');
const stepsContainer = document.getElementById('steps-container');
const categoryButtons = document.querySelectorAll('.category-btn');
const servingsInput = document.getElementById('recipe-servings');
const cookingTimeInput = document.getElementById('recipe-cooking-time');
const recipeImageInput = document.getElementById('recipe-image');
const recipeImagePreview = document.getElementById('recipe-image-preview');

// Функция для отображения предварительного просмотра изображения
function showImagePreview(input, previewElement) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const maxSize = 5 * 1024 * 1024; // 5 МБ
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            errorDiv.textContent = 'Пожалуйста, загрузите изображение в формате JPEG или PNG';
            input.value = '';
            previewElement.innerHTML = '';
            return;
        }
        if (file.size > maxSize) {
            errorDiv.textContent = 'Размер изображения не должен превышать 5 МБ';
            input.value = '';
            previewElement.innerHTML = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            previewElement.innerHTML = `<img src="${e.target.result}" style="max-width: 100px; border-radius: 4px; margin-top: 5px;" />`;
        };
        reader.readAsDataURL(file);
    } else {
        previewElement.innerHTML = '';
    }
}

// Обработчик предварительного просмотра для изображения рецепта
recipeImageInput.addEventListener('change', () => {
    showImagePreview(recipeImageInput, recipeImagePreview);
});

// Функция ограничения ввода
function restrictInput(input, isDecimal = false) {
    input.addEventListener('input', () => {
        if (input.disabled) return;
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
                value = parts[0] + (parts[1] !== undefined ? ',' + parts[1] : '');
            }
        } else {
            value = value.replace(/[^0-9]/g, '').replace(/^0+/, '') || '0';
        }
        input.value = value;
    });
    // Блокируем невалидные клавиши
    input.addEventListener('keydown', (e) => {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
        if (isDecimal) {
            if ((e.key >= '0' && e.key <= '9') || e.key === ',' || allowedKeys.includes(e.key)) {
                if (e.key === ',' && input.value.includes(',')) {
                    e.preventDefault();
                }
                return;
            }
        } else {
            if ((e.key >= '0' && e.key <= '9') || allowedKeys.includes(e.key)) {
                return;
            }
        }
        e.preventDefault();
    });
}

// Функция проверки границ
function enforceMinMax(input, isDecimal = false) {
    input.addEventListener('change', () => {
        if (input.disabled) return;
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
            value = parseInt(value);
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

// Функция управления полем количества
function handleUnitChange(select, quantityInput) {
    if (select.value === 'пв') {
        quantityInput.value = '0';
        quantityInput.disabled = true;
    } else {
        quantityInput.disabled = false;
        if (quantityInput.value === '0') {
            quantityInput.value = '';
        }
    }
}

// Применяем ограничения
restrictInput(servingsInput);
restrictInput(cookingTimeInput);
enforceMinMax(servingsInput);
enforceMinMax(cookingTimeInput);

// Применяем ограничения к начальному полю количества
const initialQuantityInput = document.querySelector('.quantity-input');
const initialUnitSelect = document.querySelector('.type-unit');
if (initialQuantityInput && initialUnitSelect) {
    restrictInput(initialQuantityInput, true);
    enforceMinMax(initialQuantityInput, true);
    initialUnitSelect.addEventListener('change', () => handleUnitChange(initialUnitSelect, initialQuantityInput));
    handleUnitChange(initialUnitSelect, initialQuantityInput);
} else {
    console.error('Initial quantity input or unit select not found');
}

// Проверка токена
async function checkToken() {
    if (!token || !userId) {
        console.log('Токен отсутствует, перенаправляем на вход');
        window.location.href = 'index.html';
        return;
    }
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        cabinetSection.style.display = 'block';
        fetchRecipes();
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = 'index.html';
        errorDiv.textContent = 'Ошибка авторизации: ' + err.message;
    }
}

checkToken();

// Обработчик выхода
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
});

// Загрузка рецептов
async function fetchRecipes() {
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const recipes = await response.json();
        recipesList.innerHTML = '';
        if (recipes.length === 0) {
            recipesList.innerHTML = '<p>У вас пока нет рецептов</p>';
        } else {
            recipes.forEach(recipe => {
                const recipeDiv = document.createElement('div');
                recipeDiv.className = 'myRecipe';
                const unitDisplayMap = {
                    'г': 'г', 'кг': 'кг', 'мл': 'мл', 'л': 'л', 'шт': 'шт.', 'ст': 'ст.', 'стл': 'ст.л.', 'чл': 'ч.л.', 'пв': 'по вкусу'
                };
                const ingredientsList = recipe.ingredients.map((ing, index) => {
                    const unit = recipe.ingredientUnits[index] || 'г';
                    const displayUnit = unitDisplayMap[unit];
                    const quantity = unit === 'пв' ? '' : recipe.ingredientQuantities[index];
                    return `${ing}: ${quantity} ${displayUnit}`;
                }).join(', ');
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
                                throw new Error(`HTTP ${response.status}`);
                            }
                            errorDiv.textContent = 'Рецепт удалён!';
                            fetchRecipes();
                        } catch (err) {
                            errorDiv.textContent = 'Ошибка удаления: ' + err.message;
                        }
                    }
                });
            });
        }
    } catch (err) {
        errorDiv.textContent = 'Ошибка загрузки рецептов: ' + err.message;
    }
}

// Обработчик категорий
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        button.classList.toggle('active');
    });
});

// Добавление ингредиента
addIngredientButton.addEventListener('click', () => {
    const ingredientCount = ingredientsContainer.getElementsByClassName('ingredient').length;
    if (ingredientCount >= 100) {
        errorDiv.textContent = 'Максимум 100 ингредиентов';
        return;
    }
    const ingredientDiv = document.createElement('div');
    ingredientDiv.className = 'ingredient';
    ingredientDiv.innerHTML = `
        <label>Ингредиент: <input type="text" class="ingredient-name" maxlength="50" required></label>
        <label>Количество: 
          <input type="text" class="quantity-input" min="0" max="1000" pattern="[0-9]+(,[0-9]*)?" inputmode="decimal" required>
          <select class="type-unit" required>
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
    const newQuantityInput = ingredientDiv.querySelector('.quantity-input');
    const newUnitSelect = ingredientDiv.querySelector('.type-unit');
    restrictInput(newQuantityInput, true);
    enforceMinMax(newQuantityInput, true);
    newUnitSelect.addEventListener('change', () => handleUnitChange(newUnitSelect, newQuantityInput));
    handleUnitChange(newUnitSelect, newQuantityInput);
});

// Добавление шага
addStepButton.addEventListener('click', () => {
    const stepCount = stepsContainer.getElementsByClassName('step').length;
    if (stepCount >= 50) {
        errorDiv.textContent = 'Максимум 50 шагов';
        return;
    }
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step';
    const stepNumber = stepCount + 1;
    stepDiv.innerHTML = `
        <label>Шаг ${stepNumber} (описание): <textarea class="step-description" maxlength="1000" required></textarea></label>
        <label>Изображение шага: <input type="file" class="step-image" name="step-image" accept="image/jpeg,image/png"></label>
        <div class="step-image-preview"></div>
    `;
    stepsContainer.appendChild(stepDiv);
    const newStepImageInput = stepDiv.querySelector('.step-image');
    const newStepImagePreview = stepDiv.querySelector('.step-image-preview');
    newStepImageInput.addEventListener('change', () => {
        showImagePreview(newStepImageInput, newStepImagePreview);
    });
});

// Обработчик отправки формы
recipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = document.getElementById('addRecipe-btn');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Загрузка...';

    try {
        const title = document.getElementById('recipe-title').value;
        const description = document.getElementById('recipe-description').value;
        const selectedCategories = Array.from(categoryButtons)
            .filter(button => button.classList.contains('active'))
            .map(button => button.dataset.category);

        // Валидация
        if (title.length > 50) {
            errorDiv.textContent = 'Название не должно превышать 50 символов';
            return;
        }
        if (description.length > 1000) {
            errorDiv.textContent = 'Описание не должно превышать 1000 символов';
            return;
        }
        if (selectedCategories.length === 0) {
            errorDiv.textContent = 'Выберите хотя бы одну категорию';
            return;
        }

        const ingredientDivs = ingredientsContainer.getElementsByClassName('ingredient');
        for (let div of ingredientDivs) {
            const name = div.querySelector('.ingredient-name').value;
            const quantity = div.querySelector('.quantity-input').value;
            if (name.length > 50) {
                errorDiv.textContent = `Ингредиент "${name}" не должен превышать 50 символов`;
                return;
            }
            if (!/^[0-9]+(,[0-9]*)?$/.test(quantity) && quantity !== '0') {
                errorDiv.textContent = `Количество для "${name}" должно быть числом (например, 100 или 12,5)`;
                return;
            }
        }

        const stepDivs = stepsContainer ? Array.from(stepsContainer.getElementsByClassName('step')) : [];
        for (let div of stepDivs) {
            const description = div.querySelector('.step-description').value;
            if (description.length > 1000) {
                errorDiv.textContent = `Описание шага не должно превышать 1000 символов`;
                return;
            }
        }

        const recipe = {
            title,
            categories: selectedCategories,
            description,
            servings: parseInt(servingsInput.value),
            cookingTime: parseInt(cookingTimeInput.value),
            ingredients: [],
            ingredientQuantities: [],
            ingredientUnits: [],
            steps: []
        };

        for (let div of ingredientDivs) {
            const name = div.querySelector('.ingredient-name').value;
            let quantity = div.querySelector('.quantity-input').value;
            const unit = div.querySelector('.type-unit').value;
            if (quantity.endsWith(',')) {
                quantity = quantity.slice(0, -1);
            }
            quantity = unit === 'пв' ? 0 : parseFloat(quantity.replace(',', '.'));
            recipe.ingredients.push(name);
            recipe.ingredientQuantities.push(quantity);
            recipe.ingredientUnits.push(unit);
        }

        for (let div of stepDivs) {
            const description = div.querySelector('.step-description').value;
            recipe.steps.push({ description });
        }

        const formData = new FormData();
        formData.append('recipeData', JSON.stringify(recipe));
        if (recipeImageInput.files[0]) {
            formData.append('recipeImage', recipeImageInput.files[0]);
        }
        stepDivs.forEach((div, index) => {
            const stepImageInput = div.querySelector('.step-image');
            if (stepImageInput?.files[0]) {
                formData.append('stepImages', stepImageInput.files[0]);
            }
        });

        const response = await fetchWithRetry(`${API_BASE_URL}/api/recipes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await response.json();
        if (data._id) {
            recipeForm.reset();
            categoryButtons.forEach(button => button.classList.remove('active'));
            ingredientsContainer.innerHTML = `
                <div class="ingredient">
                    <label>Ингредиент: <input type="text" class="ingredient-name" maxlength="50" required></label>
                    <label>Количество: 
                      <input type="text" class="quantity-input" min="0" max="1000" pattern="[0-9]+(,[0-9]*)?" inputmode="decimal" required>
                      <select class="type-unit" required>
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
            const newInitialQuantityInput = ingredientsContainer.querySelector('.quantity-input');
            const newInitialUnitSelect = ingredientsContainer.querySelector('.type-unit');
            restrictInput(newInitialQuantityInput, true);
            enforceMinMax(newInitialQuantityInput, true);
            newInitialUnitSelect.addEventListener('change', () => handleUnitChange(newInitialUnitSelect, newInitialQuantityInput));
            handleUnitChange(newInitialUnitSelect, newInitialQuantityInput);
            stepsContainer.innerHTML = `
                <div class="step">
                    <label>Шаг 1 (описание): <textarea class="step-description" maxlength="1000" required></textarea></label>
                    <label>Изображение шага: <input type="file" class="step-image" name="step-image" accept="image/jpeg,image/png"></label>
                    <div class="step-image-preview"></div>
                </div>
            `;
            recipeImagePreview.innerHTML = '';
            stepsContainer.querySelectorAll('.step-image-preview').forEach(preview => preview.innerHTML = '');
            const newStepImageInput = stepsContainer.querySelector('.step-image');
            const newStepImagePreview = stepsContainer.querySelector('.step-image-preview');
            newStepImageInput.addEventListener('change', () => {
                showImagePreview(newStepImageInput, newStepImagePreview);
            });
            errorDiv.textContent = 'Рецепт добавлен!';
            fetchRecipes();
        } else {
            errorDiv.textContent = data.message || 'Ошибка добавления рецепта';
        }
    } catch (err) {
        console.error('Ошибка при отправке формы:', err);
        errorDiv.textContent = 'Ошибка добавления: ' + err.message;
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});