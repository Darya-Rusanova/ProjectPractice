const lkAnchor = document.getElementById('lk');
const lkText = document.getElementById('lk-text');

function updateUserName() {
    if (!lkAnchor || !lkText) {
        console.log('Элементы lk или lk-text не найдены на странице, пропускаем обновление имени пользователя');
        return;
    }

    checkAuthAndGetUsername().then(result => {
        if (result) {
            lkText.textContent = result.username || 'Личный кабинет';
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

    console.log('Проверка токена:', token); // Отладка
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Ответ сервера на /recipes:', response.status, await response.text()); // Отладка
        if (response.ok) {
            // Если токен валиден, пытаемся получить имя пользователя
            const userResponse = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Ответ сервера на /users:', userResponse.status, await userResponse.text()); // Отладка
            if (userResponse.ok) {
                const userData = await userResponse.json();
                return { username: userData.username };
            } else {
                console.error('Не удалось получить имя пользователя, но токен валиден');
                return { username: null }; // Токен валиден, но имя не удалось получить
            }
        } else {
            throw new Error(`Ошибка проверки токена: ${response.status}`);
        }
    } catch (err) {
        console.error('Ошибка при проверке токена:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.dispatchEvent(new Event('authStateChanged'));
        return null;
    }
}