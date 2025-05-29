// C:\Users\Kseniia\Desktop\pract\ProjectPractice\js\signIn.js
console.log('signIn.js starting');

const errorDiv = document.getElementById('error');
const loginForm = document.getElementById('login-form');

console.log('loginForm:', loginForm ? 'Найден' : 'Не найден');

async function checkLogin() {
    console.log('Проверка токена');
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
        console.log('checkLogin response status:', response.status);
        if (response.ok) {
            window.location.href = 'kabinet.html';
        } else {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }
    } catch (err) {
        console.error('Ошибка проверки токена:', err.message, err.stack);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        errorDiv.textContent = err.message.includes('Failed to fetch')
            ? `Ошибка сети (токен): ${err.message}`
            : `Сессия истекла: ${err.message}`;
    }
}

checkLogin();

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Отправка формы входа');
    const button = loginForm.querySelector('button');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Загрузка...';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Email:', email);
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);
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
        errorDiv.textContent = err.message.includes('Failed to fetch')
            ? `Ошибка сети (вход): ${err.message}. Проверьте соединение или браузер.`
            : `Ошибка входа: ${err.message}`;
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});