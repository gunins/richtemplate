/**
 * Created by guntars on 10/10/2014.
 */
define([
    './utils',
    './dom',
    'templating/Decoder'
], function (utils, dom, Decoder) {

    function applyChildren(children) {
        var nodes = this.context.children;
        var keys = Object.keys(nodes);
        if (nodes && keys.length > 0) {
            keys.forEach(function (key) {
                if (children[key] !== undefined) {
                    if (this.nodes[key] !== undefined) {
                        this.nodes[key].call(this, children[key]);
                    } else if (nodes[key] !== undefined) {
                        dom.append(nodes[key], children[key]);

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
        if (this.template) {
            var decoder = new Decoder(this.template);
            this.context = decoder.render();

            this.children = setChildrens.call(this, this.context.children);

            this.el = this.context.fragment.firstChild;

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
        },
        start: function (container) {
            container.appendChild(this.el);
        }
    });

    Constructor.extend = utils.fnExtend;

    return Constructor;
});