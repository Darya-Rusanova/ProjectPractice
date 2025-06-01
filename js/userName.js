const lkAnchor = document.getElementById('lk');
const lkText = document.getElementById('lk-text');

function updateUserName() {
    checkAuthAndGetUsername().then(username => {
        if (username) {
            lkText.textContent = username;
            lkAnchor.href = 'kabinet.html';
        } else {
            lkText.textContent = 'Личный кабинет';
            lkAnchor.href = 'signIn.html';
        }
    });
}

document.addEventListener('DOMContentLoaded', updateUserName);
window.addEventListener('authStateChanged', updateUserName);

async function checkAuthAndGetUsername() {
    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '';

    if (!token || !userId) {
        console.log('Токен или userId отсутствует');
        return null;
    }

    try {
        // Используем тот же запрос, что в signIn.js и kabinet.js
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            // Если запрос успешен, делаем дополнительный запрос, чтобы получить имя пользователя
            const userResponse = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                return userData.username;
            } else {
                throw new Error(`Ошибка получения данных пользователя: ${userResponse.status}`);
            }
        } else {
            throw new Error(`Ошибка проверки токена: ${response.status}`);
        }
    } catch (err) {
        console.error('Ошибка при проверке токена:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.dispatchEvent(new Event('authStateChanged')); // Уведомляем о смене состояния
        return null;
    }
}