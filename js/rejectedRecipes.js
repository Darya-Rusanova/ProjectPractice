const rejectedRecipesList = document.getElementById('rejectedRecipesList');
const logoutButton = document.getElementById('adminLogout');
const errorDiv = document.getElementById('error');

const statusMap = {
    pending: 'на рассмотрении',
    published: 'опубликовано',
    rejected: 'отклонено'
};

async function fetchRejectedRecipes() {
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
    console.log('Fetching rejected recipes...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/user/all?status=rejected`, {
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
            throw new Error(errorData.message || 'Не удалось загрузить отклонённые рецепты');
        }
        if (!response.ok) throw new Error('Не удалось загрузить отклонённые рецепты');
        const recipes = await response.json();
        console.log('Recipes received:', recipes);
        displayRejectedRecipes(recipes);
    } catch (err) {
        console.error('Fetch error:', err.message);
        showNotification(`Ошибка: ${err.message}`, 'error');
    }
}

function displayRejectedRecipes(recipes) {
    rejectedRecipesList.innerHTML = '';
    if (recipes.length === 0) {
        rejectedRecipesList.innerHTML = '<p>Нет отклонённых рецептов.</p>';
        return;
    }

    recipes.forEach(recipe => {
        const authorName = recipe.author?.username || 'Неизвестный автор';
        const recipeDiv = document.createElement('div');
        recipeDiv.className = 'recipe-card';
        recipeDiv.innerHTML = `
            <h4>${recipe.title}</h4>
            <p>Статус: ${statusMap[recipe.status] || recipe.status}</p>
            <p>Автор: ${authorName}</p>
            <button onclick="reconsiderRecipe('${recipe._id}')">Вернуть на рассмотрение</button>
        `;
        rejectedRecipesList.appendChild(recipeDiv);
    });
}

async function reconsiderRecipe(recipeId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/reconsider`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) throw new Error('Не удалось вернуть рецепт на рассмотрение');
        showNotification('Рецепт возвращён на рассмотрение', 'success');
        fetchRejectedRecipes(); // Обновляем список
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
    fetchRejectedRecipes();
});