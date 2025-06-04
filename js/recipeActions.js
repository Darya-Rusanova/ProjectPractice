// --- 1) Схема получения полей формы и диалога “Редактировать” ---
const editDialog = document.getElementById('editDialog');
const editForm = document.getElementById('edit-recipe-form');
const deleteDialog = document.getElementById('delete')

// Поля внутри формы «Редактировать рецепт»
const titleInput = document.getElementById('edit-recipe-title');
const descriptionInput = document.getElementById('edit-recipe-description');
const categoryButtons = document.querySelectorAll('#edit-recipe-categories .category-btn');
const servingsInput = document.getElementById('edit-recipe-servings');
const cookingTimeInput = document.getElementById('edit-recipe-cooking-time');
const editIngredientsContainer = document.getElementById('edit-ingredients-container');
const editAddIngredientButton = document.getElementById('edit-add-ingredient-btn');
const editRecipeImageInput = document.getElementById('edit-recipe-image');
const editRecipeImagePreview = document.getElementById('edit-recipe-image-preview');
const editRemoveRecipeImageButton = document.getElementById('edit-remove-recipe-image-btn');
const editStepsContainer = document.getElementById('edit-steps-container');
const editAddStepButton = document.getElementById('edit-add-step-btn');

initializeTextField(titleInput, true);
initializeTextField(descriptionInput, true, true);
restrictInput(servingsInput,     false);
enforceMinMax(servingsInput,     false);
restrictInput(cookingTimeInput,  false);
enforceMinMax(cookingTimeInput,  false);


let editCurrentRecipeId = null;
let editCurrentRecipeElement = null;
let editCurrentFetchFunction = null;

function showDeleteDialog(recipeId, recipeElement) {
    editCurrentRecipeId = recipeId;
    editCurrentRecipeElement = recipeElement;
    const deleteDialog = document.getElementById('delete');
    if (deleteDialog) {
        deleteDialog.showModal();
    } else {
        deleteRecipe();
    }
}

async function deleteRecipe() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        if (document.getElementById('delete')) document.getElementById('delete').close();
        editCurrentRecipeId = null;
        editCurrentRecipeElement = null;
        editCurrentFetchFunction = null;
        return;
    }
    if (!editCurrentRecipeId) {
        showNotification('Ошибка: Не выбран рецепт для удаления', 'error');
        if (document.getElementById('delete')) document.getElementById('delete').close();
        editCurrentRecipeId = null;
        editCurrentRecipeElement = null;
        editCurrentFetchFunction = null;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/${editCurrentRecipeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        showNotification('Рецепт удалён!', 'success');
        if (editCurrentRecipeElement && editCurrentRecipeElement.parentNode) {
            const parentList = editCurrentRecipeElement.parentNode;
            editCurrentRecipeElement.parentNode.removeChild(editCurrentRecipeElement);
            if (parentList.getElementsByClassName('recipe-card').length === 0) {
                let emptyMessage = '';
                if (parentList.id === 'publishedRecipesList') {
                    emptyMessage = `
                        <p>Нет опубликованных рецептов.</p>
                    `;
                } else if (parentList.id === 'rejectedRecipesList') {
                    emptyMessage = `
                        <p>Нет отклонённых рецептов</p>
                    `;
                }
                parentList.innerHTML = emptyMessage;
            }
        }
    } catch (err) {
        showNotification(`Ошибка удаления: ${err.message}`, 'error');
    } finally {
        if (document.getElementById('delete')) document.getElementById('delete').close();
        editCurrentRecipeId = null;
        editCurrentRecipeElement = null;
        editCurrentFetchFunction = null;
    }
}

// --- 3) Функции для инициализации новых ингредиентов/шагов при редактировании (скопированы из kabinet.js) ---
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
        const currentCount = editIngredientsContainer.getElementsByClassName('ingredient').length;
        if (currentCount <= 1) {
            showNotification('Должен быть хотя бы один ингредиент', 'error');
            return;
        }
        ingredientDiv.remove();
    });
    initializeTextField(ingredientNameInput, true);
}

function createStep(stepNumber) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step';

    const descriptionLabel = document.createElement('label');
    descriptionLabel.setAttribute('for', `edit-step-description-${stepNumber}`);
    descriptionLabel.innerHTML = `Шаг ${stepNumber} (описание): `;
    const textarea = document.createElement('textarea');
    textarea.id = `edit-step-description-${stepNumber}`;
    textarea.className = 'step-description';
    textarea.rows = 4;
    textarea.maxLength = 1000;
    textarea.required = true;
    descriptionLabel.appendChild(textarea);
    stepDiv.appendChild(descriptionLabel);

    // Вход для изображения шага
    const imageLabel = document.createElement('label');
    imageLabel.textContent = 'Изображение шага: ';
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.className = 'step-image';
    imageInput.name = 'step-image';
    imageInput.accept = 'image/jpeg,image/png';
    imageLabel.appendChild(imageInput);
    stepDiv.appendChild(imageLabel);

    // Контейнер превью + кнопка удаления превью
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

    // Кнопка «Удалить шаг»
    const removeStepButton = document.createElement('button');
    removeStepButton.type = 'button';
    removeStepButton.className = 'remove-btn remove-step-btn';
    removeStepButton.textContent = 'Удалить шаг';
    stepDiv.appendChild(removeStepButton);

    return stepDiv;
}

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
        const currentCount = editStepsContainer.getElementsByClassName('step').length;
        if (currentCount <= 1) {
            showNotification('Должен быть хотя бы один шаг', 'error');
            return;
        }
        stepDiv.remove();
        updateStepLabels();
    });

    initializeTextField(stepDescriptionTextarea, true, true);
}

function updateStepLabels() {
    const stepDivs = editStepsContainer.getElementsByClassName('step');
    Array.from(stepDivs).forEach((stepDiv, index) => {
        const stepNumber = index + 1;
        const label = stepDiv.querySelector('label[for^="edit-step-description-"]');
        const textarea = stepDiv.querySelector('.step-description');
        if (label && textarea) {
            const textNode = label.childNodes[0];
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                textNode.textContent = `Шаг ${stepNumber} (описание): `;
            } else {
                label.replaceChild(document.createTextNode(`Шаг ${stepNumber} (описание): `), textNode);
            }
            label.setAttribute('for', `edit-step-description-${stepNumber}`);
            textarea.id = `edit-step-description-${stepNumber}`;
        }
    });
}

// Привязка кнопки «Добавить ингредиент» при редактировании
editAddIngredientButton.addEventListener('click', () => {
    const ingredientCount = editIngredientsContainer.getElementsByClassName('ingredient').length;
    if (ingredientCount >= 100) {
        showNotification('Слишком много ингредиентов', 'error');
        return;
    }
    const ingredientDiv = document.createElement('div');
    ingredientDiv.className = 'ingredient';
    ingredientDiv.innerHTML = `
        <label>Ингредиент: <input type="text" class="ingredient-name" maxlength="50" required></label>
        <label class="quantity-label">Количество:
            <div class="quantity-wrapper">
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
            </div>
        </label>
        <button type="button" class="remove-btn remove-ingredient-btn">Удалить ингредиент</button>
    `;
    editIngredientsContainer.appendChild(ingredientDiv);
    initializeIngredient(ingredientDiv);
});

// Привязка кнопки «Добавить шаг» при редактировании
editAddStepButton.addEventListener('click', () => {
    const stepCount = editStepsContainer.getElementsByClassName('step').length;
    if (stepCount >= 50) {
        showNotification('Слишком много шагов', 'error');
        return;
    }
    const stepDiv = createStep(stepCount + 1);
    editStepsContainer.appendChild(stepDiv);
    initializeStep(stepDiv);
    updateStepLabels();
});

// Привязка удаления превью главного изображения при редактировании
editRemoveRecipeImageButton.addEventListener('click', () => {
    clearImageInput(editRecipeImageInput, editRecipeImagePreview, editRemoveRecipeImageButton);
});

// Привязка предпросмотра главного изображения при редактировании
editRecipeImageInput.addEventListener('change', () => {
    showImagePreview(editRecipeImageInput, editRecipeImagePreview, editRemoveRecipeImageButton);
    if (editRecipeImageInput.files[0]) {
        editRecipeImageInput.removeAttribute('required');
    } else {
        editRecipeImageInput.setAttribute('required', 'required');
    }
});

// ------------------------------------------------------------
// 4) Логика «Сохранить изменения» (onsubmit для editForm)
editForm.onsubmit = async (e) => {
    e.preventDefault();
    const saveButton = document.getElementById('edit-save-btn');
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = 'Сохранение...';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Ошибка: Нет токена авторизации', 'error');
            return;
        }

        // 1) Считываем обновлённые поля
        const title = titleInput.value;
        const description = descriptionInput.value;
        const selectedCategories = Array.from(categoryButtons)
            .filter(btn => btn.classList.contains('active'))
            .map(btn => btn.dataset.category);

        // Валидация
        if (!title || title.length > 50) {
            showNotification('Название должно быть от 1 до 50 символов', 'error');
            return;
        }
        if (!description || description.length > 1000) {
            showNotification('Описание должно быть от 1 до 1000 символов', 'error');
            return;
        }
        if (selectedCategories.length === 0) {
            showNotification('Выберите хотя бы одну категорию', 'error');
            return;
        }
        const validCategories = ['Завтрак','Обед','Ужин','Китайская кухня','Итальянская кухня','Русская кухня','Горячее блюдо','Закуски','Десерт','Напитки'];
        if (!selectedCategories.every(cat => validCategories.includes(cat))) {
            showNotification('Недопустимая категория', 'error');
            return;
        }

        // 2) Ингредиенты
        const ingredientDivs = Array.from(editIngredientsContainer.getElementsByClassName('ingredient'));
        if (ingredientDivs.length === 0) {
            showNotification('Добавьте хотя бы один ингредиент', 'error');
            return;
        }
        const ingredients = [];
        const ingredientQuantities = [];
        const ingredientUnits = [];
        for (let div of ingredientDivs) {
            const name = div.querySelector('.ingredient-name')?.value;
            let quantity = div.querySelector('.quantity-input')?.value;
            const unit = div.querySelector('.type-unit')?.value;
            if (!name || name.length > 50) {
                showNotification(`Ингредиент "${name || ''}" не должен превышать 50 символов`, 'error');
                return;
            }
            if (!quantity || (!/^[0-9]+(,[0-9]{0,2})?$/.test(quantity) && quantity !== '0')) {
                showNotification(`Количество для "${name}" должно быть числом (например, 100 или 12,5)`, 'error');
                return;
            }
            if (quantity.endsWith(',')) quantity = quantity.slice(0, -1);
            const numericQty = unit === 'пв' ? 0 : parseFloat(quantity.replace(',', '.')) || 0;
            ingredients.push(name);
            ingredientQuantities.push(numericQty);
            ingredientUnits.push(unit);
        }

        // 3) Шаги
        const stepDivs = Array.from(editStepsContainer.getElementsByClassName('step'));
        if (stepDivs.length === 0) {
            showNotification('Добавьте хотя бы один шаг', 'error');
            saveButton.disabled = false;
            saveButton.textContent = originalText;
            return;
        }
        for (let idx = 0; idx < stepDivs.length; idx++) {
            const div = stepDivs[idx];
            const descTextarea = div.querySelector('.step-description');
            const stepDescription = descTextarea.value.trim();
            if (!stepDescription || stepDescription.length > 1000) {
                showNotification(`Описание шага ${idx + 1} должно быть от 1 до 1000 символов`, 'error');
                saveButton.disabled = false;
                saveButton.textContent = originalText;
                return;
            }

            // Проверяем “обязательность” картинки:
            const stepImagePreview = div.querySelector('.step-image-preview');
            const stepFileInput = div.querySelector('.step-image');

            // Если превью пустое (пользователь удалил старую картинку) И нового файла нет → ошибка
            const hasOldPreview = stepImagePreview.innerHTML.trim() !== '';
            const hasNewFile = stepFileInput.files && stepFileInput.files[0];
            if (!hasOldPreview && !hasNewFile) {
                showNotification(`Для шага ${idx + 1} обязательно загрузите изображение`, 'error');
                saveButton.disabled = false;
                saveButton.textContent = originalText;
                return;
            }
        }


        // 4) Подготовка объекта updatedRecipe
        //    Нам нужно сохранить старые URL картинок (главного и шагов), если пользователь их не изменил.
        //    Для этого сперва получим оригинальный объект рецепта:
        const originalRecipeResponse = await fetchWithRetry(`${API_BASE_URL}/api/recipes/${editCurrentRecipeId}`, {
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!originalRecipeResponse.ok) {
            const errData = await originalRecipeResponse.json();
            throw new Error(errData.message || 'Не удалось загрузить оригинальный рецепт');
        }
        const originalRecipe = await originalRecipeResponse.json();

        // Формируем payload
        const updatedRecipe = {
            title,
            categories: selectedCategories,
            description,
            servings: parseInt(servingsInput.value) || 1,
            cookingTime: parseInt(cookingTimeInput.value) || 1,
            ingredients,
            ingredientQuantities,
            ingredientUnits,
            steps: [],
            // Флаг удалить главное изображение, если превью пусто (и нет выбранного нового файла)
            removeRecipeImage: editRecipeImagePreview.innerHTML === '' && !editRecipeImageInput.files[0]
        };

        // 5) Шаги: если превью шага не пусто и нет нового файла, берём старый URL из originalRecipe
        stepDivs.forEach((div, index) => {
            const desc = div.querySelector('.step-description').value;
            const stepImagePreview = div.querySelector('.step-image-preview');
            const stepImageInput = div.querySelector('.step-image');
            let imageURL = '';

            // Если превью непустое и нового файла не выбрано → оставляем старую ссылку
            if (stepImagePreview.innerHTML.trim() && !stepImageInput.files[0]) {
                imageURL = originalRecipe.steps[index]?.image || '';
            }
            // Иначе (если превью пустое, то либо файл, либо изображение будет пустой строкой)
            updatedRecipe.steps.push({ description: desc, image: imageURL });
        });

        // 6) Формируем FormData
        const formData = new FormData();
        formData.append('recipeData', JSON.stringify(updatedRecipe));

        // 7) Если выбрано новое главное изображение — добавляем его
        if (editRecipeImageInput.files[0]) {
            const file = editRecipeImageInput.files[0];
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                showNotification('Изображение рецепта должно быть в формате JPEG или PNG', 'error');
                saveButton.disabled = false;
                saveButton.textContent = originalText;
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Изображение рецепта не должно превышать 5 МБ', 'error');
                saveButton.disabled = false;
                saveButton.textContent = originalText;
                return;
            }
            formData.append('recipeImage', file);
        }

        // 8) Для каждого шага, если выбран новый файл, добавляем в FormData
        stepDivs.forEach((div, idx) => {
            const stepImageInput = div.querySelector('.step-image');
            if (stepImageInput?.files[0]) {
                const file = stepImageInput.files[0];
                if (!['image/jpeg', 'image/png'].includes(file.type)) {
                    showNotification(`Изображение для шага ${idx + 1} должно быть в формате JPEG или PNG`, 'error');
                    saveButton.disabled = false;
                    saveButton.textContent = originalText;
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    showNotification(`Изображение для шага ${idx + 1} не должно превышать 5 МБ`, 'error');
                    saveButton.disabled = false;
                    saveButton.textContent = originalText;
                    return;
                }
                // Заметьте, здесь мы используем ключ `stepImages[index]`, потому что бэкенд ожидает массив.
                formData.append('step-image', file);
            }
        });

        // 9) Логируем FormData (для отладки)
        for (let [key, value] of formData.entries()) {
            console.log(`FormData: ${key} = ${value instanceof File ? value.name : value}`);
        }

        // 10) Отправляем PUT-запрос на бэкенд
        const response = await fetchWithRetry(`${API_BASE_URL}/api/recipes/${editCurrentRecipeId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.trim()}` },
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            showNotification('Рецепт обновлён!', 'success');
            editDialog.close();

            // При желании обновляем картинку и заголовок в карточке 
            if (editCurrentRecipeElement) {
                const img = editCurrentRecipeElement.querySelector('img');
                const titleEl = editCurrentRecipeElement.querySelector('h4');
                if (img && data.image) img.src = data.image;
                if (titleEl) titleEl.textContent = title;
            }

            // Если нужно снова перезагрузить список (fetchPendingRecipes), можно вызвать currentFetchFunction()
            if (typeof editCurrentFetchFunction === 'function') {
                editCurrentFetchFunction();
            }
        } else {
            throw new Error(data.message || 'Ошибка обновления рецепта');
        }
    } catch (err) {
        console.error('Ошибка редактирования:', err);
        showNotification(`Ошибка: ${err.message}`, 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
};