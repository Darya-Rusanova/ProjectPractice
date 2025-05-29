const API_BASE_URL = 'https://chudobludo-backend.onrender.com';

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