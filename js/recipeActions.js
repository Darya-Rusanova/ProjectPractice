async function deleteRecipe(recipeId, recipeElement, fetchFunction) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        showNotification('Рецепт удалён!', 'success');
        if (recipeElement && recipeElement.parentNode) {
            recipeElement.parentNode.removeChild(recipeElement);
        }
        fetchFunction();
    } catch (err) {
        showNotification(`Ошибка удаления: ${err.message}`, 'error');
    }
}

async function editRecipe(recipeId, fetchFunction) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    // Получаем данные рецепта
    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не удалось загрузить рецепт');
        }
        const recipe = await response.json();

        // Открываем диалоговое окно
        const editDialog = document.getElementById('editDialog');
        editDialog.showModal();

        // Инициализация формы
        const editForm = document.getElementById('edit-recipe-form');
        const titleInput = document.getElementById('edit-recipe-title');
        const descriptionInput = document.getElementById('edit-recipe-description');
        const servingsInput = document.getElementById('edit-recipe-servings');
        const cookingTimeInput = document.getElementById('edit-recipe-cooking-time');
        const categoryButtons = document.querySelectorAll('#edit-recipe-categories .category-btn');
        const ingredientsContainer = document.getElementById('edit-ingredients-container');
        const stepsContainer = document.getElementById('edit-steps-container');
        const recipeImageInput = document.getElementById('edit-recipe-image');
        const recipeImagePreview = document.getElementById('edit-recipe-image-preview');
        const removeRecipeImageButton = document.getElementById('edit-remove-recipe-image-btn');
        const addIngredientButton = document.getElementById('edit-add-ingredient-btn');
        const addStepButton = document.getElementById('edit-add-step-btn');

        // Функции из kabinet.js для обработки ввода
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

        function showImagePreview(input, previewElement, removeButton) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const maxSize = 5 * 1024 * 1024; // 5 МБ
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

        function clearImageInput(input, previewElement, removeButton) {
            input.value = '';
            previewElement.innerHTML = '';
            if (removeButton) removeButton.style.display = 'none';
        }

        function restrictInput(input, isDecimal = false) {
            input.addEventListener('input', (e) => {
                if (input.disabled) return;
                let value = input.value;
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

        function initializeTextField(input, capitalize = false, addPeriod = false) {
            if (capitalize) {
                input.addEventListener('input', () => {
                    const start = input.selectionStart;
                    const end = input.selectionEnd;
                    const originalValue = input.value;
                    input.value = capitalizeFirstWord(input.value);
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
            const labelText = document.createTextNode(`Шаг ${stepNumber} (описание): `);
            descriptionLabel.appendChild(labelText);

            const textarea = document.createElement('textarea');
            textarea.id = `edit-step-description-${stepNumber}`;
            textarea.className = 'step-description';
            textarea.setAttribute('rows', '4');
            textarea.setAttribute('maxlength', '1000');
            textarea.setAttribute('required', 'required');
            descriptionLabel.appendChild(textarea);
            stepDiv.appendChild(descriptionLabel);

            const imageLabel = document.createElement('label');
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
            imageControls.appendChild(imagePreview);

            const removeImageButton = document.createElement('button');
            removeImageButton.type = 'button';
            removeImageButton.className = 'remove-btn remove-step-image-btn';
            removeImageButton.textContent = 'Удалить изображение';
            removeImageButton.style.display = 'none';
            imageControls.appendChild(removeImageButton);
            stepDiv.appendChild(imageControls);

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
                const currentCount = stepsContainer.getElementsByClassName('step').length;
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
            const stepDivs = stepsContainer.getElementsByClassName('step');
            Array.from(stepDivs).forEach((stepDiv, index) => {
                const stepNumber = index + 1;
                const label = stepDiv.querySelector('label[for^="edit-step-description-"]');
                const textarea = stepDiv.querySelector('.step-description');
                if (label && textarea) {
                    const labelTextNode = label.childNodes[0];
                    if (labelTextNode && labelTextNode.nodeType === Node.TEXT_NODE) {
                        labelTextNode.textContent = `Шаг ${stepNumber} (описание): `;
                    } else {
                        label.replaceChild(document.createTextNode(`Шаг ${stepNumber} (описание): `), labelTextNode);
                    }
                    label.setAttribute('for', `edit-step-description-${stepNumber}`);
                    textarea.id = `edit-step-description-${stepNumber}`;
                }
            });
        }

        // Заполняем форму данными рецепта
        titleInput.value = recipe.title;
        descriptionInput.value = recipe.description;
        servingsInput.value = recipe.servings;
        cookingTimeInput.value = recipe.cookingTime;

        // Активируем категории
        categoryButtons.forEach(button => {
            button.classList.remove('active');
            if (recipe.categories.includes(button.dataset.category)) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                button.classList.toggle('active');
            });
        });

        // Заполняем ингредиенты
        ingredientsContainer.innerHTML = '';
        recipe.ingredients.forEach((ingredient, index) => {
            const ingredientDiv = document.createElement('div');
            ingredientDiv.className = 'ingredient';
            ingredientDiv.innerHTML = `
                <label>Ингредиент: <input type="text" class="ingredient-name" maxlength="50" value="${ingredient}" required></label>
                <label class="quantity-label">Количество:
                    <div class="quantity-wrapper">
                        <input type="text" class="quantity-input" min="0" max="1000" pattern="[0-9]+(,[0-9]*)?" inputmode="decimal" value="${recipe.ingredientQuantities[index]}" required>
                        <select class="type-unit" required>
                            <option value="г" ${recipe.ingredientUnits[index] === 'г' ? 'selected' : ''}>г</option>
                            <option value="кг" ${recipe.ingredientUnits[index] === 'кг' ? 'selected' : ''}>кг</option>
                            <option value="мл" ${recipe.ingredientUnits[index] === 'мл' ? 'selected' : ''}>мл</option>
                            <option value="л" ${recipe.ingredientUnits[index] === 'л' ? 'selected' : ''}>л</option>
                            <option value="шт" ${recipe.ingredientUnits[index] === 'шт' ? 'selected' : ''}>шт.</option>
                            <option value="ст" ${recipe.ingredientUnits[index] === 'ст' ? 'selected' : ''}>ст.</option>
                            <option value="стл" ${recipe.ingredientUnits[index] === 'стл' ? 'selected' : ''}>ст.л.</option>
                            <option value="чл" ${recipe.ingredientUnits[index] === 'чл' ? 'selected' : ''}>ч.л.</option>
                            <option value="пв" ${recipe.ingredientUnits[index] === 'пв' ? 'selected' : ''}>по вкусу</option>
                        </select>
                    </div>
                </label>
                <button type="button" class="remove-btn remove-ingredient-btn">Удалить ингредиент</button>
            `;
            ingredientsContainer.appendChild(ingredientDiv);
            initializeIngredient(ingredientDiv);
        });

        // Заполняем шаги
        stepsContainer.innerHTML = '';
        recipe.steps.forEach((step, index) => {
            const stepNumber = index + 1;
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step';
            stepDiv.innerHTML = `
                <label for="edit-step-description-${stepNumber}">Шаг ${stepNumber} (описание): 
                    <textarea id="edit-step-description-${stepNumber}" class="step-description" rows="4" maxlength="1000" required>${step.description}</textarea>
                </label>
                <label>Изображение шага: 
                    <input type="file" class="step-image" name="step-image" accept="image/jpeg,image/png">
                </label>
                <div class="image-controls">
                    <div class="step-image-preview">${step.image ? `<img src="${step.image}" style="max-width: 100px; border-radius: 4px; margin-top: 5px;" />` : ''}</div>
                    <button type="button" class="remove-btn remove-step-image-btn" style="display: ${step.image ? 'block' : 'none'};">Удалить изображение</button>
                </div>
                <button type="button" class="remove-btn remove-step-btn">Удалить шаг</button>
            `;
            stepsContainer.appendChild(stepDiv);
            initializeStep(stepDiv);
        });

        // Показываем текущее изображение рецепта
        if (recipe.image) {
            recipeImagePreview.innerHTML = `<img src="${recipe.image}" style="max-width: 100px; border-radius: 4px; margin-top: 5px;" />`;
            removeRecipeImageButton.style.display = 'block';
        } else {
            recipeImagePreview.innerHTML = '';
            removeRecipeImageButton.style.display = 'none';
        }

        recipeImageInput.addEventListener('change', () => {
            showImagePreview(recipeImageInput, recipeImagePreview, removeRecipeImageButton);
        });
        removeRecipeImageButton.addEventListener('click', () => {
            clearImageInput(recipeImageInput, recipeImagePreview, removeRecipeImageButton);
        });

        // Добавление ингредиента
        addIngredientButton.addEventListener('click', () => {
            const ingredientCount = ingredientsContainer.getElementsByClassName('ingredient').length;
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
            ingredientsContainer.appendChild(ingredientDiv);
            initializeIngredient(ingredientDiv);
        });

        // Добавление шага
        addStepButton.addEventListener('click', () => {
            const stepCount = stepsContainer.getElementsByClassName('step').length;
            if (stepCount >= 50) {
                showNotification('Слишком много шагов', 'error');
                return;
            }
            const stepNumber = stepCount + 1;
            const stepDiv = createStep(stepNumber);
            stepsContainer.appendChild(stepDiv);
            initializeStep(stepDiv);
            updateStepLabels();
        });

        // Применяем ограничения
        restrictInput(servingsInput);
        restrictInput(cookingTimeInput);
        enforceMinMax(servingsInput);
        enforceMinMax(cookingTimeInput);
        initializeTextField(titleInput, true);
        initializeTextField(descriptionInput, true, true);

        // Обработчик отправки формы
        editForm.onsubmit = async (e) => {
            e.preventDefault();
            const saveButton = document.getElementById('edit-save-btn');
            const originalText = saveButton.textContent;
            saveButton.disabled = true;
            saveButton.textContent = 'Сохранение...';

            try {
                const title = titleInput.value;
                const description = descriptionInput.value;
                const selectedCategories = Array.from(categoryButtons)
                    .filter(button => button.classList.contains('active'))
                    .map(button => button.dataset.category);

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

                const ingredientDivs = ingredientsContainer.getElementsByClassName('ingredient');
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

                const stepDivs = stepsContainer.getElementsByClassName('step');
                if (stepDivs.length === 0) {
                    showNotification('Добавьте хотя бы один шаг', 'error');
                    return;
                }
                for (let div of stepDivs) {
                    const description = div.querySelector('.step-description')?.value;
                    if (!description || description.length > 1000) {
                        showNotification(`Описание шага не должно превышать 1000 символов`, 'error');
                        return;
                    }
                }

                const updatedRecipe = {
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
                    updatedRecipe.ingredients.push(name);
                    updatedRecipe.ingredientQuantities.push(quantity);
                    updatedRecipe.ingredientUnits.push(unit);
                }

                for (let div of stepDivs) {
                    const description = div.querySelector('.step-description').value;
                    updatedRecipe.steps.push({ description });
                }

                const formData = new FormData();
                formData.append('recipeData', JSON.stringify(updatedRecipe));
                if (recipeImageInput.files[0]) {
                    formData.append('recipeImage', recipeImageInput.files[0]);
                }
                Array.from(stepDivs).forEach((div, index) => {
                    const stepImageInput = div.querySelector('.step-image');
                    if (stepImageInput?.files[0]) {
                        formData.append('stepImages', stepImageInput.files[0]);
                    }
                });

                const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token.trim()}` },
                    body: formData
                });
                const data = await response.json();
                if (response.ok) {
                    showNotification('Рецепт обновлён!', 'success');
                    editDialog.close();
                    fetchFunction();
                } else {
                    throw new Error(data.message || 'Ошибка обновления рецепта');
                }
            } catch (err) {
                showNotification(`Ошибка: ${err.message}`, 'error');
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = originalText;
            }
        };
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
    }
}