var margin = {
    top: 30,
    right: 30,
    bottom: 30,
    left: 30
};

var axisLabelSpace = 40;

var chartMode;
var width;
var height;
var datasetLength = 180;
var dataset;
var xScale;
var xScale_1;
var yScale;
var xAxis;
var yAxis;
var area;
var canvas;
var graph;
var path;
var interpolationType = "basis";
var transitionDelay = 500;

function prepareChart(mode, parentWidth, parentHeight) {
    this.chartMode = mode;
    defineChartDimension(parentWidth, parentHeight);
    defineSvgCanvas();
    this.dataset = generateInitChartData();
    defineGraph();
    defineScaling();
    defineAxes();
    defineAreaPathGenerator();
    addAxisLabels();
    addAxesToGraph();
    addPathGeneratorToGraph();

    generateMockChartData();
}

function defineChartDimension(parentWidth, parentHeight) {
    width = parentWidth - margin["left"] - margin["right"];
    height = parentHeight - margin["top"] - margin["bottom"];
}

function generateInitChartData() {
    var initDataArray = [];
    for (var i = 0; i < datasetLength; i++) {
        var dataPoint = {};
        dataPoint.total = 0;
        dataPoint.compression = 0;
        dataPoint.throughput = 1;
        // dataPoint.throughput = Math.round(Math.random() * 40 + 10);
        initDataArray.push(dataPoint);
    }
    printDataset(initDataArray)
    return initDataArray;
}

function defineScaling() {
    defineXAxisScaling();
    defineYAxisScaling();
}

function defineXAxisScaling() {
    xScale = d3.scale.linear()
        .domain([0, dataset.length])
        .range([0, width]);
}

function defineYAxisScaling() {
    yScale = d3.scale.log()
        .domain([1, 1000000000])
        .range([height, 0]);
}

function defineAxes() {
    defineXAxis();
    defineYAxis();
}

function defineXAxis() {
    xAxis = d3.svg.axis()
        .scale(xScale)
        .tickValues([0, 60, 120, 179])
        .tickFormat(function(d, i) {
            if (d == 60)
                return "2 mins ago";
            else if (d == 120)
                return "1 min ago";
            else if (d == 179)
                return "current";
            else
                null;
        })
        .tickSize(-height, 0, 0)
        .tickSubdivide(true)
        .orient("bottom")
        .tickPadding(10);
}

function defineYAxis() {
    yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .tickPadding(10)
        .tickSize(-width + 3, 0, 0)
        .tickValues([10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000])
        .tickFormat(function(d, i) {
            // console.log("Y axis tick formatting called - i =" + i + "-- d=" + d);
            if (d == 10)
                return "10b";
            else if (d == 100)
                return "100b";
            else if (d == 1000)
                return "1Kb";
            else if (d == 10000)
                return "10Kb";
            else if (d == 100000)
                return "100Kb";
            else if (d == 1000000)
                return "1Mb";
            else if (d == 10000000)
                return "10Mb";
            else if (d == 100000000)
                return "100Mb";
            else
                return "";
        });
}

function defineAreaPathGenerator() {
    area = d3.svg.area()
        .x(function(d, i) {
            return xScale(i);
        })
        .y0(function(d) {
            return height;
        })
        .y1(function(d) {
            return yScale(d.throughput);
        })
        .interpolate(interpolationType);
}

function defineSvgCanvas() {
    canvas = d3.select("#inboundChart")
        .append("svg:svg")
        .attr("width", width + margin.left + margin.right + axisLabelSpace)
        .attr("height", height + margin.top + margin.bottom + axisLabelSpace);
}

function defineGraph() {
    var graphXPos = margin["left"] + axisLabelSpace;
    var graphYPos = margin["top"];

    graph = canvas.append("svg:g")
        .attr("transform", "translate(" + graphXPos + "," + graphYPos + ")")
}

function addAxisLabels() {
    canvas.append("text")
        .attr("x", 15)
        .attr("y", (height / 2))
        .style("writing-mode", "tb")
        .text("Throughput")
        .attr("class", "text");

    canvas.append("text")
        .attr("x", ((width / 2) + axisLabelSpace))
        .attr("y", (height + axisLabelSpace * 2))
        .text("Time")
        .attr("class", "text");
}


function addAxesToGraph() {
    graph.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height) + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end");

    graph.append("svg:g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(yAxis)
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("transform", "translate(10,-6)");

}

function addPathGeneratorToGraph() {
    path = graph.append("svg:path")
        .attr("d", area(dataset))
        .attr("class", "area");
}


var loopCounter = 0;

function generateMockChartData() {
    loopCounter++;
    var dataPoint = {};
    dataPoint.total = Math.round(Math.random() * 40 + 10);
    dataPoint.compression = Math.round(Math.random() * 40 + 10);
    // dataPoint.throughput = Math.round(Math.random() * 40 + 10);
    var min = 0;
    var max = 100000000;
    if (loopCounter == 5) {
        dataPoint.throughput = 120;
    } else if (loopCounter == 10) {
        dataPoint.throughput = 1980;
    } else if (loopCounter == 18) {
        dataPoint.throughput = 19;
    } else
        dataPoint.throughput = Math.round(Math.random() * (max - min) + min);
    // console.log("Generated Throughput : " + dataPoint.throughput);
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
    // console.log("redrawChart() called");
    /*  defineScaling();
        defineYAxis()
        graph.selectAll(".y.axis")
            .call(yAxis);*/

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

function powerOfTen(d) {
    return d / Math.pow(10, Math.ceil(Math.log(d) / Math.LN10 - 1e-12)) === 1;
}


prepareChart("", 640, 320);
