const TRAIN_TEST_RATIO = 9 / 10;

class ChessData {

    constructor({logFn, labels}){
        this.train_files = [
            "data_train/standar.pgn-2000.txt", 
            "data_train/standar.pgn-3000.txt", 
            "data_train/standar.pgn-4000.txt",
            "data_train/standar.pgn-5000.txt",
            "data_train/standar.pgn-6000.txt",
            "data_train/standar.pgn-7000.txt",
            "data_train/lightning.pgn-2000.txt",
            "data_train/lightning.pgn-3000.txt",
            "data_train/lightning.pgn-4000.txt",
            "data_train/lightning.pgn-5000.txt",
            "data_train/lightning.pgn-6000.txt",
            "data_train/lightning.pgn-7000.txt",
            "data_train/lightning.pgn-8000.txt",
            "data_train/lightning.pgn-9000.txt",
            "data_train/lightning.pgn-10000.txt"];
        this.valid_files = ["data_validation/standar.pgn-1000.txt"];
        this.log = logFn || (m => console.log(m));
        this.shuffledTrainIndex = 0;
        this.shuffledTestIndex = 0;
        this.labels = labels;
        this.dataLoaded = false;
    }

    async load() {
        if (this.dataLoaded == true) return;
        let trainData = await this.loadFiles(this.train_files);
        let validData = await this.loadFiles(this.valid_files);

        this.log(`${trainData.length} train/test examples, ${validData.length} validation examples`)
        
        let datasetElements = trainData.length;
        this.numTrainElements = Math.floor(TRAIN_TEST_RATIO * datasetElements);
        this.numTestElements = datasetElements - this.numTrainElements;

        let testData = trainData.splice(this.numTrainElements);
        this.trainData = trainData;
        this.testData = testData;
        this.validData = validData;

        this.trainIndices = tf.util.createShuffledIndices(this.numTrainElements);
        this.testIndices = tf.util.createShuffledIndices(this.numTestElements);
        
        this.dataLoaded = true;
        
        return { trainData, testData, validData};
    }

    async loadFiles(files) {
        var data = [];
        for (let file of files) {
            let text = await (await fetch(file)).text();
            data.push(...text.split("\n"));
            this.log(`${file} loaded`)
        }
        return data;
    }

    decodeState(row) {
        let [boardState, label] = row.split(":");
        if (!label) return;
        label = label.replace("\n", "");
        let labelPos = this.labels.indexOf(label);
        boardState = getBoardState(boardState)
        return { boardState, labelPos } 
    }

    nextBatch(batchSize, data, index) {
        const boardSize = IMAGE_SIZE * IMAGE_SIZE * FEATURE_PLANES;
        const batchBoardArray = new Float32Array(batchSize * boardSize);
        const batchLabelsArray = new Uint8Array(batchSize * LABEL_SIZE);

        for (let i = 0; i < batchSize; i++) {
            let state;
            while((state = this.decodeState(data[index()])) === undefined){};
            const { boardState, labelPos } = state;

            batchBoardArray.set(boardState, i * boardSize);
            batchLabelsArray.set([1], i * LABEL_SIZE + labelPos);
        }

        const xs = tf.tensor4d(batchBoardArray, [batchSize, IMAGE_SIZE, IMAGE_SIZE, FEATURE_PLANES]);
        const ys = tf.tensor2d(batchLabelsArray, [batchSize, LABEL_SIZE]);

        return { xs, ys };
    }

    nextTrainBatch(batchSize) {
        return this.nextBatch(
            batchSize, this.trainData, () => {
                this.shuffledTrainIndex =
                    (this.shuffledTrainIndex + 1) % this.trainIndices.length;
                return this.trainIndices[this.shuffledTrainIndex];
            });
    }

    nextTestBatch(batchSize) {
        return this.nextBatch(batchSize, this.testData, () => {
            this.shuffledTestIndex =
                (this.shuffledTestIndex + 1) % this.testIndices.length;
            return this.testIndices[this.shuffledTestIndex];
        });
    }

}