const currentUserId = localStorage.getItem('userId') || '';
const token = localStorage.getItem('token') || '';
const errorDiv = document.getElementById('error');
const deleteDialog = document.getElementById('delete');
const confirmRemoveButton = document.getElementById('confirm-remove');
const cancelRemoveButton = document.getElementById('cancel-remove');
const favoriteIcon = document.getElementById('favorite-icon');

let pendingRecipeToRemove = null;
let recipeData = null;

const unitMapping = {
  'г': 'г',
  'кг': 'кг',
  'мл': 'мл',
  'л': 'л',
  'шт': 'шт.',
  'ст': 'ст.',
  'стл': 'ст.л.',
  'чл': 'ч.л.',
  'пв': 'по вкусу'
};

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
      console.log('Adding recipe to favorites:', recipeId);
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
      window.dispatchEvent(new Event('favoritesUpdated'));
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
      console.log('Removing recipe from favorites:', recipeId);
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

if (cancelRemoveButton) {
  cancelRemoveButton.addEventListener('click', () => {
    pendingRecipeToRemove = null;
    deleteDialog.close();
  });
}

function generateIngredients(ingredients, quantities, units, baseServings, userServings) {
  const parent = document.getElementById('grams');
  parent.innerHTML = '';

  ingredients.forEach((name, index) => {
    const div = document.createElement('div');
    div.className = 'menu';
    const pName = document.createElement('p');
    pName.className = 'pName';
    const displayUnit = unitMapping[units[index]] || units[index];
    pName.textContent = `${name} (${displayUnit})`;
    div.appendChild(pName);

    const pGram = document.createElement('p');
    pGram.className = 'pGram';
    let result;
    if (quantities[index] === 0) {
      result = 'по вкусу';
    } else {
      const scaledQuantity = (quantities[index] / baseServings) * userServings;
      result = scaledQuantity.toFixed(1);
      if (result.endsWith('.0')) result = result.split('.')[0];
    }
    pGram.textContent = result;
    div.appendChild(pGram);

    parent.appendChild(div);
  });
}

function countGrams(baseServings) {
  const portionInput = document.getElementById('portion');
  const userPortion = parseInt(portionInput.value);

  if (isNaN(userPortion) || userPortion < 1) {
    showNotification('Введите количество порций (не менее 1)', 'error');
    portionInput.value = baseServings;
    generateIngredients(recipeData.ingredients, recipeData.ingredientQuantities, recipeData.ingredientUnits, baseServings, baseServings);
    return;
  }

  generateIngredients(recipeData.ingredients, recipeData.ingredientQuantities, recipeData.ingredientUnits, baseServings, userPortion);
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
    console.log('Fetching recipe with ID:', recipeId);
    const response = await fetchWithRetry(`${API_BASE_URL}/api/recipes/${recipeId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Response error:', errData);
      throw new Error(errData.message || `Ошибка ${response.status}`);
    }

    recipeData = await response.json();
    console.log('Recipe data:', recipeData);

    document.getElementById('recipe-title').textContent = recipeData.title || 'Без названия';
    document.getElementById('main-image').src = recipeData.image || 'images/placeholder.png';
    document.getElementById('main-image').alt = recipeData.title || 'Рецепт';
    document.getElementById('recipe-description').textContent = recipeData.description || 'Описание отсутствует';
    document.getElementById('recipe-time').textContent = recipeData.cookingTime || 'Не указано';
    document.getElementById('recipe-servings').textContent = recipeData.servings || 'Не указано';

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

    if (recipeData.ingredients && Array.isArray(recipeData.ingredients) &&
        recipeData.ingredientQuantities && Array.isArray(recipeData.ingredientQuantities) &&
        recipeData.ingredientUnits && Array.isArray(recipeData.ingredientUnits)) {
      const baseServings = recipeData.servings;
      generateIngredients(recipeData.ingredients, recipeData.ingredientQuantities, recipeData.ingredientUnits, baseServings, baseServings);
      const portionInput = document.getElementById('portion');
      portionInput.value = baseServings;

      // Запрет ввода не-цифр и обработка Enter
      portionInput.addEventListener('keypress', (event) => {
        const charCode = event.charCode || event.keyCode;
        if (charCode === 13) { // Клавиша Enter
          event.preventDefault();
          countGrams(baseServings);
        } else if (charCode < 48 || charCode > 57) { // Разрешены только 0-9
          event.preventDefault();
        }
      });

      portionInput.addEventListener('input', () => {
        const cleanedValue = portionInput.value.replace(/[^0-9]/g, '');
        if (cleanedValue !== portionInput.value) {
          portionInput.value = cleanedValue;
        }
      });

      // Обработчик клика на кнопку
      document.getElementById('count').addEventListener('click', () => countGrams(baseServings));
    } else {
      document.getElementById('grams').innerHTML = '<p>Ингредиенты не указаны.</p>';
    }

    const stagesContainer = document.getElementById('recipe-stages');
    if (stagesContainer && recipeData.steps && Array.isArray(recipeData.steps)) {
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
    } else if (stagesContainer) {
      stagesContainer.innerHTML = '<p>Шаги приготовления не указаны.</p>';
    }

    if (favoriteIcon) {
      favoriteIcon.addEventListener('click', (event) => toggleFavorite(event, recipeId));
    }

  } catch (err) {
    console.error('Ошибка загрузки рецепта:', err.message);
    if (errorDiv) {
      errorDiv.textContent = 'Не удалось загрузить рецепт. Попробуйте позже.';
    }
    showNotification('Ошибка загрузки рецепта: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', fetchRecipe);