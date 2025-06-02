const lkAnchor = document.getElementById('lk');
const lkText   = document.getElementById('lk-text');

function updateUserName() {
  if (!lkAnchor || !lkText) {
    console.log('Элементы lk или lk-text не найдены, пропускаем');
    return;
  }

  checkAuthAndGetUsername().then(username => {
    if (username) {
      lkText.textContent = username;
      lkAnchor.href = '/kabinet.html';
    } else {
      lkText.textContent = 'Личный кабинет';
      lkAnchor.href = '/signIn.html';
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
    // Сразу запрашиваем данные пользователя
    const userResp = await fetchWithRetry(
      `${API_BASE_URL}/api/users/${userId}`, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (userResp.status === 401) {
      // Токен невалиден или просрочен
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.dispatchEvent(new Event('authStateChanged'));
      return null;
    }

    if (!userResp.ok) {
      console.error('Не удалось получить данные пользователя, статус', userResp.status);
      return null;
    }

    const userData = await userResp.json();
    return userData.username || null;

  } catch (err) {
    console.error('Ошибка при checkAuthAndGetUsername:', err.message);
    if (err.message.includes('401')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.dispatchEvent(new Event('authStateChanged'));
    }
    return null;
  }
}
