const currentUserId = localStorage.getItem('userId') || '';

async function toggleFavorite(event, recipeId) {
  event.stopPropagation();
  event.preventDefault();

  // Если не залогинен, перенаправить на страницу входа
  if (!currentUserId) {
    showNotification('Пожалуйста, войдите, чтобы добавлять рецепты в избранное', 'error');
    return;
  }

  const favIcon = event.currentTarget;
  const isChecked = favIcon.classList.contains('checked');
  const token = localStorage.getItem('token') || '';

  try {
    if (!isChecked) {
      // Добавляем в избранное: PUT /api/users/:id/favorites/:recipeId
      const addResp = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/favorites/${recipeId}`, {
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
    } else {
      // Убираем из избранного: DELETE /api/users/:id/favorites/:recipeId
      const delResp = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/favorites/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!delResp.ok) {
        const errData = await delResp.json();
        throw new Error(errData.message || `Ошибка ${delResp.status}`);
      }

      favIcon.classList.remove('checked');
      showNotification('Рецепт удалён из избранного', 'success');
    }
  } catch (err) {
    console.error('Ошибка при работе с избранным:', err);
    showNotification('Не удалось обновить избранное: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.recipes');
  if (!container) return;

  try {
    const token = localStorage.getItem('token') || '';
    let favoriteRecipeIds = [];

    // Запрашиваем избранные рецепты пользователя, если он авторизован
    if (currentUserId && token) {
      try {
        const favoritesResp = await fetchWithRetry(
          `${API_BASE_URL}/api/users/${currentUserId}/favorites`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (favoritesResp.ok) {
          const favorites = await favoritesResp.json();
          favoriteRecipeIds = favorites.map(recipe => recipe._id);
        }
      } catch (err) {
        console.warn('Не удалось загрузить избранные рецепты:', err);
      }
    }

    // Запрашиваем опубликованные рецепты
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
      // Если нет токена или недостаточно прав → 401/403/404/500
      throw new Error(`Ошибка при получении рецептов: ${response.status}`);
    }

    const recipes = await response.json();
    if (!Array.isArray(recipes) || recipes.length === 0) {
      container.innerHTML = '<p>Рецепты не найдены.</p>';
      return;
    }

    // const recipes = await response.json();
    const uniqueAuthors = Array.from(new Set(recipes.map(r => r.author)));
    const authorNameMap = {}; // словарь authorId → username

    // Запрашиваем имена авторов
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

    // Для каждого рецепта формируем карточку
    recipes.forEach(recipe => {
      // 1) Создаём ссылку-обёртку (href="#" пока оставляем пустым)
      const link = document.createElement('a');
      link.href = '#';
      link.classList.add('recipe');

      // 2) Иконка «избранное»
      const fav = document.createElement('div');
      fav.classList.add('favorite');
      if (favoriteRecipeIds.includes(recipe._id)) {
        fav.classList.add('checked');
      }
      fav.setAttribute('onclick', `toggleFavorite(event, '${recipe._id}')`);
      link.appendChild(fav);

      // 3) Блок с изображением
      const imageWrapper = document.createElement('div');
      imageWrapper.classList.add('image');
      const img = document.createElement('img');
      img.classList.add('picture');
      img.alt = recipe.title;
      img.src = recipe.image || '';
      imageWrapper.appendChild(img);
      link.appendChild(imageWrapper);

      // 4) Блок описания
      const desc = document.createElement('div');
      desc.classList.add('discription');

      // Название рецепта
      const titleP = document.createElement('p');
      titleP.classList.add('name');
      titleP.textContent = recipe.title;
      desc.appendChild(titleP);

      // Автор
      const authorP = document.createElement('p');
      authorP.classList.add('author');
      const authorName = authorNameMap[recipe.author] || 'Неизвестный автор';
      authorP.textContent = `Автор: ${authorName}`;
      desc.appendChild(authorP);

      // Список: порции, время, число ингредиентов
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

      // 5) Вставляем готовую карточку в контейнер
      container.appendChild(link);
    });
  } catch (err) {
    console.error(err);
    // Если есть элемент с id="error", выводим туда сообщение
    const errorDiv = document.querySelector('#error');
    if (errorDiv) {
      errorDiv.textContent = 'Не удалось загрузить рецепты. Попробуйте позже.';
    }
  }
});