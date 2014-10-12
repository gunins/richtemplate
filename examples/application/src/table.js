define([
    'templating/parser!./table/_table.html',
    'widget/Constructor',
    'widget/dom'
], function (template, Constructor, dom) {

    function parser(data, nodes) {
        Object.keys(data).forEach(function (key) {
            if (nodes[key]) {
                dom.text(nodes[key], data[key]);
            }
        });
    }

    return Constructor.extend({
        template: template,
        init: function (data, children) {

            var tmp = this.children.tr;
            var tabledata = this.context.data[data.bind];
            var first;

            tabledata.forEach(function (item, index) {
                var node = tmp.clone();
                parser(item, node.children);

                if (index === 0) {
                    first = node;
                    node.insert();
                } else {
                    node.add(first);
                }
            });
        }
    });

});