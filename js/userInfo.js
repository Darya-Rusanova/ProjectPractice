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
    if (redirectOnError) {
      redirectToSignIn();
    }
    return false;
  }

  try {
    console.log('Запрос данных пользователя...');
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

    const userData = await userResp.json();
    console.log('Данные пользователя получены:', {
      username: userData.username,
      recipeCount: userData.recipeCount,
      favoritesCount: userData.favoritesCount
    });

    usernameElement.textContent    = userData.username    || 'Не указано';
    emailElement.textContent       = userData.email       || 'Не указано';
    recipeCountElement.textContent = userData.recipeCount || 0;
    saveCountElement.textContent   = userData.favoritesCount || 0;

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
    return true;
  } catch (err) {
    console.error('Ошибка при получении данных пользователя:', err.message);
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
