const pendingRecipesList = document.getElementById('pendingRecipesList');
const logoutButton = document.getElementById('adminLogout');
const errorDiv = document.getElementById('error');

const statusMap = {
    pending: 'на рассмотрении...',
    published: 'опубликовано.'
};

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
    console.log('Authorization header:', authHeader); // Лог заголовка
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
        console.log('Recipes received:', recipes);
        displayPendingRecipes(recipes);
    } catch (err) {
        console.error('Fetch error:', err.message);
        showNotification(`Ошибка: ${err.message}`, 'error');
    }
}

function displayPendingRecipes(recipes) {
    pendingRecipesList.innerHTML = '';
    if (recipes.length === 0) {
        pendingRecipesList.innerHTML = '<p>Нет рецептов на рассмотрении.</p>';
        return;
    }
    recipes.forEach(recipe => {
        const recipeDiv = document.createElement('div');
        recipeDiv.className = 'recipe-card';
        recipeDiv.innerHTML = `
            <h4>${recipe.title}</h4>
            <p>Статус: ${statusMap[recipe.status] || recipe.status}</p>
            <p>Автор: ${recipe.author}</p>
            <button onclick="approveRecipe('${recipe._id}')">Одобрить</button>
        `;
        pendingRecipesList.appendChild(recipeDiv);
    });
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