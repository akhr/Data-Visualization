var margin = {
    top: 30,
    right: 30,
    bottom: 30,
    left: 30
};

var chartMode;
var width;
var height;
var datasetLength = 180;
var dataset;
var xScale;
var yScale;
var xAxis;
var yAxis;
var area;
var graph;
var path;
var interpolationType = "linear";
var transitionDelay = 500;

function prepareChart(mode, parentWidth, parentHeight) {
    this.chartMode = mode;
    defineChartDimension(parentWidth, parentHeight);
    this.dataset = generateInitChartData();
    defineGraph();
    defineScaling();
    defineAxes();
    defineAreaPathGenerator();
    addAxisToGraph();
    addPathGeneratorToGraph();
    generateMockChartData();
}

function defineChartDimension(parentWidth, parentHeight) {
    var chartAreaWidth = parentWidth - 20;
    var ChartAreaHeight = parentHeight - 20;
    width = chartAreaWidth - margin["left"] - margin["right"];
    height = ChartAreaHeight - margin["top"] - margin["bottom"];
}

function generateInitChartData() {
    var initDataArray = [];
    for (var i = 0; i < datasetLength; i++) {
        var dataPoint = {};
        dataPoint.total = 0;
        dataPoint.compression = 0;
        dataPoint.throughput = Math.round(Math.random() * 40 + 10);
        initDataArray.push(dataPoint);
    }
    printDataset(initDataArray)
    return initDataArray;
}

function defineScaling() {
    xScale = d3.scale.linear()
        .domain([0, dataset.length])
        .range([0, width]);

    yScale = d3.scale.linear()
        .domain(d3.extent(dataset, function(d) {
            return d.throughput;
        }))
        .range([height, 0]);
}

function defineAxes() {
    defineXAxis();
    defineYAxis();
}

function defineXAxis() {
    xAxis = d3.svg.axis()
        .scale(xScale)
        .tickFormat(function(d, i){
            console.log("X axis tick formatting called - i ="+i);
            if(d == 60)
                return "2mins ago";
            else if(d == 120)
                return "1min ago";
            else
                null;
        })
        .tickSubdivide(false)
        .orient("bottom");
}

function defineYAxis() {
    yAxis = d3.svg.axis()
        .scale(yScale)
        .ticks(6)
        .orient("left");

}

function defineAreaPathGenerator() {
    area = d3.svg.area()
        .x(function(d, i) {
            // console.log('Plotting X value for data point: ' + d.throughput + ' using index: ' + i + ' to be at: ' + xScale(i) + ' using our xScale.');
            return xScale(i);
        })
        .y0(function(d) {
            return height;
        })
        .y1(function(d) {
            // console.log('Plotting Y value for data point: ' + d.throughput + ' to be at: ' + yScale(d.throughput) + " using our yScale.");
            return yScale(d.throughput);
        })
        .interpolate(interpolationType);
}

function defineGraph() {
    graph = d3.select("#inboundChart")
        .append("svg:svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("svg:g")
        .attr("transform", "translate(" + (margin["left"]) + "," + margin["top"] + ")")
        .style("fill", "blue");
}


function addAxisToGraph() {
    graph.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    graph.append("svg:g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(yAxis);
}

function addPathGeneratorToGraph() {
    path = graph.append("svg:path")
        .attr("d", area(dataset))
        .attr("class", "area");
}


var loopCounter = 0;

function generateMockChartData() {
    // console.log("generateMockChartData() called");

    /*if (loopCounter >= 5) {
        console.log("Exiting mock data generation");
        printDataset(dataset);
        redrawChart()
        return;
    }*/

    loopCounter++;
    var dataPoint = {};
    dataPoint.total = Math.round(Math.random() * 40 + 10);
    dataPoint.compression = Math.round(Math.random() * 40 + 10);
    var min = 0;
    var max = 400;
    dataPoint.throughput = Math.round(Math.random() * (max - min) + min);
    console.log("Generated Throughput : " + dataPoint.throughput);
    this.pushDataPoint(dataPoint);
    setTimeout(function() {
        generateMockChartData();
    }, 1000);
}

function pushDataPoint(dataPoint) {
    // console.log("pushDataPoint() called");
    if (dataset) {
        if (dataset.length < datasetLength) {
            dataset.push(dataPoint);
        } else if (dataset.length === datasetLength) {
            dataset.shift();
            dataset.push(dataPoint);
        }
    }
    redrawChart();
}

function redrawChart() {
    console.log("redrawChart() called");
    defineScaling();
    defineYAxis()
    graph.selectAll(".y.axis")
        .call(yAxis);

    path
        .data([dataset])
        .attr("transform", "translate(" + xScale(0) + ")")
        .attr("d", area(dataset))
        .transition()
        .ease("linear")
        .duration(transitionDelay)
        .attr("transform", "translate(" + xScale(0) + ")");
}

function printDataset(dataArray) {
    console.log("Printing DATAsET");
    for (i = 0; i < dataArray.length; i++) {
        console.log("i=" + i + " " + dataArray[i].throughput);
    }
    console.log("DONE Printing DATASET");
}


prepareChart("", 640, 320);
