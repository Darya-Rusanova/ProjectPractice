const API_BASE_URL = 'https://chudobludo-backend.onrender.com';

// Функция для выполнения запроса с повторными попытками
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Попытка ${i + 1} для ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            console.log(`Статус ответа для ${url}: ${response.status}`);
            return response;
        } catch (err) {
            console.error(`Попытка ${i + 1} для ${url} не удалась:`, err.message, err.stack);
            if (err.name === 'AbortError') {
                err.message = 'Запрос прерван: сервер не ответил за 60 секунд';
            }
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Обработчик для ссылки "Личный кабинет"
const lkLink = document.getElementById('lk');
if (lkLink) {
    lkLink.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Клик по ссылке "Личный кабинет"');
        
        const token = localStorage.getItem('token') || '';
        const userId = localStorage.getItem('userId') || '';

        if (!token || !userId) {
            console.log('Токен отсутствует, перенаправляем на вход');
            window.location.href = 'signIn.html';
            return;
        }

        try {
            const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                console.log('Токен валиден, перенаправляем в кабинет');
                window.location.href = 'kabinet.html';
            } else {
                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
            }
        } catch (err) {
            console.error('Проверка токена не удалась:', err.message, err.stack);
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = 'signIn.html';
        }
    });
}