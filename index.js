function createModel() {
    const model = tf.sequential();
    
    //Conv 1
    model.add(tf.layers.conv2d({
        inputShape: [IMAGE_SIZE, IMAGE_SIZE, FEATURE_PLANES],
        kernelSize: 5,
        filters: FILTERS,
        strides: 1,
        padding: 'same',
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));
    
    //Conv 2
    model.add(tf.layers.conv2d({
        kernelSize: 5,
        filters: FILTERS,
        strides: 1,
        padding: 'same',
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));
    
    //Conv 3
    model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: FILTERS,
        strides: 1,
        padding: 'same',
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));

    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2], padding: 'same'}));
    model.add(tf.layers.flatten());

    //Fully connected 1
    model.add(tf.layers.dense(
        { units: HIDDEN, kernelInitializer: 'varianceScaling', activation: 'relu' }));

    //Fully connected 2
    model.add(tf.layers.dense(
        { units: LABEL_SIZE, kernelInitializer: 'varianceScaling', activation: 'softmax' }));


    return model;
}

var model = tf.tidy(() => createModel());

async function saveModel() {
    const saveResult = await model.save('downloads://' + document.getElementById("save_model_name").value);
    document.getElementById("savedModel").innerText = "Saved model (" +  (new Date()) + ")"
}

async function loadModel() {
    const jsonUpload = document.getElementById('json-upload');
    const weightsUpload = document.getElementById('weights-upload');

    model = await tf.loadModel(tf.io.browserFiles([jsonUpload.files[0], weightsUpload.files[0]]));
}


const optimizer = tf.train.sgd(LEARNING_RATE);
model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
});

var train_data, xs, ys;
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




async function train(){
    let {train_data, valid_data} = await load_train_data();
    if (!isNaN(ui.get_examples()) && ui.get_examples() > 0) {
        train_data = train_data.slice(0,ui.get_examples());
    }
    if (!isNaN(ui.get_validation_examples()) && ui.get_validation_examples() > 0) {
        valid_data = valid_data.slice(0, ui.get_validation_examples());
    }
    document.getElementById("train_status").innerText = "Training"
    let data = reformat(train_data, labels);
    let xs = tf.tensor4d(data.xs, [data.count, 8, 8, 8]);
    let ys = tf.tensor2d(data.ys, [data.count, LABEL_SIZE]);

    let v_data = reformat(valid_data, labels);
    let v_xs = tf.tensor4d(v_data.xs, [v_data.count, 8, 8, 8]);
    let v_ys = tf.tensor2d(v_data.ys, [v_data.count, LABEL_SIZE]);
    let validationData = [v_xs, v_ys];
    
    console.log(`Training with ${data.count} examples.`)
    
    var ts = new Date();
    var trainBatchCount = 0;
    var epochCount = 0;
    train_status = 1
    
    async function nextFrame(){
        if (train_status == 1) {
            await tf.nextFrame();
        } else {
            await endPause()
        }
    }

    await model.fit(xs, ys, {
        batchSize: ui.get_batch_size(),
        epochs: ui.get_epochs(),
        validationData,
        callbacks:{
            onBatchEnd: async (batch, logs) => {
                trainBatchCount++;
                logTrainData(logs, trainBatchCount);
                nextFrame();
            },
            onEpochEnd: async (epoch, logs) => {
                epochCount++;
                trainBatchCount++;
                trainLog(`------- EPOCH:    ${("     " + epochCount).substr(-5)}  ------- `);
                logTrainData(logs, trainBatchCount);
                nextFrame();
            }
        }
    });
    train_status = 3;
    document.getElementById("train_status").innerText = "Finished"

    console.log(`Done: ${new Date() - ts}ms`)

    return model;
}
