const rejectedRecipesList = document.getElementById('rejectedRecipesList');
const returnDialog = document.getElementById('returnDialog');
const confirmReturnButton = returnDialog.querySelector('.confirm-return-btn');
const dltButton = document.getElementById('dltButton');

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
            <p>Нет отклоненных рецептов.</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchRejectedRecipes();
});

async function fetchRejectedRecipes() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/user/all?status=rejected`, {
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const recipes = await response.json();
        displayRejectedRecipes(recipes);
    } catch (err) {
        showNotification(`Ошибка загрузки рецептов: ${err.message}`, 'error');
    }
}

async function displayRejectedRecipes(recipes) {
    rejectedRecipesList.innerHTML = '';

    if (!recipes || recipes.length === 0) {
        updateEmptyListMessage(rejectedRecipesList);
        return;
    }

    const token = localStorage.getItem('token');

    // Собираем имена авторов для каждого рецепта параллельно
    const authorPromises = recipes.map(r => getAuthorName(r.author, token));
    const authorNames = await Promise.all(authorPromises);

    recipes.forEach((recipe, index) => {
        const authorName = authorNames[index] || 'Неизвестный автор';
        const recipeDiv = document.createElement('div');
        recipeDiv.className = 'recipe-card'; 
        recipeDiv.innerHTML = `
            <a href="#" class="recipe-link">
                <div class="recipe-content">
                    <div class="recipe-image">
                        ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" />` : '<div class="no-image">Нет изображения</div>'}
                    </div>
                    <div class="recipe-info">
                        <h4>${recipe.title}</h4>
                        <p>Автор: ${authorName}</p>
                    </div>
                </div>
            </a>
                <div class="recipe-buttons2">
                    <button class="return" onclick="showReturnDialog('${recipe._id}', this.parentElement.parentElement)">Вернуть на рассмотрение</button>
                    <button class="delete-btn cancel" data-id="${recipe._id}">Удалить</button>
                </div>
        `;
        rejectedRecipesList.appendChild(recipeDiv);

        const deleteButton = recipeDiv.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => {
            showDeleteDialog(recipe._id, recipeDiv);
        });
    });

    dltButton.addEventListener('click', deleteRecipe);
}

function showReturnDialog(recipeId, recipeDiv) {
    currentRecipeId = recipeId;
    currentRecipeElement = recipeDiv;
    returnDialog.showModal();
}

async function reconsiderRecipe() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        returnDialog.close();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/${currentRecipeId}/reconsider`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) throw new Error('Не удалось вернуть рецепт на рассмотрение');
        showNotification('Рецепт возвращён на рассмотрение', 'success');
        if (currentRecipeElement && currentRecipeElement.parentNode) {
            currentRecipeElement.parentNode.removeChild(currentRecipeElement);
            // Проверяем, остались ли рецепты в списке
            if (rejectedRecipesList.getElementsByClassName('recipe-card').length === 0) {
                rejectedRecipesList.innerHTML = `  
                    <p>Нет отклонённых рецептов</p>
                `;
            }
        }
        returnDialog.close();
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
        returnDialog.close();
    }
}

confirmReturnButton.addEventListener('click', reconsiderRecipe);