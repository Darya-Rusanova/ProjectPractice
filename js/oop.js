(function() {
    window.addEventListener('load', init);                  
    function init() {
        //document.getElementById("start1").addEventListener("click", createTable1);
        ru_food = [
            {day: 31, month: 1, title: "День рождения русской водки"}, 
            {day: 25, month: 4, title: "День мастера пряничного дела в России"}, 
            {day: 3, month: 5, title: "День кондитера в России"}, 
            {day: 18, month: 5, title: "День калмыцкого чая"},
            {day: 30, month: 5, title: "День окрошки"},
            {day: 2, month: 6, title: "День здорового питания и отказа от излишеств в еде"},
            {day: 8, month: 6, title: "День пивовара в России"},
            {day: 19, month: 7, title: "День пирожков с малиновым вареньем"},
            {day: 11, month: 8, title: "День белого гриба"},
            {day: 16, month: 8, title: "День малинового варенья"},
            {day: 21, month: 9, title: "День сока в России"},
            {day: 20, month: 10, title: "День работников пищевой промышленности России"},
            {day: 31, month: 10, title: "Тыквенный спас"},
        ]
        c1 = new Calendar(document.getElementById("cal"), 6, 2024, ru_food);
        createTable1();
    }
    
    let isClick1 = true;
    
    function showForward1() {
        c1.next();
        switch(c1.getMonth()) {
            case 1: 
                document.getElementById("m1").innerText = "Январь " + String(c1.getYear());
                break;
            case 2: 
                document.getElementById("m1").innerText = "Февраль " + String(c1.getYear());
                break;    
            case 3: 
                document.getElementById("m1").innerText = "Март " + String(c1.getYear());
                break;
            case 4: 
                document.getElementById("m1").innerText = "Апрель " + String(c1.getYear());
                break;  
            case 5: 
                document.getElementById("m1").innerText = "Май " + String(c1.getYear());
                break;
            case 6: 
                document.getElementById("m1").innerText = "Июнь " + String(c1.getYear());
                break;    
            case 7: 
                document.getElementById("m1").innerText = "Июль " + String(c1.getYear());
                break;
            case 8: 
                document.getElementById("m1").innerText = "Август " + String(c1.getYear());
                break;    
            case 9: 
                document.getElementById("m1").innerText = "Сентябрь " + String(c1.getYear());
                break;
            case 10: 
                document.getElementById("m1").innerText = "Октябрь " + String(c1.getYear());
                break;  
            case 11: 
                document.getElementById("m1").innerText = "Ноябрь " + String(c1.getYear());
                break;
            case 12: 
                document.getElementById("m1").innerText = "Декабрь " + String(c1.getYear());
                break;       
        }
        
    }
    function showPrevious1() {
        c1.prev();
        switch(c1.getMonth()) {
            case 1: 
                document.getElementById("m1").innerText = "Январь " + String(c1.getYear());
                break;
            case 2: 
                document.getElementById("m1").innerText = "Февраль " + String(c1.getYear());
                break;    
            case 3: 
                document.getElementById("m1").innerText = "Март " + String(c1.getYear());
                break;
            case 4: 
                document.getElementById("m1").innerText = "Апрель " + String(c1.getYear());
                break;  
            case 5: 
                document.getElementById("m1").innerText = "Май " + String(c1.getYear());
                break;
            case 6: 
                document.getElementById("m1").innerText = "Июнь " + String(c1.getYear());
                break;    
            case 7: 
                document.getElementById("m1").innerText = "Июль " + String(c1.getYear());
                break;
            case 8: 
                document.getElementById("m1").innerText = "Август " + String(c1.getYear());
                break;    
            case 9: 
                document.getElementById("m1").innerText = "Сентябрь " + String(c1.getYear());
                break;
            case 10: 
                document.getElementById("m1").innerText = "Октябрь " + String(c1.getYear());
                break;  
            case 11: 
                document.getElementById("m1").innerText = "Ноябрь " + String(c1.getYear());
                break;
            case 12: 
                document.getElementById("m1").innerText = "Декабрь " + String(c1.getYear());
                break;       
        }
        
    }

    function createTable1() {   
        if (isClick1){
            isClick1 = false;
            c1.showTable();
            switch(c1.getMonth()) {
                case 1: 
                    document.getElementById("m1").innerText = "Январь " + String(c1.getYear());
                    break;
                case 2: 
                    document.getElementById("m1").innerText = "Февраль " + String(c1.getYear());
                    break;    
                case 3: 
                    document.getElementById("m1").innerText = "Март " + String(c1.getYear());
                    break;
                case 4: 
                    document.getElementById("m1").innerText = "Апрель " + String(c1.getYear());
                    break;  
                case 5: 
                    document.getElementById("m1").innerText = "Май " + String(c1.getYear());
                    break;
                case 6: 
                    document.getElementById("m1").innerText = "Июнь " + String(c1.getYear());
                    break;    
                case 7: 
                    document.getElementById("m1").innerText = "Июль " + String(c1.getYear());
                    break;
                case 8: 
                    document.getElementById("m1").innerText = "Август " + String(c1.getYear());
                    break;    
                case 9: 
                    document.getElementById("m1").innerText = "Сентябрь " + String(c1.getYear());
                    break;
                case 10: 
                    document.getElementById("m1").innerText = "Октябрь " + String(c1.getYear());
                    break;  
                case 11: 
                    document.getElementById("m1").innerText = "Ноябрь " + String(c1.getYear());
                    break;
                case 12: 
                    document.getElementById("m1").innerText = "Декабрь " + String(c1.getYear());
                    break;       
            }
            let btn1 = document.createElement("button");
            btn1.id = "forward1";
            btn1.textContent = "Вперед";
            let btn2 = document.createElement("button");
            btn2.id = "back1";
            btn2.textContent = "Назад";
            document.getElementById("buttons1").appendChild(btn2);
            document.getElementById("buttons1").appendChild(btn1);

            document.getElementById("forward1").addEventListener("click", showForward1);
            document.getElementById("back1").addEventListener("click", showPrevious1); 
        }
    }
    
    class Calendar{
        constructor(parentElement, month, year, holidays) {
            this.parentElement = parentElement;
            this.month = month;
            this.year = year;
            this.holidays = holidays;
        }
        getParentElement() {
            return this.parentElement;
        }
        getMonth() {
            return this.month;
        }
        getYear() {
            return this.year;
        }
        
        next(){
            document.getElementById(String(this.holidays.length) + String(this.year) + String(this.month)).outerHTML = "";
            document.getElementById("nameDay").innerHTML = "";
            this.month++;
            if (this.month > 12) {
                this.year++;
                this.month = 1;
            }
            this.showTable()
        }
        prev() {
            document.getElementById(String(this.holidays.length) + String(this.year) + String(this.month)).outerHTML = "";
            document.getElementById("nameDay").innerHTML = "";
            this.month--;
            if (this.month < 1) {
                this.year--;
                this.month = 12;
            }
            this.showTable();
        }
        
        showTable() {
            let monthYear;
            switch(this.month) {
                case 1: 
                    monthYear = "Январь " + String(c1.getYear());
                    break;
                case 2: 
                    monthYear = "Февраль " + String(c1.getYear());
                    break;    
                case 3: 
                    monthYear = "Март " + String(c1.getYear());
                    break;
                case 4: 
                    monthYear = "Апрель " + String(c1.getYear());
                    break;  
                case 5: 
                    monthYear = "Май " + String(c1.getYear());
                    break;
                case 6: 
                    monthYear = "Июнь " + String(c1.getYear());
                    break;    
                case 7: 
                    monthYear = "Июль " + String(c1.getYear());
                    break;
                case 8: 
                    monthYear = "Август " + String(c1.getYear());
                    break;    
                case 9: 
                    monthYear = "Сентябрь " + String(c1.getYear());
                    break;
                case 10: 
                    monthYear = "Октябрь " + String(c1.getYear());
                    break;  
                case 11: 
                    monthYear = "Ноябрь " + String(c1.getYear());
                    break;
                case 12: 
                    monthYear = "Декабрь " + String(c1.getYear());
                    break;       
            }
            let neededDays = [];
            let nameDay = [];
            for(let k = 0; k < this.holidays.length; k++) {
                if (this.holidays[k].month == this.month) {
                    neededDays.push(this.holidays[k].day);
                    nameDay.push(this.holidays[k].title);
                }
            }
            let date = new Date(this.year,this.month - 1, 1);
            let weekDay = date.getDay();
            let isNextMonth = false;
            let table = document.createElement("table");  
            table.id = String(this.holidays.length) + String(this.year) + String(this.month);
        
            let thead = document.createElement("thead"); 
            let tr = document.createElement("tr");
            let week = ["ВС","ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
            for (let i = 0; i < week.length; i++) {
              let th = document.createElement("th"); 
              let newText = document.createTextNode(week[i]);
              th.appendChild(newText);
              tr.appendChild(th);
            }
            thead.appendChild(tr);
            table.appendChild(thead);
            
            let tbody = document.createElement("tbody"); 
            for(let i = 0; i < 6; i++) {
                let tr = document.createElement("tr");
                let j;
                if (i == 0) {
                    for(j = 0; j < weekDay; j++) {
                        let td = document.createElement("td");
                        let newText = document.createTextNode("");
                        td.appendChild(newText);
                        tr.appendChild(td);
                    }
                    j = weekDay;
                }
                else {
                    j = 0;
                }
                for(j; j <= 6; j++) {
                    let td = document.createElement("td");
                    if (j == 0 || j == 6) {
                        td.className = "weekend";
                    }
                    for(let k = 0; k < neededDays.length; k++){
                        if (neededDays[k] == date.getDate()){
                            td.className = "specialDay";
                            let div = document.createElement('div');
                            let p = document.createElement('p');
                            p.innerText = neededDays[k] + " " + monthYear + " " + nameDay[k];
                            div.appendChild(p);
                            document.getElementById("nameDay").appendChild(div);
                        }
                    }

                    let newText = document.createTextNode(date.getDate());
                    td.appendChild(newText);
                    tr.appendChild(td);
                    date.setDate(date.getDate() + 1);
                    if (date.getMonth() + 1 != this.month) {
                        isNextMonth = true;
                        break;
                    }
                }
                tbody.appendChild(tr);
                if (isNextMonth) {
                    break;
                }
            }
            table.appendChild(tbody);
            this.parentElement.appendChild(table);
        }  
    }

  })();