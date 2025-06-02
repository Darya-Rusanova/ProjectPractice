const adminUsername = document.getElementById('adminUsername');
const adminEmail = document.getElementById('adminEmail');
const errorDiv = document.getElementById('error');

async function fetchAdminInfo() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
        showNotification('Ошибка: Нет данных авторизации', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Не удалось загрузить данные администратора');
        const userData = await response.json();
        adminUsername.textContent = userData.username || 'Неизвестно';
        adminEmail.textContent = userData.email || 'Неизвестно';
    } catch (err) {
        showNotification(`Ошибка: ${err.message}`, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminInfo();
});