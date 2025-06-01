const lkAnchor = document.getElementById('lk');
const lkText   = document.getElementById('lk-text');

function updateUserName() {
  if (!lkAnchor || !lkText) {
    console.log('Элементы lk или lk-text не найдены, пропускаем');
    return;
  }

  checkAuthAndGetUsername().then(result => {
    if (result && result.username) {
      lkText.textContent = result.username;
      lkAnchor.href = 'kabinet.html';
    } else {
      lkText.textContent = 'Личный кабинет';
      lkAnchor.href = result ? 'kabinet.html' : 'signIn.html';
    }
  });
}

document.addEventListener('DOMContentLoaded', updateUserName);
window.addEventListener('authStateChanged', updateUserName);

async function checkAuthAndGetUsername() {
  const token  = localStorage.getItem('token')  || '';
  const userId = localStorage.getItem('userId') || '';

  if (!token || !userId) {
    console.log('Токен или userId отсутствует');
    return null;
  }

  try {
    // 1) Опционально: сделать быструю проверку валидности токена
    const recipesResp = await fetchWithRetry(
      `${API_BASE_URL}/api/users/${userId}/recipes`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!recipesResp.ok) {
      throw new Error(`Ошибка проверки сессии: ${recipesResp.status}`);
    }

    // 2) Сразу запрашиваем объект юзера (тот самый новый маршрут)
    const userResp = await fetchWithRetry(
      `${API_BASE_URL}/api/users/${userId}`, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!userResp.ok) {
      console.error('Не удалось получить данные пользователя, статус', userResp.status);
      return { username: null };
    }

    const userData = await userResp.json();
    console.log('Получили с сервера:', userData);
    return { username: userData.username || null };
  } catch (err) {
    console.error('Ошибка при checkAuthAndGetUsername:', err.message);
    if (err.message.includes('401')) {
      // Если токен просрочен или вообще не валиден — чистим localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.dispatchEvent(new Event('authStateChanged'));
    }
    return null;
  }
}
