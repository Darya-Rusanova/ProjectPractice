// Проверка при загрузке страницы
const lkText = document.getElementById('lk-text');
document.addEventListener('DOMContentLoaded', async () => {
    const username = await checkAuthAndGetUsername();
    if (username) {
        lkText.textContent = username;
    }
    else {
        lkText.textContent = "Личный кабинет";
    }
});

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
            alert(userData.username); 
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

