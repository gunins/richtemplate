define([
    'templating/parser!./table/_table.html',
    'widget/Constructor',
    'widget/dom',
    'tableData'
], function (template, Constructor, dom, obj) {

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
            console.log(children)
            var tmp = this.children.tr;
            console.log(this.children)
            var tabledata = obj.table;
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