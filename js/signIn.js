// JavaScript для страницы входа (signIn.html)

const errorDiv = document.getElementById('error');
const loginForm = document.getElementById('login-form');

// Проверка доступности элементов
console.log('loginForm:', loginForm);

// Проверка токена при загрузке
async function checkToken() {
    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '';
    if (!token || !userId) {
        console.log('Токен отсутствует, остаемся на странице входа');
        return;
    }
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            window.location.href = 'kabinet.html';
        } else {
            throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }
    } catch (err) {
        console.error('Проверка токена не удалась:', err.message, err.stack);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        errorDiv.textContent = err.message.includes('Failed to fetch') || err.name === 'AbortError'
            ? 'Не удалось проверить сессию. Сервер недоступен, попробуйте позже.'
            : 'Сессия истекла: ' + err.message;
    }
}

checkToken();

// Обработчик входа
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Форма входа отправлена');
    const button = loginForm.querySelector('button');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Загрузка...';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Email:', email, 'Пароль:', password);
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        console.log('Статус ответа на вход:', response.status);
        const data = await response.json();
        console.log('Данные ответа на вход:', data);
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            errorDiv.textContent = '';
            window.location.href = 'kabinet.html';
        } else {
            errorDiv.textContent = data.message || 'Неверный email или пароль';
        }
    } catch (err) {
        console.error('Ошибка входа:', err.message, err.stack);
        errorDiv.textContent = err.message.includes('Failed to fetch') || err.name === 'AbortError'
            ? 'Не удалось подключиться к серверу: ${err.message}. Проверьте соединение или попробуйте позже.'
            : 'Ошибка входа: ' + err.message;
        if (err.message.includes('CORS')) {
            errorDiv.textContent += ' Возможна проблема с CORS. Проверьте настройки сервера.';
        }
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});