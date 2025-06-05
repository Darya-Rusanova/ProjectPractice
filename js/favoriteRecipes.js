const token = localStorage.getItem('token') || '';
const currentUserId = localStorage.getItem('userId') || '';

const recipesSection = document.querySelector('.recipes');
const errorDiv = document.getElementById('error');
const logoutButton = document.getElementById('logout');

const deleteDialog = document.getElementById('delete');
const confirmRemoveButton = document.getElementById('confirm-remove');
const cancelRemoveButton = document.getElementById('cancel-remove');

let pendingRecipeToRemove = null;

async function checkToken() {
  if (!token || !currentUserId) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const resp = await fetchWithRetry(`${API_BASE_URL}/api/users/${currentUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
  } catch (err) {
    console.error('Ошибка проверки токена:', err.message);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('favoritesCount');
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
    const resp = await fetchWithRetry(`${API_BASE_URL}/api/users/${currentUserId}/favorites/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.message || `Ошибка ${resp.status}`);
    }
    // Удаляем карточку из DOM
    if (cardElement && cardElement.parentNode) {
      cardElement.parentNode.removeChild(cardElement);
    }
    showNotification('Рецепт удалён из избранного', 'success');
    localStorage.setItem('favoritesCount', data.favoritesCount.toString());
    document.getElementById('saveCount').textContent = data.favoritesCount;
    window.dispatchEvent(new Event('favoritesUpdated')); // Для userInfo.js
    // Проверяем, остались ли рецепты
    if (recipesSection && recipesSection.getElementsByClassName('recipe').length === 0) {
      recipesSection.innerHTML = '<p>У вас пока нет избранных рецептов.</p>';
    }
  } catch (err) {
    console.error('Ошибка при удалении из избранного:', err.message);
    showNotification('Не удалось удалить из избранного: ' + err.message, 'error');
  }
}

function createRecipeCard(recipe, authorName) {
  const link = document.createElement('a');
  link.href = "/recipe.html?id={recipe._id}";
  link.classList.add('recipe');

  const fav = document.createElement('div');
  fav.classList.add('favorite', 'checked');
  fav.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
    pendingRecipeToRemove = { recipeId: recipe._id, cardElement: link };
    deleteDialog.showModal();
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

// Обработчик подтверждения удаления
if (confirmRemoveButton) {
  confirmRemoveButton.addEventListener('click', async () => {
    if (!pendingRecipeToRemove) return;
    const { recipeId, cardElement } = pendingRecipeToRemove;
    await removeFromFavorites(recipeId, cardElement);
    pendingRecipeToRemove = null;
    if (deleteDialog) deleteDialog.close();
  });
}

// Обработчик отмены
if (cancelRemoveButton) {
  cancelRemoveButton.addEventListener('click', () => {
    pendingRecipeToRemove = null;
    if (deleteDialog) deleteDialog.close();
  });
}

async function fetchFavoriteRecipes() {
  if (!recipesSection) {
    console.error('Контейнер .recipes не найден');
    return;
  }
  recipesSection.innerHTML = '';
  try {
    const favResp = await fetchWithRetry(`${API_BASE_URL}/api/users/${currentUserId}/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!favResp.ok) {
      throw new Error(`Ошибка при получении избранного: ${favResp.status}`);
    }
    const favoriteRecipes = await favResp.json();
    console.log('Favorite recipes received:', favoriteRecipes);
    if (!Array.isArray(favoriteRecipes) || favoriteRecipes.length === 0) {
      recipesSection.innerHTML = '<p>У вас пока нет избранных рецептов.</p>';
      return;
    }
    const uniqueAuthors = Array.from(new Set(favoriteRecipes.map(r => r.author)));
    const authorNameMap = new Map();
    await Promise.all(
      uniqueAuthors.map(async authorId => {
        try {
          const userResp = await fetchWithRetry(`${API_BASE_URL}/api/recipes/public/${authorId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
          if (userResp.ok) {
            const userData = await userResp.json();
            authorNameMap.set(authorId, userData.username || 'Неизвестный автор');
          } else {
            authorNameMap.set(authorId, 'Неизвестный автор');
          }
        } catch (err) {
          console.warn(`Не удалось получить имя автора ${authorId}:`, err.message);
          authorNameMap.set(authorId, 'Неизвестный автор');
        }
      })
    );
    favoriteRecipes.forEach(recipe => {
      const authorName = authorNameMap.get(recipe.author) || 'Неизвестный автор';
      const card = createRecipeCard(recipe, authorName);
      recipesSection.appendChild(card);
    });
  } catch (err) {
    console.error('Ошибка при загрузке избранных рецептов:', err.message);
    if (errorDiv) {
      errorDiv.textContent = 'Не удалось загрузить избранные рецепты. Попробуйте позже.';
    }
    showNotification('Не удалось загрузить избранные рецепты: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await checkToken();
  await fetchFavoriteRecipes();
});