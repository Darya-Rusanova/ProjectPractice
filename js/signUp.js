const errorDiv = document.getElementById('error');
const registerForm = document.getElementById('register-form');

// Проверка доступности элементов
console.log('registerForm:', registerForm);

// Проверка токена при загрузке
async function checkToken() {
    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '';
    if (!token || !userId) {
        console.log('Токен отсутствует, остаемся на странице регистрации');
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
        // errorDiv.textContent = err.message.includes('Failed to fetch') || err.name === 'AbortError'
        //     ? 'Не удалось проверить сессию. Сервер недоступен, попробуйте позже.'
        //     : 'Сессия истекла: ' + err.message;
        showNotification(
            err.message.includes('Failed to fetch') || err.name === 'AbortError'
                ? 'Не удалось проверить сессию. Сервер недоступен, попробуйте позже.'
                : 'Сессия истекла: ' + err.message,
            'error'
        );
    }
}

checkToken();

// Обработчик регистрации
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Форма регистрации отправлена');
    const button = registerForm.querySelector('button');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Загрузка...';
    const username = document.getElementById('username').value;
    const email = document.getElementById('email-register').value;
    const password = document.getElementById('password-register').value;
    try {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        console.log('Данные ответа на регистрацию:', data);
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);


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
                } else {
                    console.warn('Не удалось получить username после логина, статус', userResp.status);
                }
            } catch (e) {
                console.warn('Ошибка при запросе имени пользователя после логина:', e);
            }



            // errorDiv.textContent = '';
            showNotification('Регистрация успешна!', 'success');
            // window.location.href = 'kabinet.html';

            // Немного подождём, чтобы пользователь увидел «Регистрация успешна!»
            setTimeout(() => {
                window.location.href = 'kabinet.html';
            }, 300);
        } else {
            // errorDiv.textContent = data.message || 'Ошибка регистрации';
            showNotification(data.message || 'Ошибка регистрации', 'error');
        }
    } catch (err) {
        console.error('Ошибка регистрации:', err.message, err.stack);
        // errorDiv.textContent = err.message.includes('Failed to fetch') || err.name === 'AbortError'
        //     ? 'Не удалось подключиться к серверу. Проверьте соединение или попробуйте позже.'
        //     : 'Ошибка регистрации: ' + err.message;
        let errorMessage = err.message.includes('Failed to fetch') || err.name === 'AbortError'
            ? 'Не удалось подключиться к серверу. Проверьте соединение или попробуйте позже.'
            : 'Ошибка регистрации: ' + err.message;
        if (err.message.includes('CORS')) {
            // errorDiv.textContent += ' Возможна проблема с CORS. Проверьте настройки сервера.';
            errorMessage += ' Возможна проблема с CORS. Проверьте настройки сервера.';
        }
        showNotification(errorMessage, 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
});