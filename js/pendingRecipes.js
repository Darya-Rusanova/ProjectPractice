const acceptDialog = document.getElementById('acceptDialog');
const deleteDialog2 = document.getElementById('deleteDialog');
const confirmAcceptButton = document.getElementById('confirmAcceptButton');
const confirmRejectButton = document.getElementById('confirmRejectButton');
const pendingRecipesList = document.getElementById('pendingRecipesList');

// Обработчик предварительного просмотра и удаления для изображения рецепта
editRecipeImageInput.addEventListener('change', () => {
    showImagePreview(editRecipeImageInput, editRecipeImagePreview, editRemoveRecipeImageButton);
    if (editRecipeImageInput.files[0]) {
        editRecipeImageInput.removeAttribute('required');
    } else {
        editRecipeImageInput.setAttribute('required', 'required');
    }
});
editRemoveRecipeImageButton.addEventListener('click', () => {
    clearImageInput(editRecipeImageInput, editRecipeImagePreview, editRemoveRecipeImageButton);
});

// Функция для получения имени автора по ID
async function getAuthorName(authorId, token) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${authorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error('Не удалось получить данные автора');
        }
        const userData = await response.json();
        return userData.username || 'Неизвестный автор';
    } catch {
        return 'Неизвестный автор';
    }
}

function updateEmptyListMessage(listElement) {
    if (listElement.getElementsByClassName('recipe-card').length === 0) {
        listElement.innerHTML = `
            <p>Нет рецептов на рассмотрении.</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchPendingRecipes();
});

async function fetchPendingRecipes() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetchWithRetry(
            `${API_BASE_URL}/api/recipes/user/all?status=pending`,
            {
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const recipes = await response.json();
        displayPendingRecipes(recipes);
    } catch (err) {
        showNotification(`Ошибка загрузки рецептов: ${err.message}`, 'error');
    }
}

async function displayPendingRecipes(recipes) {
    pendingRecipesList.innerHTML = '';

    if (!recipes || recipes.length === 0) {
        updateEmptyListMessage(pendingRecipesList);
        return;
    }

    const token = localStorage.getItem('token').trim();

    const authorPromises = recipes.map(r => getAuthorName(r.author, token));
    const authorNames = await Promise.all(authorPromises);

    recipes.forEach((recipe, idx) => {
        const authorName = authorNames[idx] || 'Неизвестный автор';

        const recipeDiv = document.createElement('div');
        recipeDiv.className = 'recipe-card';
        recipeDiv.innerHTML = `
            <a href="/recipe.html?id=${recipe._id}" class="recipe-link">
                <div class="recipe-content">
                    <div class="recipe-image">
                        ${recipe.image
                            ? `<img src="${recipe.image}" alt="${recipe.title}" />`
                            : '<div class="no-image">Нет изображения</div>'}
                    </div>
                    <div class="recipe-info">
                        <h4>${recipe.title}</h4>
                        <p>Автор: ${authorName}</p>
                    </div>
                </div>
            </a>
            <div class="recipe-buttons">
                <button class="accept" onclick="showAcceptDialog('${recipe._id}', this.parentElement.parentElement)">Одобрить</button>
                <button class="delete-btn cancel" onclick="showRejectDialog('${recipe._id}', this.parentElement.parentElement)">Отклонить</button>
                <button class="return" onclick="editRecipe('${recipe._id}', this.closest('.recipe-card'))">Редактировать</button>
            </div>
        `;
        pendingRecipesList.appendChild(recipeDiv);
    });

    confirmAcceptButton.addEventListener('click', approveRecipe);
    confirmRejectButton.addEventListener('click', rejectRecipe);
}

function showAcceptDialog(recipeId, recipeElement) {
    editCurrentRecipeId = recipeId;
    editCurrentRecipeElement = recipeElement;
    acceptDialog.showModal();
}

function showRejectDialog(recipeId, recipeElement) {
    editCurrentRecipeId = recipeId;
    editCurrentRecipeElement = recipeElement;
    deleteDialog2.showModal();
}

async function approveRecipe() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        acceptDialog.close();
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/recipes/${editCurrentRecipeId}/approve`,
            {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            }
        );
        if (!response.ok) throw new Error('Не удалось одобрить рецепт');

        showNotification('Рецепт одобрен', 'success');
        if (editCurrentRecipeElement && editCurrentRecipeElement.parentNode) {
            editCurrentRecipeElement.parentNode.removeChild(editCurrentRecipeElement);
            updateEmptyListMessage(pendingRecipesList);
        }
        acceptDialog.close();
        window.dispatchEvent(new Event('recipesUpdated'));
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
        acceptDialog.close();
    }
}

async function rejectRecipe() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        deleteDialog2.close();
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/recipes/${editCurrentRecipeId}/reject`,
            {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            }
        );
        if (!response.ok) throw new Error('Не удалось отклонить рецепт');

        showNotification('Рецепт отклонён', 'success');
        if (editCurrentRecipeElement && editCurrentRecipeElement.parentNode) {
            editCurrentRecipeElement.parentNode.removeChild(editCurrentRecipeElement);
            updateEmptyListMessage(pendingRecipesList);
        }
        deleteDialog2.close();
        window.dispatchEvent(new Event('recipesUpdated'));
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
        deleteDialog2.close();
    }
}

async function editRecipe(recipeId, recipeElement) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetchWithRetry(
            `${API_BASE_URL}/api/recipes/${recipeId}`,
            {
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            }
        );
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || `HTTP ${response.status}`);
        }
        const recipe = await response.json();

        editCurrentRecipeId = recipeId;
        editCurrentRecipeElement = recipeElement;

        editDialog.showModal();

        titleInput.value = recipe.title;
        descriptionInput.value = recipe.description;
        servingsInput.value = recipe.servings;
        cookingTimeInput.value = recipe.cookingTime;

        categoryButtons.forEach(btn => {
            if (recipe.categories.includes(btn.dataset.category)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        editIngredientsContainer.innerHTML = '';
        recipe.ingredients.forEach((ingrName, idx) => {
            const div = document.createElement('div');
            div.className = 'ingredient';
            div.innerHTML = `
                <label>Ингредиент: <input type="text" class="ingredient-name" maxlength="50" value="${ingrName}" required></label>
                <label class="quantity-label">Количество:
                    <div class="quantity-wrapper">
                        <input type="text" class="quantity-input" min="0" max="1000"
                               pattern="[0-9]+(,[0-9]*)?" inputmode="decimal"
                               value="${recipe.ingredientQuantities[idx].toString().replace('.', ',')}" required>
                        <select class="type-unit" required>
                            <option value="г" ${recipe.ingredientUnits[idx] === 'г' ? 'selected' : ''}>г</option>
                            <option value="кг" ${recipe.ingredientUnits[idx] === 'кг' ? 'selected' : ''}>кг</option>
                            <option value="мл" ${recipe.ingredientUnits[idx] === 'мл' ? 'selected' : ''}>мл</option>
                            <option value="л" ${recipe.ingredientUnits[idx] === 'л' ? 'selected' : ''}>л</option>
                            <option value="шт" ${recipe.ingredientUnits[idx] === 'шт' ? 'selected' : ''}>шт.</option>
                            <option value="ст" ${recipe.ingredientUnits[idx] === 'ст' ? 'selected' : ''}>ст.</option>
                            <option value="стл" ${recipe.ingredientUnits[idx] === 'стл' ? 'selected' : ''}>ст.л.</option>
                            <option value="чл" ${recipe.ingredientUnits[idx] === 'чл' ? 'selected' : ''}>ч.л.</option>
                            <option value="пв" ${recipe.ingredientUnits[idx] === 'пв' ? 'selected' : ''}>по вкусу</option>
                        </select>
                    </div>
                </label>
                <button type="button" class="remove-btn remove-ingredient-btn">Удалить ингредиент</button>
            `;
            editIngredientsContainer.appendChild(div);
            initializeIngredient(div);
        });

        editStepsContainer.innerHTML = '';
        recipe.steps.forEach((stepObj, idx) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step';
            stepDiv.innerHTML = `
                <label for="edit-step-description-${idx + 1}">
                    Шаг ${idx + 1} (описание):
                    <textarea id="edit-step-description-${idx + 1}"
                              class="step-description"
                              rows="4"
                              maxlength="1000"
                              required>${stepObj.description}</textarea>
                </label>
                <label>Изображение шага:
                    <input type="file" class="step-image" name="step-image" accept="image/jpeg,image/png">
                </label>
                <div class="image-controls">
                    <div class="step-image-preview">${
                      stepObj.image
                        ? `<img src="${stepObj.image}" style="max-width:100px; margin-top:5px; border-radius:4px;">`
                        : ''
                    }</div>
                    <button type="button" class="remove-btn remove-step-image-btn" style="${
                      stepObj.image ? 'display:block' : 'display:none'
                    }">Удалить изображение</button>
                </div>
                <button type="button" class="remove-btn remove-step-btn">Удалить шаг</button>
            `;
            editStepsContainer.appendChild(stepDiv);
            initializeStep(stepDiv);
        });
        updateStepLabels();

        if (recipe.image) {
            editRecipeImagePreview.innerHTML = `<img src="${recipe.image}" style="max-width:100px; margin-top:5px; border-radius:4px;">`;
            editRemoveRecipeImageButton.style.display = 'block';
        } else {
            editRecipeImagePreview.innerHTML = '';
            editRemoveRecipeImageButton.style.display = 'none';
        }
    } catch (err) {
        showNotification(`Ошибка при загрузке рецепта для редактирования: ${err.message}`, 'error');
    }
}
