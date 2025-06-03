const publishedRecipesList = document.getElementById('publishedRecipesList');
const logoutButton = document.getElementById('adminLogout');
const errorDiv = document.getElementById('error');

const statusMap = {
    pending: 'на рассмотрении',
    published: 'опубликовано'
};

async function fetchPublishedRecipes() {
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
    console.log('Fetching published recipes...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/user/all?status=published`, {
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
            throw new Error(errorData.message || 'Не удалось загрузить опубликованные рецепты');
        }
        if (!response.ok) throw new Error('Не удалось загрузить опубликованные рецепты');
        const recipes = await response.json();
        console.log('Recipes received:', recipes);
        displayPublishedRecipes(recipes);
    } catch (err) {
        console.error('Fetch error:', err.message);
        showNotification(`Ошибка: ${err.message}`, 'error');
    }
}

async function getAuthorName(authorId, token) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${authorId}`, {
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) throw new Error('Не удалось получить данные автора');
        const userData = await response.json();
        return userData.username || 'Неизвестный автор';
    } catch (err) {
        console.error(`Error fetching author ${authorId}:`, err.message);
        return 'Неизвестный автор';
    }
}

async function displayPublishedRecipes(recipes) {
    publishedRecipesList.innerHTML = '';
    if (recipes.length === 0) {
        publishedRecipesList.innerHTML = '<p>Нет опубликованных рецептов.</p>';
        return;
    }
    const token = localStorage.getItem('token');

    // Собираем все запросы для авторов
    const authorPromises = recipes.map(recipe => getAuthorName(recipe.author, token));
    const authorNames = await Promise.all(authorPromises);

    // Отображаем рецепты с именами авторов
    recipes.forEach((recipe, index) => {
        const authorName = authorNames[index] || 'Неизвестный автор';
        const recipeDiv = document.createElement('div');
        recipeDiv.className = 'recipe-card';
        recipeDiv.innerHTML = `
            <h4>${recipe.title}</h4>
            <p>Статус: ${statusMap[recipe.status] || recipe.status}</p>
            <p>Автор: ${authorName}</p>
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