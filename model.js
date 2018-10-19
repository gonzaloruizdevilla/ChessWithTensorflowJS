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

    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2], padding: 'same' }));
    model.add(tf.layers.flatten());

    //Fully connected 1
    model.add(tf.layers.dense(
        { units: HIDDEN, kernelInitializer: 'varianceScaling', activation: 'relu' }));

    //Fully connected 2
    model.add(tf.layers.dense(
        { units: LABEL_SIZE, kernelInitializer: 'varianceScaling', activation: 'softmax' }));


    return model;
}


function compile(model){
    const optimizer = tf.train.sgd(LEARNING_RATE);
    model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });
}

async function loadModelByName(modelName) {

    let model = await await tf.loadModel(`http://127.0.0.1:8080/models/${modelName}.json`)

    let metrics = await (await fetch(`http://127.0.0.1:8080/models/${modelName}.stats.json`)).json()

    trainBatch = metrics.trainBatch;
    trainChartData.datasets[0].data = metrics.trainLoss;
    trainChartData.datasets[1].data = metrics.trainAcc;
    trainChartData.datasets[2].data = metrics.testLoss;
    trainChartData.datasets[3].data = metrics.testAcc;
    trainChartData.labels = metrics.trainLoss.map((v, ix) => ix * 10)

    console.log(model)
    compile(model)
    trainLog("Model loaded(" + (new Date()) + ")");
    return model;
}

async function saveModelByName(modelName) {
    const saveResult = await model.save('downloads://' + modelName);

    const metrics = {
        trainBatch,
        trainLoss: trainChartData.datasets[0].data,
        trainAcc: trainChartData.datasets[1].data,
        testLoss: trainChartData.datasets[2].data,
        testAcc: trainChartData.datasets[3].data
    }
    const filename = modelName + ".stats.json";

    const blob = new Blob([JSON.stringify(metrics)], {
        type: 'application/json',
        name: filename
    });
    const jsonUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = jsonUrl;
    a.download = filename;
    a.click();
    setTimeout(() => {
        window.URL.revokeObjectURL(jsonUrl);
        document.body.removeChild(a);
    }, 0)

    trainLog("Saved model (" + (new Date()) + ")");
}


async function trainModel(model, data) {
    await data.load();

    const BATCH_SIZE = ui.get_batch_size();
    const TRAIN_BATCHES = ui.get_train_batches();
    const TEST_BATCH_SIZE = ui.get_test_examples();

    document.getElementById("train_status").innerText = "Training"

    train_status = 1;
    for (let i = 0; i < TRAIN_BATCHES; i++) {
        trainBatch++;
        let ts = new Date();
        const batch = data.nextTrainBatch(BATCH_SIZE);
        let testBatch;
        let validationData;
        // Every few batches test the accuracy of the mode.
        if (i % ui.get_record_loss() === 0 && i > 0) {
            testBatch = data.nextTestBatch(TEST_BATCH_SIZE);
            validationData = [testBatch.xs, testBatch.ys];
        }


        const history = await model.fit(batch.xs, batch.ys, {
            batchSize: BATCH_SIZE,
            validationData,
            epochs: 1,
            callbacks: {
                onBatchEnd: async (batch, logs) => {

                },
                onEpochEnd: async (epoch, logs) => {
                    let ts2 = new Date();
                    trainLog(`Train batch: ${trainBatch}. ${ts2 - ts}ms`);
                    logTrainData(logs, trainBatch);
                }
            }
        });



        batch.xs.dispose();
        batch.ys.dispose();
        if (testBatch){
            testBatch.xs.dispose();
            testBatch.ys.dispose();
        }
        if (train_status == 1) {
            await tf.nextFrame();
        } else {
            await endPause();
        }
    }
    return model;
}


function predictBoard(model, board){
    var state = getBoardState(board);
    console.log(state.length)
    const xs = tf.tensor4d(state, [1, IMAGE_SIZE, IMAGE_SIZE, FEATURE_PLANES]);
    return model.predict(xs)
}
