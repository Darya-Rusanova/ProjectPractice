
(function() {
    window.addEventListener('load', init);                  
    function init() {
        document.getElementById("formButton").addEventListener("click", addComment);
    }
    function addComment() {
        let d = new Date();
        console.log(d);
        let name = document.getElementById("user").value;
        let comment = document.getElementById("comment").value;
        if (comment != ""){
            let div = document.createElement("div");
            div.className = "addComm";  
            let userName = document.createElement('p');
            if (name == ""){
                userName.innerText = "Аноним"
            }
            else {
                userName.innerText = name;
            }       
            userName.className = "userName";
            div.appendChild(userName);
            let date = document.createElement('p');
            date.innerText = d.getDate() + "." + d.getMonth() + "." + d.getFullYear();
            date.className = "date";
            div.appendChild(date);
            let commText = document.createElement('p');
            commText.innerText = comment;
            commText.className = "commText";
            div.appendChild(commText);
            document.getElementById("elements").appendChild(div);
        }
    }

})();