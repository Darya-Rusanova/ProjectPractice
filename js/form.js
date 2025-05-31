(function() {
    window.addEventListener('load', init);                  
    function init() {   
        let product = ["Куриное филе (г.)", "Болгарский перец (г.)", "Морковь (г.)", "Кетчуп/томатная паста (г.)", "Сахар (ст. ложки)","Крахмал (ст. ложки)","Соевый соус (ст. ложки)", "Растительное масло (ст. ложки)","Паприка (ч. ложки)", "Соль", "Перец черный молотый"]
        let grams = [125,50,25,25,0.25,0.25,0.75,0.75,0.25,0,0];
        let portion = 1;
        generateField(product);
        document.getElementById("count").addEventListener("click", function() {
            countGrams(grams, portion);
        });
    }
   
    function generateField(products){
        let parent = document.getElementById('grams');
        products.forEach(product => {
            let div = document.createElement('div');
            div.className ='menu';
            let pName = document.createElement('p');
            pName.innerText = product ;
            pName.className = 'pName';
            div.appendChild(pName);
            parent.appendChild(div);
        });  
    }
    function countGrams(grams, portion){
        let userPortion = parseInt(document.getElementById("portion").value) || portion;
        let divs = document.getElementsByClassName('menu');
        
        grams.forEach((gram, i) => {
            if(i >= divs.length) return;
            
            let result;
            if(gram === 0) {
                result = "по вкусу";
            } else {
                result = (gram / portion * userPortion).toFixed(1);
                if(result.endsWith('.0')) result = result.split('.')[0]; 
            }
            
            if(divs[i].children.length < 2) {
                let pGram = document.createElement('p');
                pGram.className = 'pGram';
                pGram.innerText = result;
                divs[i].appendChild(pGram);
            } else {
                divs[i].children[1].innerText = result;
            }
        });
    }

})();