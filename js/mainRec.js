document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.recipes');
  if (!container) return;

  try {
    // 1) Читаем токен из localStorage (если он там есть)
    const token = localStorage.getItem('token') || '';

    // 2) Запрашиваем все опубликованные рецепты через админский роут
    //    GET /api/recipes/user/all?status=published
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

    // 3) Извлекаем JSON-массив рецептов
    const recipes = await response.json();

    // 4) Собираем массив уникальных authorId
    const uniqueAuthors = Array.from(new Set(recipes.map(r => r.author)));

    // 5) Параллельно запрашиваем имя каждого автора
    const authorNameMap = {}; // словарь authorId → username
    await Promise.all(
      uniqueAuthors.map(async authorId => {
        try {
          const userResp = await fetchWithRetry(
            `${API_BASE_URL}/api/users/${authorId}`,
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

    // 6) Для каждого рецепта формируем карточку
    recipes.forEach(recipe => {
      // 6.1) Создаём ссылку-обёртку (href="#" оставляем пустым для примера)
      const link = document.createElement('a');
      link.href = '#';
      link.classList.add('recipe');

      // 6.2) Иконка «избранное»
      const fav = document.createElement('div');
      fav.classList.add('favorite');
      fav.setAttribute('onclick', 'toggleFavorite(event)');
      link.appendChild(fav);

      // 6.3) Блок с изображением
      const imageWrapper = document.createElement('div');
      imageWrapper.classList.add('image');
      const img = document.createElement('img');
      img.classList.add('picture');
      img.alt = recipe.title;
      img.src = recipe.image || ''; // если картинки нет, src пусто
      imageWrapper.appendChild(img);
      link.appendChild(imageWrapper);

      // 6.4) Блок описания
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

      // 6.5) Вставляем готовую карточку в контейнер
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