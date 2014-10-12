(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([
            'templating/utils'
        ], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./utils'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.Decoder = factory(root.Templating.utils);
    }
}(this, function (utils) {

    /**
     *
     * @constructor
     * @param root
     */
    function Decoder(root) {
//        var root = JSON.parse(template);
//        console.log('Decoder: Template deserialization: ', root);
        this._root = (typeof root === 'string') ? JSON.parse(root) : root;
    }

    function parseElements(root, fragment) {
        var context = false,
            children = false;
        root.children.elements.forEach(function (node) {
            if (node.children &&
                node.children.elements &&
                node.children.elements.length > 0) {
                children = parseElements.call(this, node, fragment);
            }
            if (node.tagName) {
                var data = _decoders[node.tagName].decode(node, children);
                if (data) {
                    context = context || {};

                    var el = data.el,
                        attributes = node.data.attribs;

                    if (data.name !== undefined) {
                        context[data.name] = data;
                        el.classList.add(data.name);

                        if (children) {
                            context[data.name].children = children;
                        }
                    }

                    Object.keys(attributes).forEach(function (key) {
                        el.setAttribute(key, attributes[key]);
                    });

                    var placeholder = fragment.querySelector('#' + node.id);

                    while (placeholder.childNodes.length > 0) {
                        el.appendChild(placeholder.childNodes[0]);
                    }
                    if (_decoders[node.tagName].noAttach !== undefined) {
                        context[data.name].placeholder = placeholder;
                    } else {
                        placeholder.parentNode.replaceChild(el, placeholder);
                    }

                }
            }

        }.bind(this));

        return context;
    };

    var _decoders = {};

    utils.merge(Decoder, {
        addDecoder: function (decoder) {
            if (_decoders[decoder.tagName] === undefined) {
                _decoders[decoder.tagName] = decoder;
            }
        }
    });
    utils.merge(Decoder.prototype, {
        addDecoder: Decoder.addDecoder,
        _renderFragment: function (root) {
            var children = {},
                el = document.createElement('div'),
                fragment = document.createDocumentFragment();

            el.innerHTML = root.template;
            fragment.appendChild(el.firstChild);

            if (root.children.elements.length > 0) {
                children = parseElements.call(this, root, fragment);
            }

            return {
                fragment: fragment,
                children: children
            };
        },

        render: function () {
            return this._renderFragment(this._root);
        }
    });

    return Decoder;

}));