document.addEventListener('DOMContentLoaded', updateUserInfo);

async function updateUserInfo() {
    const usernameElement = document.getElementById('username');
    const emailElement = document.getElementById('email');
    const recipeCountElement = document.getElementById('recipeCount');
    const saveCountElement = document.getElementById('saveCount');

    // Проверяем наличие элементов
    if (!usernameElement || !emailElement || !recipeCountElement || !saveCountElement) {
        console.error('Один или несколько элементов для отображения информации о пользователе не найдены');
        return;
    }

    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '';

    // Проверяем наличие токена и userId
    if (!token || !userId) {
        console.error('Токен или userId отсутствует в localStorage');
        redirectToSignIn();
        return;
    }

    try {
        // Запрашиваем данные пользователя через API
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Ответ сервера на /users/:id:', response.status, await response.text());

        if (response.ok) {
            const userData = await response.json();
            console.log('Данные пользователя:', userData);

            // Обновляем элементы на странице
            usernameElement.textContent = userData.username || 'Не указано';
            emailElement.textContent = userData.email || 'Не указано';
            recipeCountElement.textContent = userData.recipeCount || 0;
            saveCountElement.textContent = 0; // Временно, так как поле отсутствует в модели
        } else {
            throw new Error(`Ошибка получения данных пользователя: ${response.status}`);
        }
    } catch (err) {
        console.error('Ошибка при получении данных пользователя:', err.message);
        if (err.message.includes('401')) {
            // Если токен недействителен, перенаправляем на страницу входа
            redirectToSignIn();
        } else {
            // Отображаем заглушки в случае ошибки
            usernameElement.textContent = 'Ошибка';
            emailElement.textContent = 'Ошибка';
            recipeCountElement.textContent = '0';
            saveCountElement.textContent = '0';
        }
    }
}

function redirectToSignIn() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.dispatchEvent(new Event('authStateChanged'));
    window.location.href = 'signIn.html';
}