define([
    'templating/parser!./table/_table.html',
    'widget/Constructor'
], function (template, Constructor) {

    function parser(data, nodes) {
        Object.keys(data).forEach(function (key) {
            if (nodes[key]) {
                nodes[key].text(data[key]);
            }
        });
    }

    function isString(obj) {
        return toString.call(obj) === '[object String]';

    }

    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

    function isArray(obj) {
        return toString.call(obj) === '[object Array]';
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

                    if (!isArray(data) && !isObject(data)) {

                        binder.add(parent);
                        binder.text(data);
                    } else if (isArray(data)) {
                        binder.applyAttach();
                        var hasParent = false
                        data.forEach(function (item) {
                            if (!hasParent) {
                                binder.add(parent);
                                hasParent = binder.getParent();
                            }else{
                                binder.add(parent, hasParent);
                            }
                            applyBinders.call(this, item, binder.bindings, binder.el);
                        }.bind(this));
                        hasParent = false;

                    } else if (isObject(data)) {
                        binder.add(parent);
                        applyBinders.call(this, data, binder.bindings, binder.el);

                    }
                }

            }.bind(this));
        }
    }

    return Constructor.extend({
        template: template,
        init: function (data, children) {
//            console.log(children)
            this.data = this.context.data[data.bind];
            setBinders.call(this, this.children);
            applyBinders.call(this, this.data, this.bindings, this.el);

        }
    });

});