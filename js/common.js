// Обработчик для ссылки "Личный кабинет"
const lkLink = document.getElementById('lk');
if (lkLink) {
    lkLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Клик по ссылке "Личный кабинет"');
        window.location.href = lkLink.querySelector('a.text-toggle').href || 'signIn.html';
    });
}