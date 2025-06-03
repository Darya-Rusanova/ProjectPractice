async function deleteRecipe(recipeId, fetchFunction) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Ошибка: Нет токена авторизации', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        showNotification('Рецепт удалён!', 'success');
        fetchFunction(); // Обновляем список рецептов
    } catch (err) {
        showNotification(`Ошибка удаления: ${err.message}`, 'error');
    }
}