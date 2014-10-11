/**
 * Created by guntars on 10/10/2014.
 */
define([
    './utils'
], function (utils) {
    var dom = {
        append: function (parent, child) {
            while (child.el.childNodes.length > 0) {
                parent.el.appendChild(child.el.childNodes[0]);
            }
            child.el.parentNode.removeChild(child.el);
        },
        add: function (prev, next) {
            prev.el.parentNode.appendChild(next.el);
        },

        insert: function (el) {
            el.placeholder.parentNode.replaceChild(el.el, el.placeholder);
            delete el.placeholder;
        },
        clone: function (node, deep) {
            var item = utils.extend({}, node, {el: node.el.cloneNode(deep || true)});
            for (var a = 0; a < item.el.children.length; a++) {
                var child = item.el.children[a];
                item.children[child.className].el = child;
            }
            return new Element(item);
        },
        text: function (node, text) {
            node.el.innerText = text;
        },
        Element: Element
    }

    function Element(node) {
        this.el = node.el;
        this.children = node.children;
        this.placeholder = node.placeholder;
        this.data = node.data;
        this.name = node.name;
    }

    utils.extend(Element.prototype, {
        append: function (child) {
            dom.append(this, child)
        },
        insert: function () {
            dom.insert(this);
        },
        add: function (prev) {
            dom.add(prev, this);
        },
        clone: function (deep) {
            return dom.clone(this, deep);
        }

    });
    Element.extend = utils.fnExtend;
    return dom;
});