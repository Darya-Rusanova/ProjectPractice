const pendingRecipesList = document.getElementById('pendingRecipesList');
const logoutButton = document.getElementById('adminLogout');
const errorDiv = document.getElementById('error');
const acceptDialog = document.getElementById('acceptDialog');
const deleteDialog = document.getElementById('deleteDialog');
const confirmAcceptButton = acceptDialog.querySelector('.confirm-accept-btn');
const confirmRejectButton = deleteDialog.querySelector('.confirm-btn');

// currentRecipeId и currentRecipeElement уже объявлены в recipeActions.js
// let currentRecipeId = null;
// let currentRecipeElement = null;

async function fetchPendingRecipes() {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        setTimeout(() => {
            window.location.href = '/signIn.html';
        }, 1000);
        return;
    }

    const authHeader = `Bearer ${token.trim()}`;
    console.log('Authorization header:', authHeader);
    console.log('Fetching pending recipes...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/user/all?status=pending`, {
            headers: { 'Authorization': authHeader }
        });
        console.log('Response status:', response.status);
        if (response.status === 400 || response.status === 401 || response.status === 403) {
            const errorData = await response.json();
            console.log('Error response:', errorData);
            if (errorData.message === 'Токен не предоставлен' || errorData.message === 'Пожалуйста, авторизуйтесь') {
                showNotification('Сессия истекла. Пожалуйста, войдите заново.', 'error');
                setTimeout(() => {
                    window.location.href = '/signIn.html';
                }, 1000);
                return;
            }
            throw new Error(errorData.message || 'Не удалось загрузить рецепты на рассмотрении');
        }
        if (!response.ok) throw new Error('Не удалось загрузить рецепты на рассмотрении');
        const recipes = await response.json();
        console.log('Recipes received structure:', recipes.map(r => ({ _id: r._id, author: r.author, title: r.title })));
        displayPendingRecipes(recipes);
    } catch (err) {
        console.error('Fetch error:', err.message);
        showNotification(`Ошибка: ${err.message}`, 'error');
    }
}

async function getAuthorName(authorId, token) {
    try {
        console.log(`Fetching author data for ID: ${authorId}`);
        const response = await fetch(`${API_BASE_URL}/api/users/${authorId}`, {
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) {
            console.log(`Author request failed for ID ${authorId}, status: ${response.status}`);
            throw new Error('Не удалось получить данные автора');
        }
        const userData = await response.json();
        console.log(`Author data for ID ${authorId}:`, userData);
        return userData.username || 'Неизвестный автор';
    } catch (err) {
        console.error(`Error fetching author ${authorId}:`, err.message);
        return 'Неизвестный автор';
    }
}

async function displayPendingRecipes(recipes) {
    pendingRecipesList.innerHTML = '';
    if (recipes.length === 0) {
        pendingRecipesList.innerHTML = `  
            <p></p>
            <p>Нет рецептов на рассмотрении.</p>
            <p></p>
        `;
        return;
    }
    const token = localStorage.getItem('token');
    const authorPromises = recipes.map(recipe => getAuthorName(recipe.author, token));
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
                <div class="recipe-buttons">
                    <button class="accept" onclick="showApproveDialog('${recipe._id}', this.parentElement.parentElement)">Одобрить</button>
                    <button class="return" onclick="editRecipe('${recipe._id}', fetchPendingRecipes)">Редактировать</button>
                    <button class="cancel" onclick="showRejectDialog('${recipe._id}', this.parentElement.parentElement)">Отклонить</button>
                </div>
        `;
        pendingRecipesList.appendChild(recipeDiv);
    });
}

function showApproveDialog(recipeId, recipeDiv) {
    currentRecipeId = recipeId;
    currentRecipeElement = recipeDiv;
    acceptDialog.showModal();
}

function showRejectDialog(recipeId, recipeDiv) {
    currentRecipeId = recipeId;
    currentRecipeElement = recipeDiv;
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
            // Проверяем, остались ли рецепты в списке
            if (pendingRecipesList.getElementsByClassName('recipe-card').length === 0) {
                pendingRecipesList.innerHTML = `  
                    <p></p>
                    <p>Нет рецептов на рассмотрении.</p>
                    <p></p>
                `;
            }
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
            // Проверяем, остались ли рецепты в списке
            if (pendingRecipesList.getElementsByClassName('recipe-card').length === 0) {
                pendingRecipesList.innerHTML = `  
                    <p></p>
                    <p>Нет рецептов на рассмотрении.</p>
                    <p></p>
                `;
            }
        }
        deleteDialog.close();
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
        deleteDialog.close();
    }
}

confirmAcceptButton.addEventListener('click', approveRecipe);
confirmRejectButton.addEventListener('click', rejectRecipe);

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    window.location.href = '/signIn.html';
});

document.addEventListener('DOMContentLoaded', () => {
    fetchPendingRecipes();
});