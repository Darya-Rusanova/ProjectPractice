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
            window.location.href = '../signIn.html';
            return;
        }

        try {
            const response = await fetchWithRetry(`${API_BASE_URL}/api/users/${userId}/recipes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                console.log('Токен валиден, перенаправляем в кабинет');
                window.location.href = '../kabinet.html';
            } else {
                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
            }
        } catch (err) {
            console.error('Проверка токена не удалась:', err.message, err.stack);
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = '../signIn.html';
        }
    });
}