// При загрузке страницы отображаем то, что уже есть в localStorage (если есть),
// а затем асинхронно подтягиваем остальные данные с сервера
document.addEventListener('DOMContentLoaded', () => {
  immediatelyShowStoredInfo();
  fetchAndUpdateUserInfo();
});

function immediatelyShowStoredInfo() {
  const usernameElement    = document.getElementById('username');
  const emailElement       = document.getElementById('email');
  const recipeCountElement = document.getElementById('recipeCount');
  const saveCountElement   = document.getElementById('saveCount');

  if (!usernameElement || !emailElement || !recipeCountElement || !saveCountElement) {
    console.error('Элементы для отображения информации о пользователе не найдены');
    return;
  }

  // Если при входе мы сохранили имя и email в localStorage, сразу их покажем:
  const storedName  = localStorage.getItem('username');
  const storedEmail = localStorage.getItem('email');
  const storedRecipeCount = localStorage.getItem('recipeCount');

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

  // «избранных» пока нет — оставим 0
  saveCountElement.textContent   = '0';
}

async function fetchAndUpdateUserInfo() {
  const usernameElement    = document.getElementById('username');
  const emailElement       = document.getElementById('email');
  const recipeCountElement = document.getElementById('recipeCount');
  const saveCountElement   = document.getElementById('saveCount');

  if (!usernameElement || !emailElement || !recipeCountElement || !saveCountElement) {
    // Если этих элементов нет, ничего не делаем
    return;
  }

  const token  = localStorage.getItem('token')  || '';
  const userId = localStorage.getItem('userId') || '';

  if (!token || !userId) {
    // Если нет сессии, перенаправляем на страницу входа
    return redirectToSignIn();
  }

  try {
    console.log('Запрос данных пользователя...');
    // Запрашиваем базовую информацию о пользователе (username, email, recipeCount)
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

    // В ответе ожидаем { username, email, recipeCount }
    const userData = await userResp.json();
    console.log('Данные пользователя получены:', userData);

    // Обновляем на странице
    usernameElement.textContent    = userData.username    || 'Не указано';
    emailElement.textContent       = userData.email       || 'Не указано';
    recipeCountElement.textContent = userData.recipeCount || 0;
    saveCountElement.textContent   = 0; // пока избранных нет в модели

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
  localStorage.removeItem('recipeCount'); // Очищаем recipeCount
  window.dispatchEvent(new Event('authStateChanged'));
  window.location.href = 'signIn.html';
}
