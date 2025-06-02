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

  if (storedName) {
    usernameElement.textContent = storedName;
  }
  if (storedEmail) {
    emailElement.textContent = storedEmail;
  }

  // Рецептов и «избранных» пока может не быть — оставим 0, пока не придут данные с сервера
  recipeCountElement.textContent = '0';
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
    // Запрашиваем базовую информацию о пользователе (username, email, recipeCount)
    const userResp = await fetchWithRetry(
      `${API_BASE_URL}/api/users/${userId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (userResp.status === 401) {
      // Токен просрочен/некорректен
      return redirectToSignIn();
    }

    if (!userResp.ok) {
      throw new Error(`Ошибка ${userResp.status}`);
    }

    // В ответе ожидаем { username, email, recipeCount }
    const userData = await userResp.json();

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
  } catch (err) {
    console.error('Ошибка при получении данных пользователя:', err.message);
    // Любая другая ошибка — стереть сессию и увести на вход
    redirectToSignIn();
  }
}

function redirectToSignIn() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  window.dispatchEvent(new Event('authStateChanged'));
  window.location.href = 'signIn.html';
}
