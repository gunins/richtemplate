define([
    'templating/parser!./sidebar/_sideBar.html',
    'widget/Constructor'
], function (template, Constructor) {
    return Constructor.extend({
        template: template
    })

});