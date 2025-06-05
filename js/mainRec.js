const currentUserId = localStorage.getItem('userId') || '';
const deleteDialog = document.getElementById('delete');
const confirmRemoveButton = document.getElementById('confirm-remove');
const cancelRemoveButton = document.getElementById('cancel-remove');
const errorDiv = document.getElementById('error');

let pendingRecipeToRemove = null;

async function toggleFavorite(event, recipeId, favIcon) {
  event.stopPropagation();
  event.preventDefault();

  if (!currentUserId) {
    showNotification('Пожалуйста, войдите, чтобы добавлять рецепты в избранное', 'error');
    return;
  }

  const isChecked = favIcon.classList.contains('checked');
  const token = localStorage.getItem('token') || '';

  if (isChecked) {
    pendingRecipeToRemove = { recipeId: recipeId, favIcon };
    deleteDialog.showModal();
  } else {
    try {
      const addResp = await fetchWithRetry(`${API_BASE_URL}/api/users/${currentUserId}/favorites/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!addResp.ok) {
        const errData = await addResp.json();
        throw new Error(errData.message || `Ошибка ${addResp.status}`);
      }
      favIcon.classList.add('checked');
      showNotification('Рецепт добавлен в избранное', 'success');
      window.dispatchEvent(new Event('favoritesUpdated'));
    } catch (err) {
      console.error('Ошибка при работе с избранным:', err.message);
      showNotification('Не удалось обновить избранное: ' + err.message, 'error');
    }
  }
}

// Обработчик подтверждения удаления
if (confirmRemoveButton) {
  confirmRemoveButton.addEventListener('click', async () => {
    if (!pendingRecipeToRemove) return;

    const { recipeId, favIcon } = pendingRecipeToRemove;
    const token = localStorage.getItem('token') || '';

    try {
      const delResp = await fetchWithRetry(`${API_BASE_URL}/api/users/${currentUserId}/favorites/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!delResp.ok) {
        const errData = await delResp.json();
        throw new Error(errData.message || `Ошибка ${delResp.status}`);
      }
      favIcon.classList.remove('checked');
      showNotification('Рецепт удалён из избранного', 'success');
      window.dispatchEvent(new Event('favoritesUpdated'));
    } catch (err) {
      console.error('Ошибка при удалении из избранного:', err.message);
      showNotification('Не удалось удалить из избранного: ' + err.message, 'error');
    } finally {
      pendingRecipeToRemove = null;
      deleteDialog.close();
    }
  });
}

// Обработчик отмены
if (cancelRemoveButton) {
  cancelRemoveButton.addEventListener('click', () => {
    pendingRecipeToRemove = null;
    deleteDialog.close();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.recipes');
  if (!container) {
    console.error('Контейнер .recipes не найден');
    return;
  }

  try {
    const token = localStorage.getItem('token') || '';
    let favoriteRecipeIds = [];

    if (currentUserId && token) {
      try {
        const favoritesResp = await fetchWithRetry(
          `${API_BASE_URL}/api/users/${currentUserId}/favorites`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (favoritesResp.ok) {
          const favorites = await favoritesResp.json();
          favoriteRecipeIds = favorites.map(recipe => recipe._id);
        }
      } catch (err) {
        console.warn('Не удалось загрузить избранные рецепты:', err.message);
      }
    }

    const response = await fetchWithRetry(
      `${API_BASE_URL}/api/recipes/public`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка при получении рецептов: ${response.status}`);
    }

    const recipes = await response.json();
    if (!Array.isArray(recipes) || recipes.length === 0) {
      container.innerHTML = '<p>Рецепты не найдены.</p>';
      return;
    }

    const uniqueAuthors = Array.from(new Set(recipes.map(r => r.author)));
    const authorNameMap = {};

    await Promise.all(
      uniqueAuthors.map(async authorId => {
        try {
          const userResp = await fetchWithRetry(
            `${API_BASE_URL}/api/recipes/public/${authorId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              }
            }
          );
          if (userResp.ok) {
            const userData = await userResp.json();
            authorNameMap[authorId] = userData.username || 'Неизвестный автор';
          } else {
            authorNameMap[authorId] = 'Неизвестный автор';
          }
        } catch (e) {
          authorNameMap[authorId] = 'Неизвестный автор';
        }
      })
    );

    recipes.forEach(recipe => {
      const link = document.createElement('a');
      link.href = `/recipe.html?id=${recipe._id}`;
      link.classList.add('recipe');

      const fav = document.createElement('div');
      fav.classList.add('favorite');
      if (favoriteRecipeIds.includes(recipe._id)) {
        fav.classList.add('checked');
      }
      fav.addEventListener('click', (event) => toggleFavorite(event, recipe._id, fav));
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
      const authorName = authorNameMap[recipe.author] || 'Неизвестный автор';
      authorP.textContent = `Автор: ${authorName}`;
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

      container.appendChild(link);
    });
  } catch (err) {
    console.error('Ошибка загрузки рецептов:', err.message);
    if (errorDiv) {
      errorDiv.textContent = 'Не удалось загрузить рецепты. Попробуйте позже.';
    }
  }
});