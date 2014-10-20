/**
 * Created by guntars on 10/10/2014.
 */
define([
    './utils',
    './dom',
    'templating/Decoder'
], function (utils, dom, Decoder) {
    var context = {};

    function applyChildren(children) {
        var nodes = this.children;
        var keys = Object.keys(nodes);
        if (nodes && keys.length > 0) {
            keys.forEach(function (key) {
                if (children[key] !== undefined) {
                    if (this.nodes[key] !== undefined) {
                        this.nodes[key].call(this, children[key]);
                    } else if (nodes[key] !== undefined) {
                        nodes[key].replace(children[key]);
                    }
                }
            }.bind(this));
        }
    }

    function setChildren(elements) {
        Object.keys(elements).forEach(function (key) {
            if (elements[key] instanceof  dom.Element !== true) {
                elements[key] = new dom.Element(elements[key]);
//                elements[key].setParent(this.el);
            }

            var children = elements[key].children;
            if (children !== undefined) {
                children = setChildren.call(this, children);
                    var keys = Object.keys(children),
                        bindings = false;
                    keys.forEach(function (key) {
                        var child = children[key];
                        if (child.bind !== undefined) {
                            bindings = bindings || {};
                            bindings[child.bind] = child;
                        }
                    }.bind(this));
                    if (bindings) {
                        elements[key].bindings = bindings;
                    }
            }
        }.bind(this));
        return elements
    }

    function Constructor(data, children) {
        this.context = context;
        if (data.appContext !== undefined) {
            utils.extend(this.context, data.appContext);
        }
        if (this.template) {
            var decoder = new Decoder(this.template),
                template = decoder.render();
            this.el = template.fragment;


            this.children = setChildren.call(this, template.children);

            if (children) {
                applyChildren.call(this, children);
            }
        } else {

            this.el = document.createElement('div');
        }
        this.init.apply(this, arguments);
    }

    utils.extend(Constructor.prototype, {
        nodes: {},
        init: function () {
        }
    });

    Constructor.extend = utils.fnExtend;

    return Constructor;
});