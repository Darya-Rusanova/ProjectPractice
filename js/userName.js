
const lkText = document.querySelector('.text-toggle');
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
        console.error('Ошибка при проверке токена:', err.message, err.stack);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        return null;
    }
}

// Проверка при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    const username = await checkAuthAndGetUsername();
    if (username && lkText) {
        lkText.textContent = username;
    }
});