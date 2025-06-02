document.addEventListener('DOMContentLoaded', updateUserInfo);

async function updateUserInfo() {
    const usernameElement    = document.getElementById('username');
    const emailElement       = document.getElementById('email');
    const recipeCountElement = document.getElementById('recipeCount');
    const saveCountElement   = document.getElementById('saveCount');

    // Проверяем наличие элементов
    if (!usernameElement || !emailElement || !recipeCountElement || !saveCountElement) {
        console.error('Один или несколько элементов для отображения информации о пользователе не найдены');
        return;
    }

    const token  = localStorage.getItem('token')  || '';
    const userId = localStorage.getItem('userId') || '';

    // Если нет токена или userId — отправляем на вход
    if (!token || !userId) {
        console.error('Токен или userId отсутствует в localStorage');
        return redirectToSignIn();
    }

    try {
        // Запрашиваем данные конкретного пользователя
        const response = await fetchWithRetry(
            `${API_BASE_URL}/api/users/${userId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        // Если токен просрочен или невалиден
        if (response.status === 401) {
            return redirectToSignIn();
        }

        if (!response.ok) {
            throw new Error(`Ошибка получения данных пользователя: ${response.status}`);
        }

        // Теперь тело ответа точно JSON: { username, email, recipeCount }
        const userData = await response.json();
        console.log('Данные пользователя:', userData);

        // Заполняем поля на странице
        usernameElement.textContent    = userData.username    || 'Не указано';
        emailElement.textContent       = userData.email       || 'Не указано';
        recipeCountElement.textContent = userData.recipeCount || 0;
        saveCountElement.textContent   = 0; // Пока «избранных» нет в модели, ставим 0

    } catch (err) {
        console.error('Ошибка при получении данных пользователя:', err.message);
        // Если нас послали «404» (нет такого пользователя) или другая ошибка — тоже отправим на вход
        redirectToSignIn();
    }
}

function redirectToSignIn() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.dispatchEvent(new Event('authStateChanged'));
    window.location.href = 'signIn.html';
}
