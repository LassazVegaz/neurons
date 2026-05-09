window.createChart = (canvasId, data) => {
    const canvas = document.getElementById(canvasId);

    new Chart(canvas, {
        type: "line",
        data
    });
}

window.updateChart = (canvasId, data) => {
    const canvas = document.getElementById(canvasId);

    const chart = Chart.getChart(canvas);

    chart.data = data;
    chart.update();
}
