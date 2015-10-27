var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
};

var chartMode;
var width;
var height;
var dataSet;
var xScale;
var yScale;
var xAxis;
var yAxis;
var area;
var graph;
var interpolationType = "basis";

function prepareChart(mode, parentWidth, parentHeight) {
    this.chartMode = mode;
    defineChartDimension(parentWidth, parentHeight);
    this.dataSet = generateInitChartData();
    defineGraph();
    defineScaling();
    defineAxes();
    defineAreaPathGenerator();
}

function defineChartDimension(parentWidth, parentHeight) {
    var chartAreaWidth = parentWidth - 20;
    var ChartAreaHeight = parentHeight - 20;
    width = chartAreaWidth - margin["left"] - margin["right"];
    height = ChartAreaHeight - margin["top"] - margin["bottom"];
}

function generateInitChartData() {
    var initDataArray = [];
    for (var i = 0; i < 180; i++) {
        var dataPoint = {};
        dataPoint.total = 0;
        dataPoint.compression = 0;
        dataPoint.throughput = null;
        initDataArray.push(dataPoint);
    }
    return initDataArray;
}

function defineScaling() {
    xScale = d3.scale.linear()
        .domain([0, dataSet.length])
        .range([0, width]);

    yScale = d3.scale.linear()
        .domain(d3.extent(dataSet, function(d) {
            return d.throughput;
        }))
        .range([height, 0]);
}

function defineAxes() {
    xAxis = d3.svg.axis()
        .scale(xScale)
        .tickSubdivide(false)
        .orient("bottom");

    yAxis = d3.svg.axis()
        .scale(yScale)
        .ticks(6)
        .orient("left");
}

function defineAreaPathGenerator() {
    area = d3.svg.area()
        .x(function(d, i) {
            console.log('Plotting X value for data point: ' + d + ' using index: ' + i + ' to be at: ' + x(i) + ' using our xScale.');
            return xScale(i);
        })
        .y0(function(d) {
            return height;
        })
        .y1(function(d) {
            console.log('Plotting Y value for data point: ' + d + ' to be at: ' + y(d) + " using our yScale.");
            return yScale(d.throughput);
        })
        .intepolate(interpolationType);
}

function defineGraph() {
    graph = d3.select("#inboundChart")
        .append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .append("svg:g")
        .attr("transform", "translate(" + margin["left"] + "," + margin["top"] + ")");
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
    graph.append("svg:path")
        .attr("d", area(data))
        .attr("class", "area");
}

function generateMockChartData() {
    var dataPoint = {};
    dataPoint.total = Math.round(Math.random() * 40 + 10);;
    dataPoint.compression = Math.round(Math.random() * 40 + 10);;
    dataPoint.throughput = Math.round(Math.random() * 40 + 10);;
    this.pushDataPoint(dataPoint);
    setTimeout(function() {
        generateMockChartData();
    }, 1000);
}

function pushDataPoint(dataPoint) {
    if (dataSet) {
        if (dataSet.length < 180) {
            dataSet.push(dataPoint);
        } else if (dataSet.length === 180) {
            dataSet.shift();
            dataSet.push(dataPoint);
        }
    }
    redrawChart();
}

function redrawChart(){
    graph.selectAll("path")
        .data([dataset])
        .attr("transform", "translate("+ xScale(1) +")")
        .attr("d", area)
        .transition()
        .ease("linear")
        .duration(transistionDelay)
        .attr("transform", "translate("+ xScale(0) +")")
}
