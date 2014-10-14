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

    function applyBinders(obj, binders) {
        if (obj) {
            Object.keys(obj).forEach(function (key) {
                var binder = binders[key];
                if (binder !== undefined) {
                    var data = obj[key];
                    if (!isArray(data) && !isObject(data)) {
                        binder.text(data);
//                        binder.insert();
                    } else if (isArray(data)) {
                        if (binder.children !== undefined) {
                            var inserted = false;
                            data.forEach(function (item) {
                                var children = binder.children;
                                Object.keys(children).forEach(function (key) {
                                    var child = children[key],
                                        childData = child.data.dataset;
                                    if (childData.repeat === 'true') {
                                        inserted = true;
                                        var node = child.clone();
                                        applyBinders.call(this, item, node.children);
                                        node.insert();
                                        if (!child.parent) {
                                            delete child.placeholder;
                                        }
                                    }
                                }.bind(this));
                            }.bind(this));
                            if (inserted === true) {
                                binder.insert();
                            }
                        }
                    }
                }
            });
        }

    }

    function parseBinders(obj, binders) {
        if (obj) {
            Object.keys(obj).forEach(function (key) {
                var binder = binders[key];
                if (binder !== undefined) {
                    var data = obj[key];

                    if (!isArray(data) && !isObject(data)) {
                        binder.text(data);
                        binder.insert();
                    } else if (isArray(data)) {

                        data.forEach(function(item){
                            console.log(item);
//                            console.log(data, binder, 'object');
                            var cont = binder.clone();

                            parseBinders.call(this, data, cont.bindings);
                            cont.insert();

                        });

                    } else if (isObject(data)) {
                        parseBinders.call(this, data, binder.bindings);
                        binder.insert();

                    }
                }

            }.bind(this));
        }
    }

    return Constructor.extend({
        template: template,
        init: function (data, children) {
            this.data = this.context.data[data.bind];
            setBinders.call(this, this.children);
            parseBinders.call(this, this.data, this.bindings);

        }
    });

});