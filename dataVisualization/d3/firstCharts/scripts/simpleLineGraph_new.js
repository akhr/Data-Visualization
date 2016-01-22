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

//Axis Params
var xAxisTickValues = function() {
    return [0, 59, 119, 179];
}
var yAxisTickValues = function() {
    return [10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000];
}
var yAxisMin = 1;
var yAxisMax = function() {
    return Math.pow(10, 9);
}


function prepareChart(mode, parentWidth, parentHeight) {
    this.chartMode = mode;
    this.dataset = generateInitChartData();
    defineChartDimension(parentWidth, parentHeight);
    defineSvgCanvas();
    defineGraph();
    defineScaling();
    defineAxes();
    defineAreaPathGenerator();
    addPathGeneratorToGraph();
    addAxisLabels();
    addAxesToGraph();

    generateMockChartData();
}

function flushChart() {
    this.dataset = generateInitChartData();
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
    return initDataArray;
}

function defineScaling() {
    defineXAxisScaling();
    defineYAxisScaling();
}

function defineXAxisScaling() {
    xScale = d3.scale.linear()
        .domain([0, this.dataset.length - 1])
        .range([0, width]);
}

function defineYAxisScaling() {
    yScale = d3.scale.log()
        .domain([yAxisMin, yAxisMax()])
        .range([height, 0]);
}

function defineAxes() {
    defineXAxis();
    defineYAxis();
}

function defineXAxisGrids() {
    return d3.svg.axis()
        .scale(xScale)
        .tickValues(xAxisTickValues())
        .orient("bottom");
}

function defineXAxis() {
    xAxis = d3.svg.axis()
        .scale(xScale)
        .tickValues(xAxisTickValues())
        .tickFormat(function(d, i) {
            if (d == xAxisTickValues()[0]) {
                return "3 mins ago";
            } else if (d == xAxisTickValues()[1])
                return "2 mins ago";
            else if (d == xAxisTickValues()[2])
                return "1 min ago";
            else if (d == xAxisTickValues()[3])
                return "Current";
            else
                null;
        })
        .tickSize(6)
        .tickSubdivide(false)
        .orient("bottom")
        .tickPadding(0);
}


function defineYAxisGrids() {
    return d3.svg.axis()
        .scale(yScale)
        .tickValues(yAxisTickValues())
        .orient("left");
}

function defineYAxis() {
    yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .tickValues(yAxisTickValues())
        .tickFormat(function(d, i) {
            if (d == yAxisTickValues()[0])
                return "10b/s";
            else if (d == yAxisTickValues()[1])
                return "100b/s";
            else if (d == yAxisTickValues()[2])
                return "1Kb/s";
            else if (d == yAxisTickValues()[3])
                return "10Kb/s";
            else if (d == yAxisTickValues()[4])
                return "100Kb/s";
            else if (d == yAxisTickValues()[5])
                return "1Mb/s";
            else if (d == yAxisTickValues()[6])
                return "10Mb/s";
            else if (d == yAxisTickValues()[7])
                return "100Mb/s";
            else
                return "";
        })
        .tickSize(0)
        .tickSubdivide(false)
        .tickPadding(-2);
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
        .style("text-anchor", "end")
        .call(xTextAlign);

    graph.append("svg:g")
        .attr("class", "xGrid")
        .attr("transform", "translate(0," + (height) + ")")
        .call(defineXAxisGrids()
            .tickSize(-height, 0, 0)
            .tickFormat("")
        );

    graph.append("svg:g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(yAxis)
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("transform", "translate(0,0)");

    graph.append("svg:g")
        .attr("class", "yGrid")
        .attr("transform", "translate(0,0)")
        .call(defineYAxisGrids()
            .tickSize(-width, 0, 0)
            .tickFormat("")
        );


    d3.selectAll("g.yGrid g.tick line")
        .attr("x1", function(d) {
            console.log("y axis modifying tick line - d-" + d);
            if (d === 1000000000)
                return 0;
            else
                return (xScale(14));
        });
}

function yTextAlign(d) {
    d3.selectAll("g.y.axis g.tick text")
        .each(function() {
            console.log("*******  S   ******");
            console.log(this);
            console.log('y-text -w-', this.getBBox().width);
            console.log('y-text - h-', this.offsetHeight);
            console.log('y-text - X-', this.offsetLeft);
            console.log('y-text - Y-', this.offsetTop);
            console.log("*******  E   ******");
        });
}

function xTextAlign(d) {
    var tick0 = d[0][0];
    var tick1 = d[0][1];
    var tick2 = d[0][2];
    var tick3 = d[0][3];
    tick0.style.textAnchor = "start";
    tick1.style.textAnchor = "middle";
    console.log('1 x-text -w-', tick1.offsetWidth);
    console.log('1-x-text - h-', tick1.offsetHeight);
    console.log('1-x-text - X-', tick1.offsetLeft);
    console.log('1-x-text - Y-', tick1.offsetTop);
    tick2.style.textAnchor = "middle";
    tick3.style.textAnchor = "end";
}

function addPathGeneratorToGraph() {
    path = graph.append("svg:path")
        .attr("id", this.chartMode + "Path")
        .attr("d", area(dataset))
        .attr("class", "area");
}

function pushDataPoint(dataPoint) {
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
    var pathId = "#" + this.chartMode + "Path";

    path
        .data([dataset])
        .attr("transform", "translate(" + xScale(0) + ")")
        .attr("d", area(dataset))
        .transition()
        .ease("linear")
        .duration(transitionDelay)
        .attr("transform", "translate(" + xScale(0) + ")");
}


var loopCounter = 0;

function generateMockChartData() {
    loopCounter++;
    var dataPoint = {};
    dataPoint.total = Math.round(Math.random() * 40 + 10);
    dataPoint.compression = Math.round(Math.random() * 40 + 10);

    var min = 0;
    var max = 100000000;

    if (loopCounter == 30) {
        flushChart();
        return;
    } else if (loopCounter == 5) {
        dataPoint.throughput = 120;
    } else if (loopCounter == 10) {
        dataPoint.throughput = 1980;
    } else if (loopCounter == 18) {
        dataPoint.throughput = 19;
    } else {
        dataPoint.throughput = Math.round(Math.random() * (max - min) + min);
    }

    this.pushDataPoint(dataPoint);

    setTimeout(function() {
        generateMockChartData();
    }, 1000);

}


function printDataset(dataArray) {
    console.log("Printing DATAsET");
    for (i = 0; i < dataArray.length; i++) {
        console.log("i=" + i + " " + dataArray[i].throughput);
    }
    console.log("DONE Printing DATASET");
}


prepareChart("1", 640, 320);
prepareChart("2", 480, 280);
