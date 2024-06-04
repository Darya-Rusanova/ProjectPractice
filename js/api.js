(function() {
    const URL = "http://numbersapi.com/";
  
    window.addEventListener("load", init);

    function init() {
      document.getElementById("showFacts").addEventListener("click", function(){
        showDogs();
        showFact();
      });
    }

    function showDogs() {
      let url = "https://dog.ceo/api/breeds/image/random";     
      fetch(url)
        .then(checkStatus)
        .then(resp => resp.json()) 
        .then(showResult)
        .catch(console.error);
    }
    function showFact(){
      fetch("../json/dogsFact.json")
        .then(checkStatus)
        .then(resp => resp.json())
        .then(showRes)
        .catch(console.error);
    }
    function showRes(response){
      let num = Math.floor (Math.random () * (response.length));
      document.getElementById("titleFact").innerText = response[num]["title-fact"];
      document.getElementById("fact").innerText = response[num]["fact"];
    }
    
    function showResult(response) {
      let div = document.getElementById("output");
      div.innerHTML = "";
      let img = document.createElement("img");
      img.id = "img";
      img.alt = "dogs"
      img.src = response["message"];
      img.style.width = "350px";
      img.style.height = "350px";
      div.appendChild(img);
    }
    function checkStatus(response) {
      if (!response.ok) {
        throw Error("Ошибка запроса: " + response.statusText);
      }
      return response; 
    }
  
  })();