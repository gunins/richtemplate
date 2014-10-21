define([
    'templating/parser!./table/_table.html',
    'widget/Constructor'
], function (template, Constructor) {


    return Constructor.extend({
        template: template
    });

});