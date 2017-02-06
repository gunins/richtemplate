define([
    'templating/parser!./_button.html',
    'templating/Decoder'
], function (template, Decoder) {
    'use strict';
    function append(parent, child) {
        let key = parent.elGroup.getKeyByIndex(0);
        let el = child.run(key);
        parent.elGroup.set(key, el);
    }

    return function (data, children, obj, node) {
        console.log(data);
        var decoder = new Decoder(template);
        var context = decoder.render();
        var els = context.children;
        append(els.header, children.header);
        append(els.footer, children.footer);
        return {
            el:   context.fragment,
            name: node.name
        }
    };

});