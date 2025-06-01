let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';

const errorDiv = document.createElement('div');
errorDiv.id = 'error';
errorDiv.className = 'error section';
document.querySelector('.cabinet-section').prepend(errorDiv);

const cabinetSection = document.getElementById('cabinet-section');
const logoutButton = document.getElementById('logout');
const recipesList = document.getElementById('recipes');

// Проверка токена
async function checkToken() {
    if (!token || !userId) {
        window.location.href = 'index.html';
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        cabinetSection.style.display = 'block';
        fetchAllRecipes();
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = 'index.html';
        errorDiv.textContent = 'Ошибка авторизации: ' + err.message;
    }
}

checkToken();

// Обработчик выхода
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
});

// Загрузка всех рецептов
async function fetchAllRecipes() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes`, { // Получение всех рецептов
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const recipes = await response.json();
        recipesList.innerHTML = '';
        if (recipes.length === 0) {
            recipesList.innerHTML = '<p>Пока нет рецептов для проверки</p>';
        } else {
            recipes.forEach(recipe => {
                const recipeDiv = document.createElement('div');
                recipeDiv.className = 'myRecipe';
                
                const recipeLink = document.createElement('a');
                recipeLink.href = '#';
                recipeLink.className = 'recipe-link';
                
                const recipeContent = document.createElement('div');
                recipeContent.className = 'recipe-content';
                
                const imageDiv = document.createElement('div');
                imageDiv.className = 'recipe-image';
                if (recipe.image) {
                    imageDiv.innerHTML = `<img src="${recipe.image}" alt="${recipe.title}" />`;
                } else {
                    imageDiv.innerHTML = '<div class="no-image">Нет изображения</div>';
                }
                
                const infoDiv = document.createElement('div');
                infoDiv.className = 'recipe-info';
                infoDiv.innerHTML = `
                    <h4>${recipe.title}</h4>
                    <ul>
                        <li>${recipe.servings} порции</li>
                        <li>${recipe.cookingTime} минут</li>
                        <li>${recipe.ingredients.length} ингредиентов</li>
                    </ul>
                `;
                
                recipeContent.appendChild(imageDiv);
                recipeContent.appendChild(infoDiv);
                recipeLink.appendChild(recipeContent);
                recipeDiv.appendChild(recipeLink);
                
                recipesList.appendChild(recipeDiv);
            });
        }
    } catch (err) {
        errorDiv.textContent = 'Ошибка загрузки рецептов: ' + err.message;
    }
}