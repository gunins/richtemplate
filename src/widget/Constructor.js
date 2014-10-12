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

    function setChildrens(children) {
        Object.keys(children).forEach(function (key) {

            if (children[key] instanceof  dom.Element !== true) {
                children[key] = new dom.Element(children[key]);
            }
            if (children[key].children !== undefined) {
                children[key].children = setChildrens.call(this, children[key].children);
            }
        }.bind(this));
        return children
    }

    function Constructor(data, children) {
        this.context = context;
        if (data.appContext !== undefined) {
            utils.extend(this.context, data.appContext);
        }
        if (this.template) {
            var decoder = new Decoder(this.template),
                template = decoder.render();

            this.children = setChildrens.call(this, template.children);

            this.el = template.fragment.firstChild;

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