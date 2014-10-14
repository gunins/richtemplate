define([
    'templating/parser!./body/_body.html',
    'widget/Constructor',
    'widget/dom'
], function (template, Constructor, dom) {

    return Constructor.extend({
        template: template,
        nodes: {
            'page-header': function (fragment) {
                var header = this.children['page-header'];
                header.append(fragment);
            }
        },
        init: function (data, children) {
        }
    });

});