function reshape(arr, dim1, dim2) {
    let acc = [];
    for (let i = 0; i < dim1; i++) {
        acc.push(arr.slice(i * dim2, (i + 1) * dim2))
    }
    return acc;

}


function get_board(board_state) {
    board_state = board_state.replace(/\//g, "")
    let [board_pieces, current_player, _2, _3, extra, move_number] = board_state.split(" ")
    board_pieces = [...board_state.split(" ")[0]].map(s => s.charCodeAt(0));

    let board_blank = board_pieces.map(v => v == 49 ? 1 : 0)
    let board_white = board_pieces.map(v => v > 49 && v < 97 ? 1 : 0)
    let board_black = board_pieces.map(v => v >= 97 ? 1 : 0)


    current_player = new Array(64).fill(current_player == 'w' ? 1 : 0);
    extra = new Array(64).fill(+extra);
    move_number = new Array(64).fill(+move_number);
    zeros = new Array(64).fill(0);

    return [...board_pieces, ...board_white, ...board_blank, ...board_black, ...current_player, ...extra, ...move_number, ...zeros]
}

function get_label(label_state, labels) {
    label_state = label_state.replace("\n", "");
    let label = new Array(LABEL_SIZE).fill(0);
    label[labels.indexOf(label_state)] = 1;
    return label;

}

function reformat(data, labels) {
    var ts = new Date();
    let xs = [];
    let ys = [];
    let count = 0;
    for (let game of data) {
        if (game) {
            count++;
            let [board_state, label_state] = game.split(":");
            board_state = board_state.replace(/\//g, "")
            label_state = label_state.replace("\n", "");
            xs.push(...get_board(board_state))
            ys.push(...get_label(label_state, labels))
        }
    }
    console.log('Time spent reformatting: ', new Date() - ts)
    return { xs, ys, count }

}