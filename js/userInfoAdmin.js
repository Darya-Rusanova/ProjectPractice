const adminUsername = document.getElementById('adminUsername');
const adminEmail = document.getElementById('adminEmail');

async function fetchAdminInfo() {
    if (!adminUsername || !adminEmail) {
        console.error('Элементы adminUsername или adminEmail не найдены на странице');
        return;
    }

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        redirectToSignIn();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            redirectToSignIn();
            return;
        }

        if (!response.ok) {
            throw new Error('Не удалось загрузить данные администратора');
        }

        const userData = await response.json();
        adminUsername.textContent = userData.username || 'Неизвестно';
        adminEmail.textContent = userData.email || 'Неизвестно';
    } catch (err) {
        console.error('Ошибка при получении данных:', err.message);
        redirectToSignIn();
        return;
    }
}

function redirectToSignIn() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('isAdmin');
    window.dispatchEvent(new Event('authStateChanged'));
    window.location.href = window.location.origin + '/signIn.html';
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminInfo();
});