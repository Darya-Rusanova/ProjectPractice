let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';

const errorDiv = document.getElementById('error');
const cabinetSection = document.getElementById('cabinet-section');
const logoutButton = document.getElementById('logout');
const recipeForm = document.getElementById('recipe-form');
const recipesList = document.getElementById('recipes');
const addIngredientButton = document.getElementById('add-ingredient-btn');
const addStepButton = document.getElementById('add-step-btn');
const ingredientsContainer = document.getElementById('ingredients-container');
const stepsContainer = document.getElementById('steps-container');
const categoryButtons = document.querySelectorAll('.category-btn');
const servingsInput = document.getElementById('recipe-servings');
const cookingTimeInput = document.getElementById('recipe-cooking-time');
const recipeImageInput = document.getElementById('recipe-image');
const recipeImagePreview = document.getElementById('recipe-image-preview');
const removeRecipeImageButton = document.getElementById('remove-recipe-image-btn');
const deleteDialog = document.getElementById('delete');


// Функция для преобразования первой буквы первого слова в заглавную
function capitalizeFirstWord(text) {
    if (!text) return text;
    const trimmed = text.trimStart();
    if (!trimmed) return text;
    const words = trimmed.split(/\s+/);
    const firstWord = words[0];
    const capitalizedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    words[0] = capitalizedFirstWord;
    const newText = text.slice(0, text.indexOf(firstWord)) + words.join(' ');
    return newText;
}

// Функция для добавления точки в конце текста, если отсутствуют знаки ".", "!", "?", "..."
function ensureEndingWithPeriod(text) {
    if (!text) return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    const endings = ['.', '!', '?', '...'];
    if (!endings.some(ending => trimmed.endsWith(ending))) {
        return trimmed + '.';
    }
    return text;
}

// Функция для отображения предварительного просмотра изображения
function showImagePreview(input, previewElement, removeButton) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const maxSize = 5 * 1024 * 1024; // 5 МБ
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            errorDiv.textContent = 'Пожалуйста, загрузите изображение в формате JPEG или PNG';
            input.value = '';
            previewElement.innerHTML = '';
            if (removeButton) removeButton.style.display = 'none';
            return;
        }
        if (file.size > maxSize) {
            errorDiv.textContent = 'Размер изображения не должен превышать 5 МБ';
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
            errorDiv.textContent = 'Ошибка при загрузке изображения';
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

// Функция для очистки изображения
function clearImageInput(input, previewElement, removeButton) {
    input.value = '';
    previewElement.innerHTML = '';
    if (removeButton) removeButton.style.display = 'none';
    input.setAttribute('required', 'required');
    errorDiv.textContent = '';
}

// Обработчик предварительного просмотра и удаления для изображения рецепта
recipeImageInput.addEventListener('change', () => {
    showImagePreview(recipeImageInput, recipeImagePreview, removeRecipeImageButton);
    if (recipeImageInput.files[0]) {
        recipeImageInput.removeAttribute('required');
    } else {
        recipeImageInput.setAttribute('required', 'required');
    }
});
removeRecipeImageButton.addEventListener('click', () => {
    clearImageInput(recipeImageInput, recipeImagePreview, removeRecipeImageButton);
});

// Функция ограничения ввода
function restrictInput(input, isDecimal = false) {
    input.addEventListener('input', (e) => {
        if (input.disabled) return;
        let value = input.value;
        console.log(`Ввод в поле: ${value}, key: ${e.data}`); // Отладка
        if (isDecimal) {
            value = value.replace(/[^0-9,]/g, '');
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
        console.log(`Нажата клавиша: ${e.key}`); // Отладка
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

// Добавляем обработчики для заглавной буквы и точки
function initializeTextField(input, capitalize = false, addPeriod = false) {
    if (capitalize) {
        input.addEventListener('input', () => {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const originalValue = input.value;
            input.value = capitalizeFirstWord(input.value);
            // Восстанавливаем позицию курсора
            if (input.value !== originalValue) {
                input.setSelectionRange(start, end);
            }
        });
    }
    if (addPeriod) {
        input.addEventListener('change', () => {
            input.value = ensureEndingWithPeriod(input.value);
        });
    }
}

// Инициализация полей "Название" и "Описание"
const titleInput = document.getElementById('recipe-title');
const descriptionInput = document.getElementById('recipe-description');
initializeTextField(titleInput, true); // Заглавная буква для "Название"
initializeTextField(descriptionInput, true, true); // Заглавная буква и точка для "Описание"

// Функция для инициализации ингредиента
function initializeIngredient(ingredientDiv) {
    const quantityInput = ingredientDiv.querySelector('.quantity-input');
    const unitSelect = ingredientDiv.querySelector('.type-unit');
    const removeButton = ingredientDiv.querySelector('.remove-ingredient-btn');
    const ingredientNameInput = ingredientDiv.querySelector('.ingredient-name');
    
    restrictInput(quantityInput, true);
    enforceMinMax(quantityInput, true);
    unitSelect.addEventListener('change', () => handleUnitChange(unitSelect, quantityInput));
    handleUnitChange(unitSelect, quantityInput);
    removeButton.addEventListener('click', () => {
        const currentCount = ingredientsContainer.getElementsByClassName('ingredient').length;
        if (currentCount <= 1) {
            errorDiv.textContent = 'Должен быть хотя бы один ингредиент';
            return;
        }
        ingredientDiv.remove();
        errorDiv.textContent = '';
    });
    
    // Добавляем обработчик для заглавной буквы в поле "Ингредиент"
    initializeTextField(ingredientNameInput, true);
}

// Функция для создания шага через DOM-методы
function createStep(stepNumber) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step';

    // Создание первого label для описания
    const descriptionLabel = document.createElement('label');
    descriptionLabel.setAttribute('for', `step-description-${stepNumber}`);
    const labelText = document.createTextNode(`Шаг ${stepNumber} (описание): `);
    descriptionLabel.appendChild(labelText);

    const textarea = document.createElement('textarea');
    textarea.id = `step-description-${stepNumber}`;
    textarea.className = 'step-description';
    textarea.setAttribute('rows', '4');
    textarea.setAttribute('maxlength', '1000');
    textarea.setAttribute('required', 'required');
    descriptionLabel.appendChild(textarea);
    stepDiv.appendChild(descriptionLabel);

    // Создание второго label для изображения
    const imageLabel = document.createElement('label');
    imageLabel.textContent = 'Изображение шага: ';
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.className = 'step-image';
    imageInput.name = 'step-image';
    imageInput.accept = 'image/jpeg,image/png';
    imageLabel.appendChild(imageInput);
    stepDiv.appendChild(imageLabel);

    // Создание блока image-controls
    const imageControls = document.createElement('div');
    imageControls.className = 'image-controls';

    const imagePreview = document.createElement('div');
    imagePreview.className = 'step-image-preview';
    imageControls.appendChild(imagePreview);

    const removeImageButton = document.createElement('button');
    removeImageButton.type = 'button';
    removeImageButton.className = 'remove-btn remove-step-image-btn';
    removeImageButton.textContent = 'Удалить изображение';
    removeImageButton.style.display = 'none';
    imageControls.appendChild(removeImageButton);
    stepDiv.appendChild(imageControls);

    // Создание кнопки удаления шага
    const removeStepButton = document.createElement('button');
    removeStepButton.type = 'button';
    removeStepButton.className = 'remove-btn remove-step-btn';
    removeStepButton.textContent = 'Удалить шаг';
    stepDiv.appendChild(removeStepButton);

    return stepDiv;
}

// Функция для инициализации шага
function initializeStep(stepDiv) {
    const stepImageInput = stepDiv.querySelector('.step-image');
    const stepImagePreview = stepDiv.querySelector('.step-image-preview');
    const removeStepImageButton = stepDiv.querySelector('.remove-step-image-btn');
    const removeStepButton = stepDiv.querySelector('.remove-step-btn');
    const stepDescriptionTextarea = stepDiv.querySelector('.step-description');
    
    stepImageInput.addEventListener('change', () => {
        showImagePreview(stepImageInput, stepImagePreview, removeStepImageButton);
    });
    removeStepImageButton.addEventListener('click', () => {
        clearImageInput(stepImageInput, stepImagePreview, removeStepImageButton);
    });
    removeStepButton.addEventListener('click', () => {
        const currentCount = stepsContainer.getElementsByClassName('step').length;
        if (currentCount <= 1) {
            errorDiv.textContent = 'Должен быть хотя бы один шаг';
            return;
        }
        stepDiv.remove();
        updateStepLabels();
        errorDiv.textContent = '';
    });
    
    // Добавляем обработчики для заглавной буквы и точки в поле "Шаг N (описание)"
    initializeTextField(stepDescriptionTextarea, true, true);
}

// Функция для обновления нумерации шагов
function updateStepLabels() {
    const stepDivs = stepsContainer.getElementsByClassName('step');
    Array.from(stepDivs).forEach((stepDiv, index) => {
        const stepNumber = index + 1;
        const label = stepDiv.querySelector('label[for^="step-description-"]');
        const textarea = stepDiv.querySelector('.step-description');
        if (label && textarea) {
            const labelTextNode = label.childNodes[0];
            if (labelTextNode && labelTextNode.nodeType === Node.TEXT_NODE) {
                labelTextNode.textContent = `Шаг ${stepNumber} (описание): `;
            } else {
                label.replaceChild(document.createTextNode(`Шаг ${stepNumber} (описание): `), labelTextNode);
            }
            label.setAttribute('for', `step-description-${stepNumber}`);
            textarea.id = `step-description-${stepNumber}`;
            console.log(`Обновлён шаг ${stepNumber}, textarea id=${textarea.id}`);
        } else {
            console.error(`Ошибка: label или textarea не найдены для шага ${stepNumber}`);
        }
    });
}

// Инициализация начальных элементов
const initialIngredient = ingredientsContainer.querySelector('.ingredient');
if (initialIngredient) {
    initializeIngredient(initialIngredient);
} else {
    console.error('Initial ingredient not found');
}

const initialStep = stepsContainer.querySelector('.step');
if (initialStep) {
    console.log('Инициализация начального шага');
    initializeStep(initialStep);
    updateStepLabels();
    const initialTextarea = initialStep.querySelector('.step-description');
    if (initialTextarea) {
        console.log('Начальный шаг: textarea найдена, id=', initialTextarea.id);
    } else {
        console.error('Начальный шаг: textarea НЕ найдена');
    }
} else {
    console.error('Initial step not found');
    const firstStep = createStep(1);
    stepsContainer.appendChild(firstStep);
    initializeStep(firstStep);
    updateStepLabels();
    console.log('Создан первый шаг вручную');
}

// Добавление шага
addStepButton.addEventListener('click', () => {
    const stepCount = stepsContainer.getElementsByClassName('step').length;
    if (stepCount >= 50) {
        errorDiv.textContent = 'Максимум 50 шагов';
        return;
    }

    const stepNumber = stepCount + 1;
    const stepDiv = createStep(stepNumber);
    stepsContainer.appendChild(stepDiv);
    initializeStep(stepDiv);
    updateStepLabels();

    const addedTextarea = stepDiv.querySelector('.step-description');
    if (addedTextarea) {
        console.log(`Добавлен шаг ${stepNumber}, textarea присутствует: true, id=${addedTextarea.id}`);
    } else {
        console.error(`Textarea не найдена для шага ${stepNumber} после добавления`);
    }
});

// Проверка токена
async function checkToken() {
    if (!token || !userId) {
        console.log('Токен отсутствует, перенаправляем на вход');
        window.location.href = 'index.html';
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/recipes`, {
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
    // Отправляем событие об изменении авторизации
    window.dispatchEvent(new Event('authStateChanged'));
    window.location.href = 'index.html';
});

// Загрузка рецептов
async function fetchRecipes() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/recipes`, {
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
                
                // Создаём кликабельный блок
                const recipeLink = document.createElement('a');
                recipeLink.href = '#'; // Пустая ссылка, будет заменена позже
                recipeLink.className = 'recipe-link';
                
                // Внутренний контейнер для изображения и информации
                const recipeContent = document.createElement('div');
                recipeContent.className = 'recipe-content';
                
                // Изображение слева
                const imageDiv = document.createElement('div');
                imageDiv.className = 'recipe-image';
                if (recipe.image) {
                    imageDiv.innerHTML = `<img src="${recipe.image}" alt="${recipe.title}" />`;
                } else {
                    imageDiv.innerHTML = '<div class="no-image">Нет изображения</div>';
                }
                
                // Информация справа
                const infoDiv = document.createElement('div');
                infoDiv.className = 'recipe-info';
                infoDiv.innerHTML = `
                    <h4>${recipe.title}</h4>
                    <ul>
                        <li>${recipe.servings} порции</li>
                        <li>${recipe.cookingTime} минут</li>
                        <li>${recipe.ingredients.length} ингредиентов</li>
                    </ul>
                    <p class="status">Статус: На рассмотрении</p>
                `;
                
                // Собираем содержимое
                recipeContent.appendChild(imageDiv);
                recipeContent.appendChild(infoDiv);
                recipeLink.appendChild(recipeContent);
                recipeDiv.appendChild(recipeLink);
                
                // Кнопка удаления
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-btn';
                deleteButton.textContent = 'Удалить';
                deleteButton.dataset.id = recipe._id;
                recipeDiv.appendChild(deleteButton);
                
                recipesList.appendChild(recipeDiv);
            });
            
            // Добавляем обработчики для кнопок удаления
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.preventDefault(); // Предотвращаем переход по ссылке при клике на кнопку
                    const recipeId = button.dataset.id;
                    deleteDialog.showModal(); // Открываем модальное окно
                    const confirmDeleteButton = deleteDialog.querySelector('.confirm-btn');
                    confirmDeleteButton.onclick = async () => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}`);
                            }
                            errorDiv.textContent = 'Рецепт удалён!';
                            deleteDialog.close(); // Закрываем модальное окно
                            fetchRecipes(); // Обновляем список рецептов
                        } catch (err) {
                            errorDiv.textContent = 'Ошибка удаления: ' + err.message;
                        }
                    };
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
        if (!recipeImageInput.files[0]) {
            errorDiv.textContent = 'Добавьте изображение рецепта (обязательно)';
            return;
        }

        const ingredientDivs = ingredientsContainer ? Array.from(ingredientsContainer.getElementsByClassName('ingredient')) : [];
        if (ingredientDivs.length === 0) {
            errorDiv.textContent = 'Добавьте хотя бы один ингредиент';
            return;
        }
        for (let div of ingredientDivs) {
            const name = div.querySelector('.ingredient-name')?.value;
            const quantity = div.querySelector('.quantity-input')?.value;
            if (!name || name.length > 50) {
                errorDiv.textContent = `Ингредиент "${name || ''}" не должен превышать 50 символов`;
                return;
            }
            if (!quantity || (!/^[0-9]+(,[0-9]{0,2})?$/.test(quantity) && quantity !== '0')) {
                errorDiv.textContent = `Количество для "${name}" должно быть числом (например, 100 или 12,5)`;
                return;
            }
        }

        const stepDivs = stepsContainer ? Array.from(stepsContainer.getElementsByClassName('step')) : [];
        if (stepDivs.length === 0) {
            errorDiv.textContent = 'Добавьте хотя бы один шаг';
            return;
        }
        for (let div of stepDivs) {
            const description = div.querySelector('.step-description')?.value;
            if (!description || description.length > 1000) {
                errorDiv.textContent = `Описание шага не должно превышать 1000 символов`;
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
            if (quantity.endsWith(',')) {
                quantity = quantity.slice(0, -1);
            }
            quantity = unit === 'пв' ? 0 : parseFloat(quantity.replace(',', '.')) || 0;
            recipe.ingredients.push(name);
            recipe.ingredientQuantities.push(quantity);
            recipe.ingredientUnits.push(unit);
        }

        for (let div of stepDivs) {
            const description = div.querySelector('.step-description').value;
            recipe.steps.push({ description });
        }

        if (recipe.ingredients.length !== recipe.ingredientQuantities.length || recipe.ingredients.length !== recipe.ingredientUnits.length) {
            errorDiv.textContent = 'Ошибка: количество ингредиентов, их объёмов и единиц измерения не совпадает';
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
                formData.append('stepImages', stepImageInput.files[0]);
            }
        });

        const response = await fetch(`${API_BASE_URL}/api/recipes`, {
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

            // Сброс ингредиентов
            ingredientsContainer.innerHTML = '';
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

            // Сброс шагов через DOM-методы
            stepsContainer.innerHTML = '';
            const stepDiv = createStep(1);
            stepsContainer.appendChild(stepDiv);
            initializeStep(stepDiv);
            updateStepLabels();

            recipeImagePreview.innerHTML = '';
            removeRecipeImageButton.style.display = 'none';
            stepsContainer.querySelectorAll('.step-image-preview').forEach(preview => preview.innerHTML = '');
            stepsContainer.querySelectorAll('.remove-step-image-btn').forEach(btn => btn.style.display = 'none');
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