/**
 * Created by guntars on 10/10/2014.
 */
define([
    './utils',
    './dom',
    './mediator',
    'templating/Decoder'
], function (utils, dom, Mediator, Decoder) {
    var context = {};

    function applyElement(elements) {
        Object.keys(elements).forEach(function (key) {
            if (elements[key] instanceof  dom.Element !== true) {
                elements[key] = new dom.Element(elements[key]);
            }
            if (elements[key].children) {
                elements[key].children = applyElement(elements[key].children);
            }
        }.bind(this));
        return elements;
    }

    function applyEvents(element, events) {
        if (events !== undefined && element.el !== undefined) {
            events.forEach(function (event) {
                element.on(event.name, event.action, this);
            }.bind(this));
        }
    }

    function setChildren(elements, parentChildren) {
        parentChildren = (parentChildren) ? applyElement(parentChildren) : {};
        elements = (elements) ? applyElement(elements) : {};
        Object.keys(elements).forEach(function (key) {
            var children = elements[key].children;
            if (children !== undefined) {
                children = setChildren.call(this, children, parentChildren.children);
                elements[key].bindings = setBinders(children);
            }

            var child = elements[key],
                parentChild = parentChildren[key];

            if (parentChild !== undefined) {
                if (parentChild.children !== undefined) {
                    parentChild.bindings = deepBindings(parentChild.children);
                }

                if (this.nodes[key] !== undefined) {
                    this.nodes[key].call(this, child, parentChild);
                } else if (child !== undefined) {
                    child.replace(parentChild);
                    if (parentChild.children !== undefined) {
                        child.children = parentChild.children
                    }
                }

            }
            var events = this.events[key];
            applyEvents.call(this, child, events)

        }.bind(this));
        return elements
    }

    function deepBindings(elements) {
        Object.keys(elements).forEach(function (key) {
            var element = elements[key];
            if (element.children) {
                elements[key].children = deepBindings(element.children);
                elements[key].bindings = setBinders(element.children);
            }
        });
        return elements;
    }

    function setBinders(children) {
        var bindings = false
        Object.keys(children).forEach(function (key) {
            bindings = bindings || {};
            var el = children[key];
            if (el.bind !== undefined) {
                bindings[el.bind] = el
            }
        }.bind(this));
        return bindings;
    }

    function applyBinders(obj, instance) {

        var binders = instance.bindings,
            parent = instance.el;
        if (obj) {
            Object.keys(obj).forEach(function (key) {
                var binder = binders[key],
                    events = this.events[key];
                if (binder !== undefined) {
                    var data = obj[key];
                    binder.applyAttach();

                    if (this.nodes[key]) {
                        var childBinder = new dom.Element(binder);
                        this.nodes[key].call(this, childBinder, parent, data);
                    } else {
                        if (!utils.isArray(data) && !utils.isObject(data)) {
                            var childBinder = new dom.Element(binder);
                            childBinder.add(parent);
                            childBinder.text(data);
                            applyEvents.call(this, childBinder, events);
                        } else if (utils.isArray(data)) {
                            binder.applyAttach();
                            var hasParent = false
                            data.forEach(function (item) {
                                var childBinder = new dom.Element(binder);

                                if (!hasParent) {
                                    childBinder.add(parent);
                                    hasParent = binder.getParent();
                                } else {
                                    childBinder.add(parent, hasParent);
                                }
                                if (this.bind[key]) {
                                    this.bind[key].call(this, childBinder, item);
                                }
                                applyBinders.call(this, item, childBinder);
                                applyEvents.call(this, childBinder, events);
                            }.bind(this));
                            hasParent = false;

                        } else if (utils.isObject(data)) {
                            var childBinder = new dom.Element(binder);
                            childBinder.add(parent);
                            if (this.bind[key]) {
                                this.bind[key].call(this, childBinder, data);
                            }
                            applyEvents.call(this, childBinder, events);
                            applyBinders.call(this, data, childBinder);
                        }
                    }
                }
            }.bind(this));
        }
    }

    function Constructor(data, children) {
        this.eventBus = new Mediator();
        this.context = context;
        if (data.appContext !== undefined) {
            utils.extend(this.context, data.appContext);
        }
        if (this.template) {
            var decoder = new Decoder(this.template),
                template = decoder.render();
            this.el = template.fragment;

            this.data = this.context.data[data.bind];
            this.children = setChildren.call(this, template.children, children);
            this.bindings = setBinders.call(this, this.children);

            if (this.data) {
                this.applyBinders(this.data, this);
            }

        } else {

            this.el = document.createElement('div');
        }

        this.init.apply(this, arguments);
    }

    utils.extend(Constructor.prototype, {
        nodes: {},
        events: {},
        bind: {},
        init: function () {
        },
        applyBinders: applyBinders
    });

    Constructor.extend = utils.fnExtend;

    return Constructor;
});