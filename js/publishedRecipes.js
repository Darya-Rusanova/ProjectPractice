const publishedRecipesList = document.getElementById('publishedRecipesList');
const logoutButton = document.getElementById('adminLogout');
const errorDiv = document.getElementById('error');

async function fetchPublishedRecipes() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/recipes/user/all?status=published`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Не удалось загрузить опубликованные рецепты');
        const recipes = await response.json();
        displayPublishedRecipes(recipes);
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
    }
}

function displayPublishedRecipes(recipes) {
    publishedRecipesList.innerHTML = '';
    if (recipes.length === 0) {
        publishedRecipesList.innerHTML = '<p>Нет опубликованных рецептов.</p>';
        return;
    }
    recipes.forEach(recipe => {
        const recipeDiv = document.createElement('div');
        recipeDiv.className = 'recipe-card';
        recipeDiv.innerHTML = `
            <h4>${recipe.title}</h4>
            <p>Автор: ${recipe.author}</p>
        `;
        publishedRecipesList.appendChild(recipeDiv);
    });
}

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    window.location.href = '/signIn.html';
});

document.addEventListener('DOMContentLoaded', () => {
    fetchPublishedRecipes();
});