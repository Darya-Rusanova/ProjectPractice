const pendingRecipesList = document.getElementById('pendingRecipesList');
const logoutButton = document.getElementById('adminLogout');
const errorDiv = document.getElementById('error');

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

    // Обрабатываем каждый рецепт асинхронно
    for (const recipe of recipes) {
        const authorName = await getAuthorName(recipe.author, token);
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
                    <div class="recipe-buttons">
                        <button class="accept" onclick="approveRecipe('${recipe._id}')">Одобрить</button>
                        <button class="edit return">Редактировать</button>
                        <button class="cancel" onclick="rejectRecipe('${recipe._id}')">Отклонить</button>
                    </div>
                 </a>
        `;
        pendingRecipesList.appendChild(recipeDiv);

        const editButton = recipeDiv.querySelector('.edit');
        editButton.addEventListener('click', () => {
            editRecipe(recipe._id, fetchPendingRecipes);
        });
    }
}

async function approveRecipe(recipeId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) throw new Error('Не удалось одобрить рецепт');
        showNotification('Рецепт одобрен', 'success');
        fetchPendingRecipes(); // Обновляем список
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
    }
}

async function rejectRecipe(recipeId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) throw new Error('Не удалось отклонить рецепт');
        showNotification('Рецепт отклонён', 'success');
        fetchPendingRecipes(); // Обновляем список
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
    }
}

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