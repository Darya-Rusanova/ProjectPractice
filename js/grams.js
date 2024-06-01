(function() {
    window.addEventListener('load', init);                  
    let tmp = document.querySelector("html");
    function init() {
        document.getElementById("count").addEventListener("click", calculateTheGramming);
    }
    function calculateTheGramming() {
        let portion = document.getElementById("portion").value;
        if (portion > 0){
            document.getElementById("flour").innerHTML = 0.5 * portion;
            document.getElementById("egg").innerHTML = 1 * portion;
            document.getElementById("milk").innerHTML = 0.25 * portion;
            document.getElementById("vanil").innerHTML = 0.25 * portion;
            document.getElementById("sugar").innerHTML = 0.75 * portion;
            document.getElementById("powder").innerHTML = 0.25 * portion;
            document.getElementById("juice").innerHTML = 0.75 * portion;
            document.getElementById("butter").innerHTML = 40 * portion;
        }
        else {
            return;
        } 
    }
})();