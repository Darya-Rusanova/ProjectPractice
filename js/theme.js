(function() {
    window.addEventListener('load', init);
    
    function init() {
        const html = document.documentElement;
        const themeToggle = document.getElementById("theme-toggle");

        themeToggle.addEventListener('click', function() {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('data-theme', newTheme);
        });
        
        // Проверяем сохранённую тему при загрузке
        if (localStorage.getItem('data-theme') === 'dark') {
            html.setAttribute('data-theme', 'dark');
        }else{
            html.setAttribute('data-theme','light')
        }
    }
})();