



async function load_files_data(files){
    var data = [];
    function info_load(file, type) {
        document.getElementById("train_status").innerText = `Loading ${type} data: ${file}`
    }
    for (let file of files) {
        info_load(file, 'training');
        let response = await fetch(file);
        let text = await response.text();
        data.push(...text.split("\n"));
        trainLog(`${file} loaded`)
    }
    return data;
}

async function load_train_data(){
    let train_files = ["data_train/standar.pgn-2000.txt", "data_train/standar.pgn-3000.txt", "data_train/standar.pgn-4000.txt"];
    let valid_files = ["data_validation/standar.pgn-1000.txt"];
    
    var train_data = load_files_data(train_files);
    var valid_data = load_files_data(valid_files);

    trainLog(`${train_data.length} train examples, ${valid_data.length} validation examples`)

    return {train_data, valid_data};    
}
