const currentUserId = localStorage.getItem('userId') || '';
const token = localStorage.getItem('token') || '';
const errorDiv = document.getElementById('error');
const deleteDialog = document.getElementById('delete');
const confirmRemoveButton = document.getElementById('confirm-remove');
const cancelRemoveButton = document.getElementById('cancel-remove');
const favoriteIcon = document.getElementById('favorite-icon');

let pendingRecipeToRemove = null;
let recipeData = null;

async function toggleFavorite(event, recipeId) {
  event.stopPropagation();
  event.preventDefault();

  if (!currentUserId) {
    showNotification('Пожалуйста, войдите, чтобы добавлять рецепты в избранное', 'error');
    return;
  }

  const isChecked = favoriteIcon.classList.contains('checked');

  if (isChecked) {
    pendingRecipeToRemove = { recipeId };
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
      const data = await addResp.json();
      if (!addResp.ok) {
        throw new Error(data.message || `Ошибка ${addResp.status}`);
      }
      favoriteIcon.classList.add('checked');
      showNotification('Рецепт добавлен в избранное', 'success');
      localStorage.setItem('favoritesCount', data.favoritesCount.toString());
      const saveCountElement = document.getElementById('saveCount');
      if (saveCountElement) {
        saveCountElement.textContent = data.favoritesCount;
      }
    } catch (err) {
      console.error('Ошибка при добавлении в избранное:', err.message);
      showNotification('Не удалось добавить в избранное: ' + err.message, 'error');
    }
  }
}

if (confirmRemoveButton) {
  confirmRemoveButton.addEventListener('click', async () => {
    if (!pendingRecipeToRemove) return;

    const { recipeId } = pendingRecipeToRemove;

    try {
      const delResp = await fetchWithRetry(`${API_BASE_URL}/api/users/${currentUserId}/favorites/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await delResp.json();
      if (!delResp.ok) {
        throw new Error(data.message || `Ошибка ${delResp.status}`);
      }
      favoriteIcon.classList.remove('checked');
      showNotification('Рецепт удалён из избранного', 'success');
      localStorage.setItem('favoritesCount', data.favoritesCount.toString());
      const saveCountElement = document.getElementById('saveCount');
      if (saveCountElement) {
        saveCountElement.textContent = data.favoritesCount;
      }
    } catch (err) {
      console.error('Ошибка при удалении из избранного:', err.message);
      showNotification('Не удалось удалить из избранного: ' + err.message, 'error');
    } finally {
      pendingRecipeToRemove = null;
      deleteDialog.close();
    }
  });
}

if (cancelRemoveButton) {
  cancelRemoveButton.addEventListener('click', () => {
    pendingRecipeToRemove = null;
    deleteDialog.close();
  });
}

function generateIngredients(ingredients, baseServings, userServings = baseServings) {
  const parent = document.getElementById('grams');
  parent.innerHTML = '';

  ingredients.forEach(ingredient => {
    const div = document.createElement('div');
    div.className = 'menu';
    const pName = document.createElement('p');
    pName.className = 'pName';
    pName.textContent = `${ingredient.name} (${ingredient.unit})`;
    div.appendChild(pName);

    const pGram = document.createElement('p');
    pGram.className = 'pGram';
    let result;
    if (ingredient.quantity === 0) {
      result = 'по вкусу';
    } else {
      result = (ingredient.quantity / baseServings * userServings).toFixed(1);
      if (result.endsWith('.0')) result = result.split('.')[0];
    }
    pGram.textContent = result;
    div.appendChild(pGram);

    parent.appendChild(div);
  });
}

function countGrams(baseServings) {
  const userPortion = parseInt(document.getElementById('portion').value) || baseServings;
  generateIngredients(recipeData.ingredients, baseServings, userPortion);
}

async function fetchRecipe() {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  if (!recipeId) {
    if (errorDiv) {
      errorDiv.textContent = 'Рецепт не найден. Укажите ID рецепта.';
    }
    return;
  }

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/recipes/public/recipe/${recipeId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка при получении рецепта: ${response.status}`);
    }

    recipeData = await response.json();
    console.log('Recipe data:', recipeData);

    // Заполнение заголовка и описания
    document.getElementById('recipe-title').textContent = recipeData.title || 'Без названия';
    document.getElementById('main-image').src = recipeData.image || 'images/placeholder.png';
    document.getElementById('main-image').alt = recipeData.title || 'Рецепт';
    document.getElementById('recipe-description').textContent = recipeData.description || 'Описание отсутствует';
    document.getElementById('recipe-time').textContent = recipeData.cookingTime || 'Не указано';
    document.getElementById('recipe-servings').textContent = recipeData.servings || 'Не указано';

    // Получение имени автора
    try {
      const userResp = await fetchWithRetry(`${API_BASE_URL}/api/recipes/public/${recipeData.author}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (userResp.ok) {
        const userData = await userResp.json();
        document.getElementById('recipe-author').textContent = userData.username || 'Неизвестный автор';
      } else {
        document.getElementById('recipe-author').textContent = 'Неизвестный автор';
      }
    } catch (err) {
      console.warn('Не удалось получить имя автора:', err.message);
      document.getElementById('recipe-author').textContent = 'Неизвестный автор';
    }

    // Проверка, в избранном ли рецепт
    if (currentUserId && token) {
      try {
        const favoritesResp = await fetchWithRetry(`${API_BASE_URL}/api/users/${currentUserId}/favorites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (favoritesResp.ok) {
          const favorites = await favoritesResp.json();
          if (favorites.some(recipe => recipe._id === recipeId)) {
            favoriteIcon.classList.add('checked');
          }
        }
      } catch (err) {
        console.warn('Не удалось проверить избранное:', err.message);
      }
    }

    // Заполнение ингредиентов
    if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
      generateIngredients(recipeData.ingredients, recipeData.servings);
      document.getElementById('portion').value = recipeData.servings;
      document.getElementById('count').addEventListener('click', () => countGrams(recipeData.servings));
    } else {
      document.getElementById('grams').innerHTML = '<p>Ингредиенты не указаны.</p>';
    }

    // Заполнение шагов
    const stagesContainer = document.getElementById('recipe-stages');
    if (recipeData.steps && Array.isArray(recipeData.steps)) {
      recipeData.steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        const stepTitle = document.createElement('h3');
        stepTitle.className = 'titleStep';
        stepTitle.textContent = `ШАГ ${index + 1}`;
        stepDiv.appendChild(stepTitle);
        if (step.image) {
          const stepImg = document.createElement('img');
          stepImg.className = 'i';
          stepImg.src = step.image;
          stepImg.alt = `Шаг ${index + 1}`;
          stepDiv.appendChild(stepImg);
        }
        const stepText = document.createElement('p');
        stepText.className = 'text';
        stepText.textContent = step.description || 'Описание шага отсутствует';
        stepDiv.appendChild(stepText);
        stagesContainer.appendChild(stepDiv);
      });
    } else {
      stagesContainer.innerHTML = '<p>Шаги приготовления не указаны.</p>';
    }

    // Обработчик иконки избранного
    favoriteIcon.addEventListener('click', (event) => toggleFavorite(event, recipeId));

  } catch (err) {
    console.error('Ошибка загрузки рецепта:', err.message);
    if (errorDiv) {
      errorDiv.textContent = 'Не удалось загрузить рецепт. Попробуйте позже.';
    }
    showNotification('Ошибка загрузки рецепта: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', fetchRecipe);