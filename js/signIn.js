console.log('signIn.js starting', 'User-Agent:', navigator.userAgent);

const errorDiv = document.getElementById('error');
const loginForm = document.getElementById('login-form');
const adminSwitchInput = document.querySelector('.admin-switch-input');
const adminCodeInput = document.getElementById('admin-code');

console.log('loginForm:', loginForm ? 'Найден' : 'Не найден');

async function checkLogin() {
    console.log('Проверка токена');
    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '';
    const role = localStorage.getItem('role') || 'user';
    if (!token || !userId) {
        console.log('Токен отсутствует, остаемся на странице входа');
        return;
    }
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('checkLogin status:', response.status, 'CORS:', response.headers.get('Access-Control-Allow-Origin'));
        if (response.ok) {
            window.location.href = role === 'admin' ? 'adminCabinet.html' : 'kabinet.html';
        } else {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }
    } catch (err) {
        console.error('Ошибка проверки токена:', err.message, err.stack, 'Type:', err.name);
        errorDiv.textContent = err.message.includes('Failed to fetch')
            ? `Ошибка сети (токен): ${err.message} (${err.name})`
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
    const isAdmin = adminSwitchInput.checked;
    const adminCode = adminCodeInput.value.trim();

    console.log('Email:', email);
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; ChudoBludo/1.0)'
            },
            body: JSON.stringify({ email, password }),
            mode: 'cors',
            credentials: 'include'
        });
        console.log('Login status:', response.status, 'CORS:', response.headers.get('Access-Control-Allow-Origin'));
        const data = await response.json();
        console.log('Login data:', data);
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('role', data.role || 'user');
            errorDiv.textContent = '';

            // Если пользователь отметил "Я администратор", проверяем код
            if (isAdmin) {
                try {
                    const verifyResponse = await fetchWithRetry(`${API_BASE_URL}/api/auth/verify-admin-code`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ userId: data.userId, code: adminCode })
                    });
                    const verifyData = await verifyResponse.json();
                    if (verifyData.success) {
                        localStorage.setItem('token', verifyData.token); // Обновляем токен с новой ролью
                        localStorage.setItem('role', verifyData.role);
                        window.location.href = 'adminCabinet.html';
                    } else {
                        errorDiv.textContent = verifyData.message || 'Неверный код администратора';
                        button.disabled = false;
                        button.textContent = originalText;
                        return;
                    }
                } catch (err) {
                    console.error('Ошибка проверки кода:', err);
                    errorDiv.textContent = 'Ошибка проверки кода: ' + err.message;
                    button.disabled = false;
                    button.textContent = originalText;
                    return;
                }
            } else {
                window.location.href = 'kabinet.html';
            }
        } else {
            errorDiv.textContent = data.message || 'Неверный email или пароль';
        }
    } catch (err) {
        console.error('Ошибка входа:', err.message, err.stack, 'Type:', err.name);
        errorDiv.textContent = err.message.includes('Failed to fetch')
            ? `Ошибка сети (вход): ${err.message} (${err.name}). Проверьте настройки браузера.`
            : `Ошибка входа: ${err.message}`;
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});