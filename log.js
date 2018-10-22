window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};


function trainLog(txt) {
    document.getElementById("train_output").value += txt + "\n"
}




var ctx = document.getElementById('train_canvas').getContext('2d');
var trainChartData = {
    labels:[0],
    datasets: [{
        label: 'Train loss',
        borderColor: window.chartColors.red,
        backgroundColor: window.chartColors.red,
        fill: false,
        data: [0],
        yAxisID: 'y-axis-1',
    }, {
        label: 'Train accuracy',
        borderColor: window.chartColors.blue,
        backgroundColor: window.chartColors.blue,
        fill: false,
        data: [0],
        yAxisID: 'y-axis-2'
    },
    {
        label: 'Test loss',
        borderColor: window.chartColors.orange,
        backgroundColor: window.chartColors.orange,
        fill: false,
        data: [0],
        yAxisID: 'y-axis-1',
    }, {
        label: 'Test accuracy',
        borderColor: window.chartColors.purple,
        backgroundColor: window.chartColors.purple,
        fill: false,
        data: [0],
        yAxisID: 'y-axis-2'
    }]
};




function logTrainData(logs, idx) {
    
    if (idx % ui.get_record_loss() == 0) {
        
        trainChartData.labels.push(idx);
        let ds = trainChartData.datasets;
        ds[0].data.push(logs.loss);
        ds[1].data.push(logs.acc*100);
        if (logs.val_loss === undefined) {
            logs.val_loss = ds[2].data[ds[2].data.length - 1];
        }
        if (logs.val_acc === undefined) {
            logs.val_acc = ds[3].data[ds[3].data.length - 1] / 100;
        }
        ds[2].data.push(logs.val_loss);
        ds[3].data.push(logs.val_acc * 100);
        trainLog(`Training: ${("    " + idx).substr(-4)}` +
            ` Loss: ${("    " + logs.loss.toFixed(2)).substr(-5)}` +
            ` Acc: ${(100 * logs.acc).toFixed(2)}%` +
            ` Test Loss: ${("    " + logs.val_loss.toFixed(2)).substr(-5)}` +
            ` Test Acc: ${(100 * logs.val_acc).toFixed(2)}%`);
        window.trainLines.update();
    }


}

window.trainLines = Chart.Line(ctx, {
    data: trainChartData,
    options: {
        animation: {
            duration: 0
        },
        responsive: true,
        hoverMode: 'index',
        stacked: false,
        title: {
            display: true,
            text: 'Training chart'
        },
        scales: {
            yAxes: [{
                type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                display: true,
                position: 'left',
                id: 'y-axis-1',
            }, {
                type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                display: true,
                position: 'right',
                id: 'y-axis-2',

                // grid line settings
                gridLines: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
            }],
        }
    }
});
