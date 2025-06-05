const token = localStorage.getItem('token') || '';
const currentUserId = localStorage.getItem('userId') || '';

const recipesSection = document.getElementById('recipes-section');
const errorDiv = document.getElementById('error');
const logoutButton = document.getElementById('logout');

const deleteDialog = document.getElementById('delete');
const confirmRemoveButton = document.getElementById('confirm-remove');

async function checkToken() {
  if (!token || !currentUserId) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const resp = await fetch(`${API_BASE_URL}/api/users/${currentUserId}`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
  } catch (err) {
    console.error('Ошибка проверки токена:', err.message);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
    showNotification('Ошибка авторизации: ' + err.message, 'error');
  }
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('favoritesCount');
    window.dispatchEvent(new Event('authStateChanged'));
    window.location.href = 'index.html';
  });
}

async function removeFromFavorites(recipeId, cardElement) {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/favorites/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.message || `Ошибка ${resp.status}`);
    }
    cardElement.remove();
    showNotification('Рецепт удалён из избранного', 'success');
    // Обновляем saveCount
    localStorage.setItem('favoritesCount', data.favoritesCount.toString());
    document.getElementById('saveCount').textContent = data.favoritesCount;
    window.dispatchEvent(new Event('favoritesUpdated'));
    // Проверяем, остались ли рецепты
    if (recipesSection.getElementsByClassName('recipe').length === 0) {
      recipesSection.innerHTML = '<p>У вас пока нет избранных рецептов.</p>';
    }
  } catch (err) {
    console.error('Ошибка при удалении из избранного:', err.message);
    showNotification('Не удалось удалить из избранного: ' + err.message, 'error');
  }
}

function createRecipeCard(recipe, authorName) {
  const link = document.createElement('a');
  link.href = "#";
  link.classList.add('recipe');

  const fav = document.createElement('div');
  fav.classList.add('favorite', 'checked');
  fav.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
    deleteDialog.showModal();
    confirmRemoveButton.onclick = () => {
      removeFromFavorites(recipe._id, link);
      deleteDialog.close();
    };
  });
  link.appendChild(fav);

  const imageWrapper = document.createElement('div');
  imageWrapper.classList.add('image');
  const img = document.createElement('img');
  img.classList.add('picture');
  img.alt = recipe.title;
  img.src = recipe.image || 'images/placeholder.png';
  imageWrapper.appendChild(img);
  link.appendChild(imageWrapper);

  const desc = document.createElement('div');
  desc.classList.add('discription');
  const titleP = document.createElement('p');
  titleP.classList.add('name');
  titleP.textContent = recipe.title;
  desc.appendChild(titleP);

  const authorP = document.createElement('p');
  authorP.classList.add('author');
  authorP.textContent = `Автор: ${authorName || 'Неизвестный автор'}`;
  desc.appendChild(authorP);

  const ul = document.createElement('ul');
  const liServings = document.createElement('li');
  liServings.textContent = `${recipe.servings} порций`;
  ul.appendChild(liServings);
  const liTime = document.createElement('li');
  liTime.textContent = `${recipe.cookingTime} минут`;
  ul.appendChild(liTime);
  const liIngr = document.createElement('li');
  liIngr.textContent = `${recipe.ingredients.length} ингредиентов`;
  ul.appendChild(liIngr);
  desc.appendChild(ul);
  link.appendChild(desc);

  return link;
}

async function fetchFavoriteRecipes() {
  recipesSection.innerHTML = '';
  try {
    const favResp = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!favResp.ok) {
      throw new Error(`Ошибка при получении избранного: ${favResp.status}`);
    }
    const favoriteRecipes = await favResp.json();
    if (!Array.isArray(favoriteRecipes) || favoriteRecipes.length === 0) {
      recipesSection.innerHTML = '<p>У вас пока нет избранных рецептов.</p>';
      return;
    }
    const uniqueAuthors = Array.from(new Set(favoriteRecipes.map(r => r.author)));
    const authorNameMap = {};
    await Promise.all(
      uniqueAuthors.map(async authorId => {
        try {
          const userResp = await fetch(`${API_BASE_URL}/api/users/${authorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userResp.ok) {
            const userData = await userResp.json();
            authorNameMap[authorId] = userData.username;
          } else {
            authorNameMap[authorId] = 'Неизвестный автор';
          }
        } catch {
          authorNameMap[authorId] = 'Неизвестный автор';
        }
      })
    );
    favoriteRecipes.forEach(recipe => {
      const authorName = authorNameMap[recipe.author] || 'Неизвестный автор';
      const card = createRecipeCard(recipe, authorName);
      recipesSection.appendChild(card);
    });
  } catch (err) {
    console.error('Ошибка при загрузке избранных рецептов:', err.message);
    showNotification('Не удалось загрузить избранные рецепты. Попробуйте позже.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await checkToken();
  await fetchFavoriteRecipes();
});