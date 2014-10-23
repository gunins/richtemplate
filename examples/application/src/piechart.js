define([
    'templating/parser!./piechart/_piechart.html',
    './piechart/pie',
    'widget/Constructor',
    'watch'
], function (template, Pie, Constructor, WartchJs) {
    var watch = WartchJs.watch;
    return Constructor.extend({
        template: template,
        init: function (data, children) {
        },
        nodes: {
            chartcontent: function (el, parent, data) {
                el.add(parent);
                var pie = new Pie();
                pie.start(el, data);
                setTimeout(function () {
                    data.data = [
                        {age: '<5', population: 27046},
                        {age: '5-13', population: 44998},
                        {age: '14-17', population: 2159},
                        {age: '18-24', population: 385378},
                        {age: '25-44', population: 141065},
                        {age: '45-64', population: 881},
                        {age: '≥65', population: 612463}
                    ];

                }.bind(this), 2000);

            }
        }
    })

});