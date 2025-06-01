// Проверка при загрузке страницы
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
        return null;
    }

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            return userData.username;
        } else {
            throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }
    } catch (err) {
        console.error('Ошибка при проверке токена:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        return null;
    }
}