// JavaScript для страницы входа (signIn.html)

const errorDiv = document.getElementById('error');
const loginForm = document.getElementById('login-form');

const API_BASE_URL = 'https://chudobludo-backend.onrender.com';

// Функция для выполнения запроса с повторными попытками
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempt ${i + 1} to fetch ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            console.log(`Response status for ${url}: ${response.status}`);
            return response;
        } catch (err) {
            console.error(`Fetch attempt ${i + 1} failed for ${url}:`, err.message);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Проверка доступности элементов
console.log('loginForm:', loginForm);

// Проверка токена при загрузке
async function checkToken() {
    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '';
    if (!token || !userId) {
        console.log('No token, staying on login page');
        return;
    }
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            window.location.href = 'kabinet.html';
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (err) {
        console.error('Token check failed:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        errorDiv.textContent = err.message.includes('Failed to fetch') 
            ? 'Не удалось проверить сессию. Сервер недоступен, попробуйте позже.' 
            : 'Сессия истекла: ' + err.message;
    }
}

checkToken();

// Обработчик входа
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Login form submitted');
    const button = loginForm.querySelector('button');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Загрузка...';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Email:', email, 'Password:', password);
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
        console.error('Login error:', err.message);
        errorDiv.textContent = err.message.includes('Failed to fetch') 
            ? 'Не удалось подключиться к серверу. Проверьте соединение или попробуйте позже.' 
            : 'Ошибка входа: ' + err.message;
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});