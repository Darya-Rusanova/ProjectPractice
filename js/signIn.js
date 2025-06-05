console.log('signIn.js starting', 'User-Agent:', navigator.userAgent);

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
        console.log('checkLogin status:', response.status, 'CORS:', response.headers.get('Access-Control-Allow-Origin'));
        if (response.ok) {
            window.location.href = localStorage.getItem('isAdmin') === 'true' ? '/adminCabinet.html' : '/kabinet.html';
        } else {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }
    } catch (err) {
        console.error('Ошибка проверки токена:', err.message, err.stack, 'Type:', err.name);
        showNotification(
            err.message.includes('Failed to fetch')
                ? `Ошибка сети (токен): ${err.message} (${err.name})`
                : `Сессия истекла: ${err.message}`,
            'error'
        );
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
    const adminCode = document.getElementById('adminCode')?.value || ''; // Чтение кода админа
    console.log('Email:', email, 'AdminCode:', adminCode);

    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; ChudoBludo/1.0)'
            },
            body: JSON.stringify({ email, password, code: adminCode }),
            mode: 'cors',
            credentials: 'include'
        });
        console.log('Login status:', response.status, 'CORS:', response.headers.get('Access-Control-Allow-Origin'));
        const data = await response.json();
        console.log('Login data from server:', data);

        if (data.token) {
            localStorage.setItem('token', data.token.trim());
            localStorage.setItem('userId', data.userId);

            // Логика определения isAdmin: используем значение из data.isAdmin
            console.log('Setting isAdmin:', data.isAdmin, 'Code provided:', !!adminCode);
            localStorage.setItem('isAdmin', data.isAdmin.toString());

            try {
                const userResp = await fetchWithRetry(
                    `${API_BASE_URL}/api/users/${data.userId}`,
                    { headers: { 'Authorization': `Bearer ${data.token}` } }
                );
                if (userResp.ok) {
                    const userData = await userResp.json();
                    if (userData.username) {
                        localStorage.setItem('username', userData.username);
                    }
                    if (userData.email) {
                        localStorage.setItem('email', userData.email);
                    }
                    if (typeof userData.recipeCount === 'number') {
                        localStorage.setItem('recipeCount', userData.recipeCount.toString());
                    }
                    if (typeof userData.favoritesCount === 'number') {
                        localStorage.setItem('favoritesCount', userData.favoritesCount.toString());
                    }
                } else {
                    console.warn('Не удалось получить username после логина, статус', userResp.status);
                }
            } catch (e) {
                console.warn('Ошибка при запросе имени пользователя после логина:', e);
            }

            showNotification('Успешный вход!', 'success');
            setTimeout(() => {
                window.location.href = data.isAdmin ? '/adminCabinet.html' : '/kabinet.html';
            }, 300);
        } else {
            showNotification(data.message || 'Неверный email или пароль', 'error');
        }
    } catch (err) {
        console.error('Ошибка входа:', err.message, err.stack, 'Type:', err.name);
        showNotification(
            err.message.includes('Failed to fetch')
                ? `Ошибка сети (вход): ${err.message} (${err.name}). Проверьте настройки браузера.`
                : `Ошибка входа: ${err.message}`,
            'error'
        );
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});