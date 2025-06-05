document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.recipes');
  if (!container) return;

  try {
    // 1) Получаем все опубликованные рецепты
    // Предполагаем, что ваш бэкенд отдаёт все рецепты по GET /api/recipes (только с status = "published").
    // Если у вас роут другой, замените URL на корректный.
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Ошибка при получении рецептов: ${response.status}`);
    }

    const recipes = await response.json();
    // Если ваш бэкенд отдаёт вместе с рецептом поле author (ObjectId), нам нужно получить имя автора.
    // Собираем массив уникальных authorId (чтобы не запрашивать одного и того же автора дважды)
    const uniqueAuthors = Array.from(new Set(recipes.map(r => r.author)));

    // 2) Параллельно запрашиваем имена авторов по их ID
    const authorNameMap = {}; // словарь: authorId → username
    await Promise.all(
      uniqueAuthors.map(async authorId => {
        try {
          const userResp = await fetch(`${API_BASE_URL}/users/${authorId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
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

    // 3) Для каждого рецепта создаём HTML‐блок и вставляем его в контейнер
    recipes.forEach(recipe => {
      // Создаём ссылку-обёртку (пока href="#", но вы можете поставить любой URL)
      const link = document.createElement('a');
      link.href = '#';
      link.classList.add('recipe');

      // 3.1) Блок «избранное»
      const fav = document.createElement('div');
      fav.classList.add('favorite');
      // toggleFavorite определён прямо в index.html, оставляем поведение «при клике»:
      fav.setAttribute('onclick', 'toggleFavorite(event)');
      link.appendChild(fav);

      // 3.2) Блок с изображением
      const imageWrapper = document.createElement('div');
      imageWrapper.classList.add('image');
      const img = document.createElement('img');
      img.classList.add('picture');
      img.alt = recipe.title;
      img.src = recipe.image || ''; // если нет картинки, src пустой
      imageWrapper.appendChild(img);
      link.appendChild(imageWrapper);

      // 3.3) Блок описания
      const desc = document.createElement('div');
      desc.classList.add('discription');

      // Название рецепта
      const titleP = document.createElement('p');
      titleP.classList.add('name');
      titleP.textContent = recipe.title;
      desc.appendChild(titleP);

      // Добавляем строку с автором
      const authorP = document.createElement('p');
      authorP.classList.add('author');
      const authorName = authorNameMap[recipe.author] || 'Неизвестный автор';
      authorP.textContent = `Автор: ${authorName}`;
      desc.appendChild(authorP);

      // Список параметров: порции, время, количество ингредиентов
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

      // Вставляем готовую карточку в контейнер
      container.appendChild(link);
    });
  } catch (err) {
    console.error(err);
    // Можно показать уведомление об ошибке для пользователя
    const errorDiv = document.querySelector('#error');
    if (errorDiv) {
      errorDiv.textContent = 'Не удалось загрузить рецепты. Попробуйте позже.';
    }
  }
});
