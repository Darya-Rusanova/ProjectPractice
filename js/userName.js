const lkAnchor = document.getElementById('lk');
const lkText = document.getElementById('lk-text');

function updateUserName() {
    if (!lkAnchor || !lkText) {
        console.log('Элементы lk или lk-text не найдены на странице, пропускаем обновление имени пользователя');
        return;
    }

    checkAuthAndGetUsername().then(isAuthenticated => {
        if (isAuthenticated) {
            lkText.textContent = 'Личный кабинет'; // Временно убираем зависимость от имени
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
        return false;
    }

    console.log('Проверка токена:', token); // Отладка
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Ответ сервера на /recipes:', response.status, await response.text()); // Отладка
        return response.ok; // Возвращаем true, если токен валиден
    } catch (err) {
        console.error('Ошибка при проверке токена:', err.message);
        // Удаляем токен только если ошибка явно указывает на недействительность (например, 401)
        if (err.message.includes('401')) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.dispatchEvent(new Event('authStateChanged'));
        }
        return false;
    }
}