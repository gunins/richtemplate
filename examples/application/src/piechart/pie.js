/**
 * Created by guntars on 23/10/14.
 */
define([
    'd3',
    'watch'
], function (d3, WatchJS) {
    var watch = WatchJS.watch;
    var color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function (d) {
            return d.population;
        });

    function Pie() {

    }

    Pie.prototype.start = function (node, data) {

        var el = node.el;
        this.data = data.data;
        setTimeout(function () {
            var width = el.offsetWidth,
                height = el.offsetHeight,
                radius = Math.min(width, height) / 2;

            var arc = this.arc= d3.svg.arc()
                .outerRadius(radius - 10)
                .innerRadius(radius - 60);

            var svg = d3.select(el).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            this.data.forEach(function (d) {
                d.population = +d.population;
            });

            this.g = svg.selectAll(".arc")
                .data(pie(this.data))
                .enter().append("g")
                .attr("class", "arc");

            this.g.append("path")
                .attr("d", arc)
                .style("fill", function (d) {
                    return color(d.data.age);
                });

            this.g.append("text")
                .attr("transform", function (d) {
                    return "translate(" + arc.centroid(d) + ")";
                })
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .style("font-size", "10px")
                .style("fill", "#ffffff")
                .text(function (d) {
                    return d.data.age;
                });

        }.bind(this), 100);
        watch(data, 'data', function () {
            this.redraw(data.data);
        }.bind(this))

    }
    Pie.prototype.redraw = function (data) {
        console.log(data)
        this.data = data;
        this.data.forEach(function (d) {
            d.population = +d.population;
        });
        //this.g.selectAll("path").data(pie(this.data)).enter().attr("d", this.arc);
    }
    return Pie;
});