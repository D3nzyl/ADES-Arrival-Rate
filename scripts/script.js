/* Global id variables */ 
var id = 0;
var idRecord = [];

/* Colour functions */
function color(x){
    var colorArr = ['blue','red','yellow','green'];
    const expectedIndex = x % colorArr.length;
    return colorArr[expectedIndex];
};

function colorHex(x){
    var colorArr = ['#176BEF','#FF3E30','#F7B529','#179C52'];
    const expectedIndex = x % colorArr.length;
    return colorArr[expectedIndex];
};

/* Creating a new box for queue */ 
function addQueue() {
    $(`
    <div class="col-sm-12 col-lg-6" id="add-container`+id+`">
        <div class="addBox ${color(id)}">
        <div class='close' onclick="removeElement(${id})"> <span aria-hidden="true">&times;</span></div>
        <div class="search-container">
            <form onsubmit="getQueueId(${id})" method="get" class="companyId">
                <div class="form-group">
                    <label for="companyId">Company ID:</label>
                    <input type="text" id="companyId${id}" name="companyId" pattern="[1-9]{1}[0-9]{9}" required value='1234567890'>
                    <input class="submit "type="submit" value="Submit">
                </div>
            </form>
        
        </div>
        <div class="queue-container">
            <form action="get arrivalrate" method="get">
                <div class="form-group">
                    <label for="queueId">Queue ID:</label>
                    <select onchange="createGraph(${id})" class="queueId" id="queueId${id}">
                    </select>
                    <input type="checkbox" id="inActiveQueue${id}" name="inActiveQueue" value="inActiveValue" onchange="hideQueue(${id})">
                    <label for="inActiveQueue">Hide inactive queue</label>
                </div>
            </form>
        </div>
        <div id="loading${id}" class="loading"></div>
        <div id="graph${id}" class="graph"></div>
        <div id="graphStatus${id}" class="graphstatus">Graph is working</div>
        </div>
    </div>
    `).insertBefore("#create-container");
    idRecord.push({id:id,graph:false});
    id = id + 1;
};

/* Removing queue box */
function removeElement(id) {
    var x = document.getElementById('add-container'+id)
    x.remove()
    for (let i = 0; i < idRecord.length; i++){
        if (idRecord[i].id==id){
            idRecord.splice(i,1);
            break;
        };
    };
};

/* Getting queue_id function */
function getQueueId(id) {
    event.preventDefault();
    displayLoading(id);
    var companyId = document.getElementById("companyId"+id).value;
    var checkbox = document.getElementById("inActiveQueue"+id);
    fetch(`https://ades-hosting-denzyl.herokuapp.com/company/queue?company_id=`+companyId)
        .then(response => {
            return response.json();
        })
        .then(response => {
            if(response.length == 0){
                throw "CompanyId does not exists";
            }
            return response;
        })
        .then(response => {
            var queueIdList = [];
            for (let i = 0; i < response.length; i++) {
                queueIdList.push(response[i].queue_id);
            };
            var toChange = '<option value="null">Please Pick A Queue ID</option>';
            for (i = 0; i < queueIdList.length; i++) {
                if (response[i].is_active == 0){
                    toChange += '<option class="hideQueue" value="' + queueIdList[i] + '">' + queueIdList[i]+" [X]" + '</option>';
                }
                else{
                    toChange += '<option value="' + queueIdList[i] + '">' + queueIdList[i] + '</option>';
                };
            };
            checkbox.checked = true;
            hideQueue(id)
            $('#queueId' + id).empty();
            $('#queueId' + id).append($(toChange));
            hideLoading(id);
        })
        .catch(error => {
            hideLoading(id);
            alert(error);
        });
};

/* Loading animation after selecting queue_id */
function displayLoading(id) {
    var loader = document.getElementById("loading"+id);
    loader.classList.add("display");
};

function hideLoading(id) {
    var loader = document.getElementById("loading"+id);
    loader.classList.remove("display");
};

/* Hide inactive queue checkbox function */
function hideQueue(id) {
    var queueList = document.getElementById("queueId"+id);
    if(queueList.classList.contains('inActiveQueue')){
        queueList.classList.remove("inActiveQueue");
    }
    else{
        queueList.classList.add("inActiveQueue");
    };
};

/* Creating graph function */
function createGraph(id) {
    var queueOption = document.getElementById("queueId" + id).value;
    var graphstatus = document.getElementById("graphStatus"+id);
    if (document.getElementById("queueId"+id).value != "null"){
        fetch(`https://ades-hosting-denzyl.herokuapp.com/company/arrival_rate?queue_id=`+queueOption+`&from=`+encodeURIComponent(dayjs().subtract(3,'minute').format())+`&duration=3`)
        .then(response => {
            return response.json();
        })
        .then(response => {
            var timeArr = [];
            for (i = 0; i< response.length; i++) {
                let date = new Date(response[i].timestamp * 1000);
                let formattedDate = date.getHours().toString()+":"+date.getMinutes().toString()+":"+date.getSeconds().toString()+"-"+date.getDate().toString()+'/'+(date.getMonth()+1).toString()+'/'+date.getFullYear().toString();
                timeArr.push([formattedDate,parseInt(response[i].count)]);
            };
            drawChart(timeArr,id,queueOption);
            graphstatus.classList.add("display");
            graphstatus.innerHTML = "Graph is working";
            for(let i=0;i<idRecord.length;i++) {
                if (idRecord[i].id == id) {
                    idRecord[i].graph = true;
                };
            };
        })
        .catch(error => {
            graphstatus.innerHTML = "Graph is not working";
        });
    }
    else {
        document.getElementById("graph"+id).innerHTML = "";
        graphstatus.classList.remove("display")
    };
};


// Load the Visualization API and the corechart package.
google.charts.load('current', {'packages':['corechart']});

function drawChart(graphData,id,queue_id) {

    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Time');
    data.addColumn('number', 'Count');
    data.addRows(graphData);
    // Set chart options
    var options = {'title':'Arrival Rate For '+queue_id,
                   'colors':[colorHex(id)]};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.LineChart(document.getElementById("graph"+id));
    chart.draw(data, options);
  };

/* Refreshing the graphs every 3 secs*/
setInterval(function() {
    for(let i=0; i<idRecord.length; i++){
        if(idRecord[i].graph) {
            createGraph(idRecord[i].id);
        };
    };
},3000);

window.onresize = function(){
    for(let i=0; i<idRecord.length; i++){
        if(idRecord[i].graph) {
            createGraph(idRecord[i].id);
        };
    };
}
