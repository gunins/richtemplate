/**
 * Created by guntars on 10/10/2014.
 */
define([
    './utils'
], function (utils) {
    var dom = {
        append: function (parent, child) {
            child.run(parent.el, true);
        },
        replace: function (parent, child) {
            parent.el.innerHTML = '';
            dom.append.apply(this, arguments);
        },
        text: function (node, text) {
            node.el.innerText = text;
        },

        Element: Element
    }

    function Element(node) {
        utils.extend(this, node);
    }
    utils.extend(Element.prototype, {
        append: function (child) {
            dom.append(this, child)
        },
        replace: function (child) {
            dom.replace(this, child);
        },
        text: function (text) {
            dom.text(this, text);
        }


    });
    Element.extend = utils.fnExtend;
    return dom;
});