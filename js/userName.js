const lkAnchor = document.getElementById('lk');
const lkText   = document.getElementById('lk-text');

function immediatelyShowStoredName() {
  if (!lkAnchor || !lkText) return;

  const stored = localStorage.getItem('username');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (stored) {
    lkText.textContent = stored;
    lkAnchor.href = isAdmin ? '/adminCabinet.html' : '/kabinet.html';
  } else {
    lkText.textContent = 'Личный кабинет';
    lkAnchor.href = '/signIn.html';
  }
}

async function fetchAndUpdateName() {
  if (!lkAnchor || !lkText) return;

  const token  = localStorage.getItem('token')  || '';
  const userId = localStorage.getItem('userId') || '';
  if (!token || !userId) {
    lkText.textContent = 'Личный кабинет';
    lkAnchor.href = '/signIn.html';
    return;
  }

  try {
    const userResp = await fetchWithRetry(
      `${API_BASE_URL}/api/users/${userId}`, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (userResp.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('isAdmin');
      window.dispatchEvent(new Event('authStateChanged'));
      lkText.textContent = 'Личный кабинет';
      lkAnchor.href = '/signIn.html';
      return;
    }

    if (!userResp.ok) {
      console.error('Не удалось получить данные пользователя, статус', userResp.status);
      return;
    }

    const userData = await userResp.json();
    if (userData.username) {
      lkText.textContent = userData.username;
      lkAnchor.href = localStorage.getItem('isAdmin') === 'true' ? '/adminCabinet.html' : '/kabinet.html';
      localStorage.setItem('username', userData.username);
    }
  } catch (err) {
    console.error('Ошибка при fetchAndUpdateName:', err.message);
    if (err.message.includes('401')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('isAdmin');
      window.dispatchEvent(new Event('authStateChanged'));
      lkText.textContent = 'Личный кабинет';
      lkAnchor.href = '/signIn.html';
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  immediatelyShowStoredName();
  fetchAndUpdateName();
});
window.addEventListener('authStateChanged', () => {
  immediatelyShowStoredName();
  fetchAndUpdateName();
});
