document.addEventListener('DOMContentLoaded', () => {
    fetchPublishedRecipes();
});

async function fetchPublishedRecipes() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/recipes?status=published`, {
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const recipes = await response.json();
        displayPublishedRecipes(recipes);
    } catch (err) {
        showNotification(`Ошибка загрузки рецептов: ${err.message}`, 'error');
    }
}

async function displayPublishedRecipes(recipes) {
    const publishedRecipesList = document.getElementById('publishedRecipesList');
    publishedRecipesList.innerHTML = '';

    if (!recipes || recipes.length === 0) {
        publishedRecipesList.innerHTML = `
            <p>Нет опубликованных рецептов.</p>
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
            <div class="recipe-buttons2">
                <button class="return" onclick="editRecipe('${recipe._id}', fetchPublishedRecipes, this.parentElement.parentElement)">Редактировать</button>
                <button class="delete-btn cancel" data-id="${recipe._id}">Удалить</button>
            </div>
        `;
        publishedRecipesList.appendChild(recipeDiv);

        const deleteButton = recipeDiv.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => {
            showDeleteDialog(recipe._id, recipeDiv);
        });
    });

    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    confirmDeleteButton.addEventListener('click', deleteRecipe);
}