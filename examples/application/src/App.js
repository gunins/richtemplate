/**
 * Created by guntars on 09/10/2014.
 */
define([
    'widget/Constructor',
    'templating/parser!./app/_app.html',
    'tableData'
], function (Constructor, template, dataset) {

    return Constructor.extend({
        init:function(){
        },
        template: template
    });
});