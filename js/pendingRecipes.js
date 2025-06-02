const pendingRecipesList = document.getElementById('pendingRecipesList');
const logoutButton = document.getElementById('adminLogout');
const errorDiv = document.getElementById('error');

async function fetchPendingRecipes() {
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/user/all?status=pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Не удалось загрузить рецепты на рассмотрении');
        const recipes = await response.json();
        displayPendingRecipes(recipes);
    } catch (err) {
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
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
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