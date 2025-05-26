(function() {
    window.addEventListener('load', init);                  
    let tmp = document.querySelector("html");
    function init() {
        let check = document.getElementById("theme-toggle");
        check.addEventListener('change', function() {  
            if (this.checked) {  
                setDarkTheme(); 
            } else {  
                setLightTheme();
            }  
        });  
        if(window.localStorage) {
            if (localStorage.getItem('data-theme') == "dark") {
                tmp.setAttribute("data-theme","dark");
                check.checked = true;
            }
            else if (localStorage.getItem('data-theme') == "light") {
                tmp.setAttribute("data-theme","light");
            }
        }
      
    }
    
    function setDarkTheme() {
        if(window.localStorage) {
            tmp.setAttribute("data-theme","dark");
            localStorage.setItem('data-theme', 'dark');
        }
        
    }
    function setLightTheme() {
        if(window.localStorage) {
            tmp.setAttribute("data-theme", "light");
            localStorage.setItem('data-theme', 'light');
        }
    }
})();