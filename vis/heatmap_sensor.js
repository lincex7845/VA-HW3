    function cartesianProduct(arr){
        var cartesian = arr.reduce(function(a,b){
            return a.map(function(x){
                return b.map(function(y){
                    return x.concat(y);
                })
            }).reduce(function(a,b){ return a.concat(b); },[])
        }, [[]]);
        return cartesian.map(function(subArray){
            return "" + subArray[0] + "_" + subArray[1];
        });
    }
// @vlarandac resultan muchos valores en el eje y lo que hace un poco dificil la lectura, por cada uno de los 4 compuestos para cada hora se ve un poco ajustado el espacio
    const margin = {top: 20, right:100, bottom: 30, left: 5},
            width = 1400 - margin.left - margin.right,
            height = 1100 - margin.top - margin.bottom,
            reds = ["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#990000"], // colorbrewer OrRd
            buckets = reds.length,
            chemicals = ["Methylosmolene", "Chlorodinine", "AGOC-3A", "Appluimonia"],
            hours = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]
            days = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
            yValues = cartesianProduct([hours, chemicals])
            gridSize = 30,
            legendElementWidth = gridSize * 2;
    const svg = d3.select('#chart').append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    const yLabels = svg
                    .selectAll('.yLabels')
                    .data(yValues)
                    .enter().append('text')
                    .text(function (d) { return d; })
                    .attr("x", 950)
                    .attr("y", (d, i) => i * (gridSize/3))
                    .style("text-anchor", "left")
                    .attr("transform", "translate(-6," + (gridSize/3) / 1.5 + ")")
                    .attr("class", "yLabels mono");
    const xLabels = svg.selectAll(".xLabels")
                    .data(days)
                    .enter().append("text")
                    .text(function (d) { return d; })
                    .attr("x", (d, i) => i * gridSize)
                    .attr("y", 0)
                    .style("text-anchor", "end")
                    .attr("transform", "translate(" + gridSize / 2 + ", -6)")
                    .attr("class", "xLabels mono");
    
    const type = (row) => {
        var selectedIndex = d3.select('.select').property('selectedIndex')
        var month = d3.select('.select').property('options')[selectedIndex].text;
            return {y: row.Chemical, x: row.Day, value: row.Reading,
                 hour: row.Hour, label: "" + month + " " + row.Day + " - Reading: " + row.Reading + " (" + row.Chemical +")"};
    };

    const drawHeatMap = function (dataset){
        d3.tsv(dataset,type,
            (error, data) => {
            if (error) console.log(error);
            else{
                const colorScale = d3.scaleQuantile()
                    .domain([0, buckets - 1, d3.max(data, (d) => d.value)])
                    .range(reds);

                const cards = svg.selectAll(".reading")
                    .data(data, (d) => d.x+':'+d.hour + "_" + d.y);
                cards.append("title");
                cards.enter().append("rect")
                    .attr("x", (d) => (d.x - 1) * gridSize)
                    .attr("y", (d) => {
                        var yValue = "" + d.hour + "_" + d.y;
                        return yValues.indexOf(yValue) * (gridSize/3)
                    })
                    .attr("rx", 4)
                    .attr("ry", 4)
                    .attr("class", "reading bordered")
                    .attr("width", gridSize)
                    .attr("height", gridSize/3)
                    .style("fill", reds[0])
                    .merge(cards)
                    .transition()
                    .duration(1000)
                    .style("fill", (d) => colorScale(d.value));
                cards.select("title").text((d) => d.label);
                cards.exit().remove();

                const legend = svg.selectAll(".legend")
                    .data([0].concat(colorScale.quantiles()),
                     (d) => d);
                const legend_g = legend.enter().append("g")
                    .attr("class", "legend");
                legend_g.append("rect")
                    .attr("x", (d, i) => legendElementWidth * i)
                    .attr("y", 980)
                    .attr("width", legendElementWidth)
                    .attr("height", gridSize / 2)
                    .style("fill", (d, i) => reds[i]);
                // @vlarandac la escala facilita la lectura y da una mejor perspectiva frente a los hallazgos esperados. 
                legend_g.append("text")
                    .attr("class", "mono")
                    .text((d) => "≥ " + d.toFixed(2))
                    .attr("x", (d, i) => legendElementWidth * i)
                    .attr("y", 1010);
                legend.exit().remove();
            }
        });
    };
    // @vlarandac el filtro por meses es muy buena idea para poder visualizar el comportamiento en distintos momentos.
    function start(){
        var dsets = [{month: "Abril", data: "../data/sensor_4_avg.tsv"},
                        {month: "Agosto", data: "../data/sensor_8_avg.tsv"},
                        {month: "Diciembre", data: "../data/sensor_12_avg.tsv"}];
        
        var select = d3.select('#datasets')
            .append('select')
            .attr('class','select')
            .on('change',onchange);

        var options = select
            .selectAll('option')
            .data(dsets).enter()
            .append('option')
            .text(function (d) { return d.month; })
            .attr('value', function(d){return d.data;});

        function onchange(){
            var value = d3.select('.select').property('value');
            drawHeatMap(value);
        }        
    }

start();
drawHeatMap('../data/sensor_4_avg.tsv');
    
