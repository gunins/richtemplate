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
        replace: function (parent, child) {
            parent.el.innerHTML = '';
            dom.append.apply(this, arguments);
        },
        add: function (parent, child) {
            parent.el.appendChild(child.el);
        },

        insert: function (el) {
            el.parent.appendChild(el.el);

            if (el.placeholder !== undefined) {
                el.parent.replaceChild(el.el, el.placeholder);
                el.placeholder = undefined;
            } else {
                el.parent.appendChild(el.el);
            }
        },
        clone: function (node) {
            var children = node.children;
            if (children !== undefined) {
                Object.keys(children).forEach(function (key) {
                    children[key] = dom.clone(children[key]);
                });
            }
            var oldEl = node.el,
                newEl = oldEl.cloneNode(false);

            var item = utils.extend({}, node);
            item.el = newEl;
//                console.log(item)
            return new Element(item);
        },
        text: function (node, text) {
            node.el.innerText = text;
        },

        Element: Element
    }

    function Element(node) {
//        this.el = node.el;
//        this.children = node.children;
//        this.placeholder = node.placeholder;
//        this.data = node.data;
//        this.name = node.name;
        Object.keys(node).forEach(function (key) {
            this[key] = node[key]
        }.bind(this));

        if (this.parent === undefined && this.placeholder !== undefined) {
            this.parent = this.placeholder.parentNode;
        } else if (this.parent === undefined) {
            this.parent = this.el.parentNode;
        }

    }

    utils.extend(Element.prototype, {
        append: function (child) {
            dom.append(this, child)
        },
        replace: function (child) {
            dom.replace(this, child);
        },
        insert: function () {
            dom.insert(this);
        },
        add: function (parent) {
            dom.add(parent, this);
        },
        clone: function (deep) {
            return dom.clone(this, deep);
        },
        text: function (text) {
            dom.text(this, text);
        }


    });
    Element.extend = utils.fnExtend;
    return dom;
});