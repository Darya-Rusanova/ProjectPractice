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

  if (!usernameElement || !emailElement) {
    console.error('Элементы для отображения информации не найдены');
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
}

async function fetchAndUpdateUserInfo({ redirectOnError = true } = {}) {
  const usernameElement    = document.getElementById('username');
  const emailElement       = document.getElementById('email');

  if (!usernameElement || !emailElement) {
    // Если этих элементов нет, ничего не делаем
    console.error('Элементы для отображения информации не найдены');
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
    console.log('Запрос данных...');
    // Запрашиваем базовую информацию о пользователе (username, email)
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

    // В ответе ожидаем { username, email }
    const userData = await userResp.json();
    console.log('Данные получены:', userData);

    // Обновляем на странице
    usernameElement.textContent    = userData.username    || 'Не указано';
    emailElement.textContent       = userData.email       || 'Не указано';

    // Перезапишем localStorage, чтобы сразу показать при следующей загрузке
    if (userData.username) {
      localStorage.setItem('username', userData.username);
    }
    if (userData.email) {
      localStorage.setItem('email', userData.email);
    }
    return true; // Явно возвращаем true при успехе
  } catch (err) {
    console.error('Ошибка при получении данных:', err.message);
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
  window.dispatchEvent(new Event('authStateChanged'));
  window.location.href = 'signIn.html';
}
