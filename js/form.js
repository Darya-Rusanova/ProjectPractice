(function() {
    window.addEventListener('load', init);                  
    let tmp = document.querySelector("html");
    function init() {
        document.getElementById("count").addEventListener("click", calculateTheGramming);
    }
    function calculateTheGramming() {
        let portion = document.getElementById("portion").value;
        if (portion > 0){
            document.getElementById("file").innerHTML = 125 * portion;
            document.getElementById("paper").innerHTML = 50 * portion;
            document.getElementById("carrot").innerHTML = 25 * portion;
            document.getElementById("tomato").innerHTML = 25 * portion;
            document.getElementById("sugar").innerHTML = 0.25 * portion;
            document.getElementById("krahmal").innerHTML = 0.25 * portion;
            document.getElementById("souse").innerHTML = 0.75 * portion;
            document.getElementById("butter").innerHTML = 0.75 * portion;
            document.getElementById("paprika").innerHTML = 0.25 * portion;
            document.getElementById("sault").innerHTML = "По вкусу";
            document.getElementById("blackPaper").innerHTML = "По вкусу";
        }
        else {
            return;
        } 
    }

})();