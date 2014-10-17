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
        add: function (parent, child) {
            parent.el.appendChild(child.el);
        },

        insert: function (el) {
            if (el.placeholder !== undefined) {
                el.el = el.instance();
            } else {
//                el.parent.appendChild(el.el);
            }

        },
        clone: function (node) {
            node.run();
            return new Element(node);
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
        insert: function () {
            dom.insert(this);
        },
        clone: function () {
            this.applyAttach();
            this.run();
            return this;
        },
        add: function (parent) {
            dom.add(parent, this);
        },
   /*     clone: function (deep) {
            return dom.clone(this, deep);
        },*/
        text: function (text) {
            dom.text(this, text);
        }


    });
    Element.extend = utils.fnExtend;
    return dom;
});