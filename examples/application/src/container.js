/**
 * Created by guntars on 12/10/2014.
 */
define([
    'templating/parser!./container/_container.html',
    'widget/Constructor'
], function (template, Constructor, data) {
    return Constructor.extend({
        template: template,

    });
});