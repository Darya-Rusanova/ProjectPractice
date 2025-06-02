const adminUsername = document.getElementById('adminUsername');
const adminEmail = document.getElementById('adminEmail');
const errorDiv = document.getElementById('error');

async function fetchAdminInfo() {
    // Проверка на существование элементов
    if (!adminUsername || !adminEmail) {
        console.error('Элементы adminUsername или adminEmail не найдены на странице');
        showNotification('Ошибка: Элементы интерфейса не найдены', 'error');
        return;
    }
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
        if (response.status === 401 || response.status === 403) {
            showNotification('Ошибка: Сессия истекла или доступ запрещён', 'error');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('isAdmin');
            window.location.href = '/signIn.html';
            return;
        }
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