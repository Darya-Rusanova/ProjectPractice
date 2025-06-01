// Проверка при загрузке страницы
const lkAnchor = document.getElementById('lk');
const lkText = document.getElementById('lk-text');

function updateUserName() {
    checkAuthAndGetUsername().then(username => {
        if (username) {
            lkText.textContent = username;
           // lkText.href = 'kabinet.html'; // Устанавливаем ссылку на кабинет
            lkAnchor.href = 'kabinet.html';
        } else {
            lkText.textContent = 'Личный кабинет';
           // lkText.href = 'signIn.html'; // Устанавливаем ссылку на вход
            lkAnchor.href = 'signIn.html';
        }
    });
}

document.addEventListener('DOMContentLoaded', updateUserName);

// Обработчик события изменения состояния авторизации
window.addEventListener('authStateChanged', updateUserName);

async function checkAuthAndGetUsername() {
    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '';

    if (!token || !userId) {
        return null;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log(userData.username);
            return userData.username;
        } else {
            throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }
    } catch (err) {
        console.error('Ошибка при проверке токена:', err.message, err.stack);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        return null;
    }
}