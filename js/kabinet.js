// js/kabinet.js
// Полный корректный код для личного кабинета с добавлением рецептов
const errorDiv = document.getElementById('error');
const cabinetSection = document.getElementById('cabinet-section');
let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';

const recipeForm = document.getElementById('recipe-form');
const categoryButtons = document.querySelectorAll('.category-btn');
const servingsInput = document.getElementById('recipe-servings');
const cookingTimeInput = document.getElementById('recipe-cooking-time');
const recipeImageInput = document.getElementById('recipe-image');
const recipeImagePreview = document.getElementById('recipe-image-preview');
const removeRecipeImageButton = document.getElementById('remove-recipe-image-btn');
const ingredientsContainer = document.getElementById('ingredients-container');
const stepsContainer = document.getElementById('steps-container');

// Функция отображения уведомлений (предполагается реализация showNotification)
// showNotification(message, type) - type: 'error' или 'success'

// Функция ограничения ввода
function restrictInput(input, isDecimal = false) {
    input.addEventListener('input', () => {
        let value = input.value;
        if (isDecimal) {
            value = value.replace(/[^0-9,]/g, '');
            if (value.startsWith(',')) value = '0' + value;
            const parts = value.split(',');
            if (parts.length > 2) value = parts[0] + ',' + parts[1];
            if (parts[0].startsWith('0') && parts[0].length > 1 && !value.startsWith('0,')) {
                parts[0] = parts[0].replace(/^0+/, '') || '0';
                value = parts[0] + (parts[1] !== undefined ? ',' + parts[1] : '');
            }
            if (parts[1] && parts[1].length > 2) {
                parts[1] = parts[1].slice(0, 2);
                value = parts[0] + ',' + parts[1];
            }
        } else {
            value = value.replace(/[^0-9]/g, '').replace(/^0+/, '') || '0';
        }
        input.value = value;
    });
    input.addEventListener('keydown', (e) => {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
        if (isDecimal) {
            if ((e.key >= '0' && e.key <= '9') || e.key === ',' || allowedKeys.includes(e.key)) {
                if (e.key === ',' && input.value.includes(',')) e.preventDefault();
                return;
            }
        } else {
            if ((e.key >= '0' && e.key <= '9') || allowedKeys.includes(e.key)) return;
        }
        e.preventDefault();
    });
}

// Функция проверки границ
function enforceMinMax(input, isDecimal = false) {
    input.addEventListener('change', () => {
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        let value = input.value;
        if (isDecimal) {
            if (value.endsWith(',')) value = value.slice(0, -1);
            value = parseFloat(value.replace(',', '.')) || 0;
        } else {
            value = parseInt(value) || 0;
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

restrictInput(servingsInput);
restrictInput(cookingTimeInput);
enforceMinMax(servingsInput);
enforceMinMax(cookingTimeInput);

// Функция отображения превью изображения
function showImagePreview(input, previewElement, removeButton) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const maxSize = 5 * 1024 * 1024;
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            showNotification('Пожалуйста, загрузите изображение в формате JPEG или PNG', 'error');
            input.value = '';
            previewElement.innerHTML = '';
            if (removeButton) removeButton.style.display = 'none';
            return;
        }
        if (file.size > maxSize) {
            showNotification('Размер изображения не должен превышать 5 МБ', 'error');
            input.value = '';
            previewElement.innerHTML = '';
            if (removeButton) removeButton.style.display = 'none';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            previewElement.innerHTML = `<img src="${e.target.result}" style="max-width: 100px; border-radius: 4px; margin-top: 5px;" />`;
            if (removeButton) removeButton.style.display = 'block';
        };
        reader.onerror = () => {
            showNotification('Ошибка при загрузке изображения', 'error');
            input.value = '';
            previewElement.innerHTML = '';
            if (removeButton) removeButton.style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        previewElement.innerHTML = '';
        if (removeButton) removeButton.style.display = 'none';
    }
}

// Функция очистки изображения
function clearImageInput(input, previewElement, removeButton) {
    input.value = '';
    previewElement.innerHTML = '';
    if (removeButton) removeButton.style.display = 'none';
    input.setAttribute('required', 'required');
}

recipeImageInput.addEventListener('change', () => {
    showImagePreview(recipeImageInput, recipeImagePreview, removeRecipeImageButton);
    if (recipeImageInput.files[0]) recipeImageInput.removeAttribute('required');
    else recipeImageInput.setAttribute('required', 'required');
});
removeRecipeImageButton.addEventListener('click', () => {
    clearImageInput(recipeImageInput, recipeImagePreview, removeRecipeImageButton);
});

// Инициализация одного ингредиента
function initializeIngredient(ingredientDiv) {
    const quantityInput = ingredientDiv.querySelector('.quantity-input');
    const unitSelect = ingredientDiv.querySelector('.type-unit');
    const removeButton = ingredientDiv.querySelector('.remove-ingredient-btn');
    restrictInput(quantityInput, true);
    enforceMinMax(quantityInput, true);
    unitSelect.addEventListener('change', () => {
        if (unitSelect.value === 'пв') {
            quantityInput.value = '0';
            quantityInput.disabled = true;
        } else {
            quantityInput.disabled = false;
            if (quantityInput.value === '0') quantityInput.value = '';
        }
    });
    removeButton.addEventListener('click', () => {
        const count = ingredientsContainer.getElementsByClassName('ingredient').length;
        if (count <= 1) return showNotification('Должен быть хотя бы один ингредиент', 'error');
        ingredientDiv.remove();
    });
}

// Инициализация одного шага
function initializeStep(stepDiv) {
    const stepImageInput = stepDiv.querySelector('.step-image');
    const stepImagePreview = stepDiv.querySelector('.step-image-preview');
    const removeStepImageButton = stepDiv.querySelector('.remove-step-image-btn');
    const removeStepButton = stepDiv.querySelector('.remove-step-btn');
    stepImageInput.addEventListener('change', () => {
        showImagePreview(stepImageInput, stepImagePreview, removeStepImageButton);
    });
    removeStepImageButton.addEventListener('click', () => {
        clearImageInput(stepImageInput, stepImagePreview, removeStepImageButton);
    });
    removeStepButton.addEventListener('click', () => {
        const count = stepsContainer.getElementsByClassName('step').length;
        if (count <= 1) return showNotification('Должен быть хотя бы один шаг', 'error');
        stepDiv.remove();
        updateStepLabels();
    });
}

// Обновление меток шагов
function updateStepLabels() {
    const stepDivs = stepsContainer.getElementsByClassName('step');
    Array.from(stepDivs).forEach((stepDiv, index) => {
        const stepNumber = index + 1;
        const label = stepDiv.querySelector('label[for^="step-description-"]');
        const textarea = stepDiv.querySelector('.step-description');
        if (label && textarea) {
            label.childNodes[0].textContent = `Шаг ${stepNumber} (описание): `;
            label.setAttribute('for', `step-description-${stepNumber}`);
            textarea.id = `step-description-${stepNumber}`;
        }
    });
}

// Создание шага
function createStep(stepNumber) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step';
    const descriptionLabel = document.createElement('label');
    descriptionLabel.setAttribute('for', `step-description-${stepNumber}`);
    descriptionLabel.textContent = `Шаг ${stepNumber} (описание): `;
    const textarea = document.createElement('textarea');
    textarea.id = `step-description-${stepNumber}`;
    textarea.className = 'step-description';
    textarea.setAttribute('rows', '4');
    textarea.setAttribute('maxlength', '1000');
    textarea.setAttribute('required', 'required');
    descriptionLabel.appendChild(textarea);
    stepDiv.appendChild(descriptionLabel);
    const imageLabel = документ.createElement('label');
    imageLabel.textContent = 'Изображение шага: ';
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.className = 'step-image';
    imageInput.name = 'step-image';
    imageInput.accept = 'image/jpeg,image/png';
    imageLabel.appendChild(imageInput);
    stepDiv.appendChild(imageLabel);
    const imageControls = document.createElement('div');
    imageControls.className = 'image-controls';
    const imagePreview = document.createElement('div');
    imagePreview.className = 'step-image-preview';
    const removeImageButton = document.createElement('button');
    removeImageButton.type = 'button';
    removeImageButton.className = 'remove-btn remove-step-image-btn';
    removeImageButton.textContent = 'Удалить изображение';
    removeImageButton.style.display = 'none';
    imageControls.appendChild(imagePreview);
    imageControls.appendChild(removeImageButton);
    stepDiv.appendChild(imageControls);
    const removeStepButton = document.createElement('button');
    removeStepButton.type = 'button';
    removeStepButton.className = 'remove-btn remove-step-btn';
    removeStepButton.textContent = 'Удалить шаг';
    stepDiv.appendChild(removeStepButton);
    return stepDiv;
}

// Инициализация начальных элементов
const initialIngredient = ingredientsContainer.querySelector('.ingredient');
if (initialIngredient) initializeIngredient(initialIngredient);
const initialStep = stepsContainer.querySelector('.step');
if (initialStep) {
    initializeStep(initialStep);
    updateStepLabels();
} else {
    const firstStep = createStep(1);
    stepsContainer.appendChild(firstStep);
    initializeStep(firstStep);
    updateStepLabels();
}

// Добавление ингредиента
const addIngredientButton = document.getElementById('add-ingredient-btn');
addIngredientButton.addEventListener('click', () => {
    const count = ingredientsContainer.getElementsByClassName('ingredient').length;
    if (count >= 100) return showNotification('Слишком много ингредиентов', 'error');
    const ingredientDiv = document.createElement('div');
    ingredientDiv.className = 'ingredient';
    ingredientDiv.innerHTML = `
        <label>Ингредиент: <input type="text" class="ingredient-name" maxlength="50" required></label>
        <label>Количество: 
          <input type="text" class="quantity-input" min="0" max="1000" pattern="[0-9]+(,[0-9]{0,2})?" required>
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
        <button type="button" class="remove-btn remove-ingredient-btn">Удалить ингредиент</button>
    `;
    ingredientsContainer.appendChild(ingredientDiv);
    initializeIngredient(ingredientDiv);
});

// Добавление шага
const addStepButton = document.getElementById('add-step-btn');
addStepButton.addEventListener('click', () => {
    const count = stepsContainer.getElementsByClassName('step').length;
    if (count >= 50) return showNotification('Слишком много шагов', 'error');
    const stepNumber = count + 1;
    const stepDiv = createStep(stepNumber);
    stepsContainer.appendChild(stepDiv);
    initializeStep(stepDiv);
    updateStepLabels();
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
            .filter(btn => btn.classList.contains('active'))
            .map(btn => btn.dataset.category);

        // Валидация
        if (title.length > 50) {
            showNotification('Название слишком длинное', 'error');
            return;
        }
        if (description.length > 1000) {
            showNotification('Описание слишком длинное', 'error');
            return;
        }
        if (selectedCategories.length === 0) {
            showNotification('Выберите хотя бы одну категорию', 'error');
            return;
        }
        if (!recipeImageInput.files[0]) {
            showNotification('Добавьте изображение рецепта (обязательно)', 'error');
            return;
        }

        const ingredientDivs = Array.from(ingredientsContainer.getElementsByClassName('ingredient'));
        if (ingredientDivs.length === 0) {
            showNotification('Добавьте хотя бы один ингредиент', 'error');
            return;
        }
        for (let div of ingredientDivs) {
            const name = div.querySelector('.ingredient-name')?.value;
            const quantity = div.querySelector('.quantity-input')?.value;
            if (!name || name.length > 50) {
                showNotification(`Ингредиент "${name || ''}" не должен превышать 50 символов`, 'error');
                return;
            }
            if (!quantity || (!/^[0-9]+(,[0-9]{0,2})?$/.test(quantity) && quantity !== '0')) {
                showNotification(`Количество для "${name}" должно быть числом (например, 100 или 12,5)`, 'error');
                return;
            }
        }

        const stepDivs = Array.from(stepsContainer.getElementsByClassName('step'));
        if (stepDivs.length === 0) {
            showNotification('Добавьте хотя бы один шаг', 'error');
            return;
        }
        for (let div of stepDivs) {
            const desc = div.querySelector('.step-description')?.value;
            if (!desc || desc.length > 1000) {
                showNotification(`Описание шага не должно превышать 1000 символов`, 'error');
                return;
            }
        }

        const recipe = {
            title,
            categories: selectedCategories,
            description,
            servings: parseInt(servingsInput.value) || 1,
            cookingTime: parseInt(cookingTimeInput.value) || 0,
            ingredients: [],
            ingredientQuantities: [],
            ingredientUnits: [],
            steps: []
        };

        for (let div of ingredientDivs) {
            const name = div.querySelector('.ingredient-name').value;
            let quantity = div.querySelector('.quantity-input').value;
            const unit = div.querySelector('.type-unit').value;
            if (quantity.endsWith(',')) quantity = quantity.slice(0, -1);
            quantity = unit === 'пв' ? 0 : parseFloat(quantity.replace(',', '.')) || 0;
            recipe.ingredients.push(name);
            recipe.ingredientQuantities.push(quantity);
            recipe.ingredientUnits.push(unit);
        }

        for (let div of stepDivs) {
            const desc = div.querySelector('.step-description').value;
            recipe.steps.push({ description: desc });
        }

        if (recipe.ingredients.length !== recipe.ingredientQuantities.length || recipe.ingredients.length !== recipe.ingredientUnits.length) {
            showNotification('Ошибка: количество ингредиентов, их объёмов и единиц измерения не совпадает', 'error');
            return;
        }

        console.log('Recipe data before sending:', recipe);

        const formData = new FormData();
        formData.append('recipeData', JSON.stringify(recipe));
        if (recipeImageInput.files[0]) {
            formData.append('recipeImage', recipeImageInput.files[0]);
        }
        stepDivs.forEach((div, index) => {
            const stepImageInput = div.querySelector('.step-image');
            if (stepImageInput?.files[0]) {
                formData.append(`stepImages[${index}]`, stepImageInput.files[0]);
            }
        });

        const response = await fetch(`${API_BASE_URL}/api/recipes`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await response.json();
        if (data._id) {
            recipeForm.reset();
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Сброс ингредиентов
            ingredientsContainer.innerHTML = '';
            const newIng = document.createElement('div');
            newIng.className = 'ingredient';
            newIng.innerHTML = `
                <label>Ингредиент: <input type="text" class="ingredient-name" maxlength="50" required></label>
                <label>Количество: 
                  <input type="text" class="quantity-input" min="0" max="1000" pattern="[0-9]+(,[0-9]{0,2})?" required>
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
                <button type="button" class="remove-btn remove-ingredient-btn">Удалить ингредиент</button>
            `;
            ingredientsContainer.appendChild(newIng);
            initializeIngredient(newIng);
            // Сброс шагов
            stepsContainer.innerHTML = '';
            const newStep = createStep(1);
            stepsContainer.appendChild(newStep);
            initializeStep(newStep);
            updateStepLabels();
            recipeImagePreview.innerHTML = '';
            removeRecipeImageButton.style.display = 'none';
            stepsContainer.querySelectorAll('.step-image-preview').forEach(prev => prev.innerHTML = '');
            stepsContainer.querySelectorAll('.remove-step-image-btn').forEach(btn => btn.style.display = 'none');
            showNotification('Рецепт добавлен!', 'success');
            fetchRecipes();
            localStorage.removeItem('recipeCount');
            await fetchAndUpdateUserInfo({ redirectOnError: false });
        } else {
            showNotification(data.message || 'Ошибка добавления рецепта', 'error');
        }
    } catch (err) {
        console.error('Ошибка при отправке формы:', err);
        showNotification('Ошибка добавления: ' + err.message, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Добавить рецепт';
    }
});

// Проверка токена и загрузка рецептов
async function checkToken() {
    if (!token || !userId) {
        window.location.href = 'index.html';
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        cabinetSection.style.display = 'block';
        fetchRecipes();
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = 'index.html';
        showNotification('Ошибка авторизации: ' + err.message, 'error');
    }
}
checkToken();

// Обработчик выхода
const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
});

// Загрузка рецептов
async function fetchRecipes() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const recipes = await response.json();
        const recipesList = document.getElementById('recipes');
        recipesList.innerHTML = '';
        if (recipes.length === 0) {
            recipesList.innerHTML = '<p>У вас пока нет рецептов</p>';
            return;
        }
        recipes.forEach(recipe => {
            const recipeDiv = document.createElement('div');
            recipeDiv.className = 'myRecipe';
            const recipeLink = document.createElement('a');
            recipeLink.href = '#';
            recipeLink.className = 'recipe-link';
            const recipeContent = document.createElement('div');
            recipeContent.className = 'recipe-content';
            const imageDiv = document.createElement('div');
            imageDiv.className = 'recipe-image';
            if (recipe.image) imageDiv.innerHTML = `<img src="${recipe.image}" alt="${recipe.title}" />`;
            else imageDiv.innerHTML = '<div class="no-image">Нет изображения</div>';
            const infoDiv = document.createElement('div');
            infoDiv.className = 'recipe-info';
            infoDiv.innerHTML = `
                <h4>${recipe.title}</h4>
                <ul>
                    <li>${recipe.servings} порции</li>
                    <li>${recipe.cookingTime} минут</li>
                    <li>${recipe.ingredients.length} ингредиентов</li>
                </ul>
                <p class="status">Статус: ${recipe.status}</p>
            `;
            recipeContent.appendChild(imageDiv);
            recipeContent.appendChild(infoDiv);
            recipeLink.appendChild(recipeContent);
            recipeDiv.appendChild(recipeLink);
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.textContent = 'Удалить';
            deleteButton.dataset.id = recipe._id;
            recipeDiv.appendChild(deleteButton);
            recipesList.appendChild(recipeDiv);
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const recipeId = button.dataset.id;
                const deleteDialog = document.getElementById('delete');
                deleteDialog.showModal();
                const confirmDeleteButton = deleteDialog.querySelector('.confirm-btn');
                confirmDeleteButton.onclick = async () => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        showNotification('Рецепт удалён!', 'success');
                        deleteDialog.close();
                        fetchRecipes();
                        await fetchAndUpdateUserInfo({ redirectOnError: false });
                    } catch (err) {
                        showNotification('Ошибка удаления: ' + err.message, 'error');
                    }
                };
            });
        });
    } catch (err) {
        showNotification('Ошибка загрузки рецептов: ' + err.message, 'error');
    }
}
