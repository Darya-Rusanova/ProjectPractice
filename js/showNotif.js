function showNotification(message, type = 'error') {
    const notification = document.getElementById('error');

    notification.classList.remove('show', 'hide');
    void notification.offsetWidth;

    notification.textContent = message;
    notification.className = `error-notification ${type}`;

    setTimeout(() => {
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        setTimeout(() => {
          notification.classList.remove('hide');
        }, 500);
      }, 2000);
    }, 50);
  }
