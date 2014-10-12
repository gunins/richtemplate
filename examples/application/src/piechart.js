define([
    'templating/parser!./piechart/_piechart.html',
    'widget/Constructor'
], function (template, Constructor) {
    return Constructor.extend({
        template: template,
        init:function(data, children){
        }
    })

});