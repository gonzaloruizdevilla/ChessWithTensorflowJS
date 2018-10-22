let trainBatch = 0;
var model = tf.tidy(() => createModel());

compile(model)

async function saveModel() {
    saveModelByName(document.getElementById("save_model_name").value);
}

async function loadModel() {
    let modelName = document.getElementById("save_model_name").value;
    model = await loadModelByName(modelName);
}


//train_status
//0: init
//1: training
//2: paused
//3: finished
var train_status = 0;
var resolveEndPause;

function continueTraining(){
    document.getElementById("train_status").innerText = "Training"
    if (resolveEndPause) resolveEndPause();
    train_status = 1;
}
function pauseTraining(){
    train_status = 2;
    document.getElementById("train_status").innerText = "Paused"
}
function endPause(){
    return new Promise((resolve, reject) => {
        resolveEndPause = resolve;
    })
}
    
async function nextFrame(){
    if (train_status == 1) {
        await tf.nextFrame();
    } else {
        await endPause();
    }
}

var data = new ChessData({ logFn:trainLog, labels})


async function train() {
    trainModel(model, data);
}


async function predict() {
    
    let board = document.getElementById("boardToPredict").value;
    
    let prediction = predictBoard(model, board);
    let data = await prediction.data();
    let validMoves = ["Rfd8","Nd3","Rad8","Rxd4","Rd1","Nxe4","Kg1","Qc6","Qf4","Qb7","Qxf7+","Kh8","Qe8+","Qf7+","Kh6","Ng4+","Kg5","h4+","Kh5","Qxh7#","Bb2","Nxe5","Ke7","Nd2","Ndf3","Ng6+","Nxh8"];
    data = data.map((v,idx) => validMoves.indexOf(labels[idx])==-1?0:v);
    let moveIdx = (await tf.argMax(data).data())
    
    document.getElementById("prediction").innerText = labels[moveIdx];
    
}