let currentRecipeId = null;
let currentRecipeElement = null;
let currentFetchFunction = null;

function showDeleteDialog(recipeId, recipeElement) {
    currentRecipeId = recipeId;
    currentRecipeElement = recipeElement;
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
        currentRecipeId = null;
        currentRecipeElement = null;
        currentFetchFunction = null;
        return;
    }
    if (!currentRecipeId) {
        showNotification('Ошибка: Не выбран рецепт для удаления', 'error');
        if (document.getElementById('delete')) document.getElementById('delete').close();
        currentRecipeId = null;
        currentRecipeElement = null;
        currentFetchFunction = null;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/${currentRecipeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        showNotification('Рецепт удалён!', 'success');
        if (currentRecipeElement && currentRecipeElement.parentNode) {
            const parentList = currentRecipeElement.parentNode;
            currentRecipeElement.parentNode.removeChild(currentRecipeElement);
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
        currentRecipeId = null;
        currentRecipeElement = null;
        currentFetchFunction = null;
    }
}

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
        const validCategories = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack']; // Уточните список
        if (!selectedCategories.every(cat => validCategories.includes(cat))) {
            showNotification('Недопустимая категория', 'error');
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
            const description = div.querySelector('.step-description')?.value;
            if (!description || description.length > 1000) {
                showNotification(`Описание шага не должно превышать 1000 символов`, 'error');
                return;
            }
        }

        // Получаем оригинальный рецепт для сохранения существующих изображений
        const originalRecipeResponse = await fetchWithRetry(`${API_BASE_URL}/api/recipes/${recipeId}`, {
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!originalRecipeResponse.ok) {
            const errorData = await originalRecipeResponse.json();
            throw new Error(errorData.message || 'Не удалось загрузить оригинальный рецепт');
        }
        const originalRecipe = await originalRecipeResponse.json();

        const updatedRecipe = {
            title,
            categories: selectedCategories,
            description,
            servings: parseInt(servingsInput.value) || 1,
            cookingTime: parseInt(cookingTimeInput.value) || 0,
            ingredients: [],
            ingredientQuantities: [],
            ingredientUnits: [],
            steps: [],
            removeRecipeImage: recipeImagePreview.innerHTML === '' && !recipeImageInput.files[0]
        };

        for (let div of ingredientDivs) {
            const name = div.querySelector('.ingredient-name').value;
            let quantity = div.querySelector('.quantity-input').value;
            const unit = div.querySelector('.type-unit').value;
            if (quantity.endsWith(',')) quantity = quantity.slice(0, -1);
            quantity = unit === 'пв' ? 0 : parseFloat(quantity.replace(',', '.')) || 0;
            updatedRecipe.ingredients.push(name);
            updatedRecipe.ingredientQuantities.push(quantity);
            updatedRecipe.ingredientUnits.push(unit);
        }

        for (let [index, div] of stepDivs.entries()) {
            const description = div.querySelector('.step-description').value;
            const stepImagePreview = div.querySelector('.step-image-preview');
            const stepImageInput = div.querySelector('.step-image');
            let image = '';

            // Сохраняем старое изображение, если не загружено новое и предпросмотр не пуст
            if (stepImagePreview.innerHTML && !stepImageInput.files[0]) {
                image = originalRecipe.steps[index]?.image || '';
            }
            // Если изображение удалено (предпросмотр пуст и нет нового файла), image = ''
            
            updatedRecipe.steps.push({ description, image });
        }

        const formData = new FormData();
        formData.append('recipeData', JSON.stringify(updatedRecipe));
        if (recipeImageInput.files[0]) {
            const file = recipeImageInput.files[0];
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                showNotification('Изображение рецепта должно быть в формате JPEG или PNG', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Изображение рецепта не должно превышать 5 МБ', 'error');
                return;
            }
            formData.append('recipeImage', file);
            console.log('Добавлено новое изображение рецепта:', file.name);
        }

        for (let [index, div] of stepDivs.entries()) {
            const stepImageInput = div.querySelector('.step-image');
            if (stepImageInput?.files[0]) {
                const file = stepImageInput.files[0];
                if (!['image/jpeg', 'image/png'].includes(file.type)) {
                    showNotification(`Изображение для шага ${index + 1} должно быть в формате JPEG или PNG`, 'error');
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    showNotification(`Изображение для шага ${index + 1} не должно превышать 5 МБ`, 'error');
                    return;
                }
                formData.append(`stepImages[${index}]`, file);
                console.log(`Добавлено изображение для шага ${index + 1}: ${file.name}`);
            }
        }

        // Логирование FormData
        for (let [key, value] of formData.entries()) {
            console.log(`FormData: ${key}=${value instanceof File ? value.name : value}`);
        }

        const response = await fetchWithRetry(`${API_BASE_URL}/api/recipes/${recipeId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.trim()}` },
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            showNotification('Рецепт обновлён!', 'success');
            editDialog.close();
            if (recipeElement) {
                const img = recipeElement.querySelector('img');
                const titleElement = recipeElement.querySelector('h4');
                if (img && data.image) img.src = data.image;
                if (titleElement) titleElement.textContent = title;
            }
            if (currentFetchFunction) currentFetchFunction();
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