window.API_BASE_URL = 'https://chudobludo-backend.onrender.com';

async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Попытка ${i + 1} для ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 секунд
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            console.log(`Статус ответа для ${url}: ${response.status}`);
            return response;
        } catch (err) {
            console.error(`Попытка ${i + 1} для ${url} не удалась:`, err.message, err.stack, 'Type:', err.name);
            if (err.name === 'AbortError') {
                err.message = `Таймаут: сервер не ответил за 20 секунд`;
            }
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}