// При загрузке страницы отображаем то, что уже есть в localStorage (если есть),
// а затем асинхронно подтягиваем остальные данные с сервера
document.addEventListener('DOMContentLoaded', () => {
  immediatelyShowStoredInfo();
  fetchAndUpdateUserInfo();
  window.addEventListener('favoritesUpdated', () => fetchAndUpdateUserInfo({ redirectOnError: false }));
  window.addEventListener('recipesUpdated', () => fetchAndUpdateUserInfo({ redirectOnError: false }));
});

function immediatelyShowStoredInfo() {
  const usernameElement    = document.getElementById('username');
  const emailElement       = document.getElementById('email');
  const recipeCountElement = document.getElementById('recipeCount');
  const saveCountElement   = document.getElementById('saveCount');

  if (!usernameElement || !emailElement) {
    console.error('Элементы для отображения информации о пользователе не найдены');
    return;
  }

  // Если при входе мы сохранили в localStorage, сразу их покажем:
  const storedName  = localStorage.getItem('username');
  const storedEmail = localStorage.getItem('email');
  const storedRecipeCount = localStorage.getItem('recipeCount');
  const storedSaveCount = localStorage.getItem('favoritesCount');

  if (storedName) {
    usernameElement.textContent = storedName;
  }
  if (storedEmail) {
    emailElement.textContent = storedEmail;
  }

  if (storedRecipeCount !== null) {
    recipeCountElement.textContent = storedRecipeCount;
  } else {
    recipeCountElement.textContent = '0';
  }

  if (storedSaveCount !== null) {
    saveCountElement.textContent = storedSaveCount;
  } else {
    saveCountElement.textContent = '0';
  }
}

async function fetchAndUpdateUserInfo({ redirectOnError = true } = {}) {
  const usernameElement    = document.getElementById('username');
  const emailElement       = document.getElementById('email');
  const recipeCountElement = document.getElementById('recipeCount');
  const saveCountElement   = document.getElementById('saveCount');

  if (!usernameElement || !emailElement) {
    console.error('Элементы для отображения информации о пользователе не найдены');
    return;
  }

  const token  = localStorage.getItem('token')  || '';
  const userId = localStorage.getItem('userId') || '';

  if (!token || !userId) {
    // Если нет сессии, перенаправляем на страницу входа
    if (redirectOnError) {
      redirectToSignIn();
    }
    return false;
  }

  try {
    console.log('Запрос данных пользователя...');
    // Запрашиваем базовую информацию о пользователе
    const userResp = await fetchWithRetry(
      `${API_BASE_URL}/api/users/${userId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (userResp.status === 401) {
      if (redirectOnError) {
        redirectToSignIn();
      }
      return false;
    }

    if (!userResp.ok) {
      throw new Error(`Ошибка ${userResp.status}`);
    }

    // В ответе ожидаем { username, email, recipeCount, favoritesCount }
    const userData = await userResp.json();
    console.log('Данные пользователя получены:', {
      username: userData.username,
      recipeCount: userData.recipeCount,
      favoritesCount: userData.favoritesCount
    });

    // Обновляем на странице
    usernameElement.textContent    = userData.username    || 'Не указано';
    emailElement.textContent       = userData.email       || 'Не указано';
    recipeCountElement.textContent = userData.recipeCount || 0;
    saveCountElement.textContent   = userData.favoritesCount || 0;

    // Перезапишем localStorage, чтобы сразу показать при следующей загрузке
    if (userData.username) {
      localStorage.setItem('username', userData.username);
    }
    if (userData.email) {
      localStorage.setItem('email', userData.email);
    }
    if (typeof userData.recipeCount === 'number') {
      localStorage.setItem('recipeCount', userData.recipeCount.toString());
      console.log(`Обновлено recipeCount в localStorage: ${userData.recipeCount}`);
    }
    if (typeof userData.favoritesCount === 'number') {
      localStorage.setItem('favoritesCount', userData.favoritesCount.toString());
      console.log(`Обновлено favoritesCount в localStorage: ${userData.favoritesCount}`);
    }
    return true; // Явно возвращаем true при успехе
  } catch (err) {
    console.error('Ошибка при получении данных пользователя:', err.message);
    // Любая другая ошибка — стереть сессию и увести на вход
    if (redirectOnError) {
      redirectToSignIn();
    }
    return false;
  }
}

function redirectToSignIn() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('recipeCount');
  localStorage.removeItem('favoritesCount');
  window.dispatchEvent(new Event('authStateChanged'));
  window.location.href = 'signIn.html';
}
