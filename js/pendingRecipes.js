let currentRecipeId = null;
let currentRecipeElement = null;

const acceptDialog = document.getElementById('acceptDialog');
const deleteDialog = document.getElementById('deleteDialog');
const confirmAcceptButton = document.getElementById('confirmAcceptButton');
const confirmRejectButton = document.getElementById('confirmRejectButton');
const pendingRecipesList = document.getElementById('pendingRecipesList');

function updateEmptyListMessage(listElement) {
    if (listElement.getElementsByClassName('recipe-card').length === 0) {
        listElement.innerHTML = `
            <p></p>
            <p>Нет рецептов на рассмотрении.</p>
            <p></p>
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
        const response = await fetchWithRetry(`${API_BASE_URL}/api/recipes?status=pending`, {
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });

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
        pendingRecipesList.innerHTML = `
            <p></p>
            <p>Нет рецептов на рассмотрении.</p>
            <p></p>
        `;
        return;
    }

    const userPromises = recipes.map(recipe => 
        fetchWithRetry(`${API_BASE_URL}/api/users/${recipe.author}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token').trim()}` }
        }).then(res => res.json())
    );

    const users = await Promise.all(userPromises);
    const userMap = users.reduce((map, user) => {
        map[user._id] = user.username || 'Неизвестный автор';
        return map;
    }, {});

    recipes.forEach(recipe => {
        const authorName = userMap[recipe.author] || 'Неизвестный автор';
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
            <div class="recipe-buttons">
                <button class="accept" onclick="showAcceptDialog('${recipe._id}', this.parentElement.parentElement)">Одобрить</button>
                <button class="delete-btn cancel" onclick="showRejectDialog('${recipe._id}', this.parentElement.parentElement)">Отклонить</button>
                <button class="return" onclick="editRecipe('${recipe._id}', null, this.parentElement.parentElement)">Редактировать</button>
            </div>
        `;
        pendingRecipesList.appendChild(recipeDiv);
    });

    confirmAcceptButton.addEventListener('click', approveRecipe);
    confirmRejectButton.addEventListener('click', rejectRecipe);
}

function showAcceptDialog(recipeId, recipeElement) {
    currentRecipeId = recipeId;
    currentRecipeElement = recipeElement;
    acceptDialog.showModal();
}

function showRejectDialog(recipeId, recipeElement) {
    currentRecipeId = recipeId;
    currentRecipeElement = recipeElement;
    deleteDialog.showModal();
}

async function approveRecipe() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        acceptDialog.close();
        return;
    }

    try {
        console.log(`currentRecipe ID: ${currentRecipeId}`);
        const response = await fetch(`${API_BASE_URL}/api/recipes/${currentRecipeId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) throw new Error('Не удалось одобрить рецепт');
        showNotification('Рецепт одобрен', 'success');
        if (currentRecipeElement && currentRecipeElement.parentNode) {
            currentRecipeElement.parentNode.removeChild(currentRecipeElement);
            updateEmptyListMessage(pendingRecipesList);
        }
        acceptDialog.close();
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
        acceptDialog.close();
    }
}

async function rejectRecipe() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        deleteDialog.close();
        return;
    }

    try {
        console.log(`currentRecipe ID: ${currentRecipeId}`);
        const response = await fetch(`${API_BASE_URL}/api/recipes/${currentRecipeId}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) throw new Error('Не удалось отклонить рецепт');
        showNotification('Рецепт отклонён', 'success');
        if (currentRecipeElement && currentRecipeElement.parentNode) {
            currentRecipeElement.parentNode.removeChild(currentRecipeElement);
            updateEmptyListMessage(pendingRecipesList);
        }
        deleteDialog.close();
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
        deleteDialog.close();
    }
}