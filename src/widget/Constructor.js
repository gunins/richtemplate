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

    function setBinders() {
        this.bindings = {}
        Object.keys(this.children).forEach(function (key) {
            var el = this.children[key];
            if (el.bind !== undefined) {
                this.bindings[el.bind] = el
            }

        }.bind(this));

    }

    function applyBinders(obj, binders, parent) {
        if (obj) {
            Object.keys(obj).forEach(function (key) {
                var binder = binders[key];
                if (binder !== undefined) {
                    var data = obj[key];
                    binder.applyAttach();

                    if (!utils.isArray(data) && !utils.isObject(data)) {
                        binder.add(parent);
                        binder.text(data);
                    } else if (utils.isArray(data)) {
                        binder.applyAttach();
                        var hasParent = false
                        data.forEach(function (item) {
                            if (!hasParent) {
                                binder.add(parent);
                                hasParent = binder.getParent();
                            } else {
                                binder.add(parent, hasParent);
                            }
                            applyBinders.call(this, item, binder.bindings, binder.el);
                        }.bind(this));
                        hasParent = false;

                    } else if (utils.isObject(data)) {
                        binder.add(parent);
                        applyBinders.call(this, data, binder.bindings, binder.el);

                    }
                }

            }.bind(this));
        }
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

            setBinders.call(this, this.children);
            var data = this.context.data[data.bind];

            if (data) {
                this.data = data;
                applyBinders.call(this, this.data, this.bindings, this.el);
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