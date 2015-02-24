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
    var _decoders = {};

    function applyFragment(template, tag) {
        var elTag;
        if (tag === 'li') {
            elTag = 'ul'

        } else if (tag === 'td' || tag === 'th') {
            elTag = 'tr'

        } else if (tag === 'tr') {
            elTag = 'tbody'

        } else {
            elTag = 'div'
        }
        var el = document.createElement(elTag),
            fragment = document.createDocumentFragment();
        el.innerHTML = template;
        fragment.appendChild(el.firstChild);
        return fragment.firstChild;
    }

    function setElement(placeholder, keep, parent, data) {
        var params = this._node,
            el = params.tmpEl((keep) ? placeholder : false, data),
            attributes = params.data.attribs,
            plFragment = applyFragment(params.template, params.data.tag);

        if (!keep) {
            Object.keys(attributes).forEach(function (key) {
                el.setAttribute(key, attributes[key]);
            });
        }

        if (plFragment !== undefined) {
            while (plFragment.childNodes.length > 0) {
                el.appendChild(plFragment.childNodes[0]);
            }
        }

        if (!parent) {
            var parentNode = placeholder.parentNode;
            params.setParent(parentNode);
            if (params.parent !== null || params.parent !== undefined) {
                params.parent.replaceChild(el, placeholder);
            }
        } else {
            params.setParent(parent);
            if (params.parent !== null) {
                params.parent.appendChild(el);
            }
        }

        this._node.el = el;
        if (params.parse !== undefined) {
            params.parse(el);
        }
        return el;

    }

    function setParams(node, children, obj) {
        var tagName = node.tagName,
            self = this;
        var params = {
            id: node.id,
            template: node.template,
            noAttach: _decoders[tagName].noAttach || node.data.tplSet.noattach,
            applyAttach: function () {
                delete this._node.noAttach;
            },
            setParent: function (parent) {
                this._node.parent = parent;
            }.bind(self),
            getParent: function () {
                return this._node.parent;
            }.bind(self),
            run: function (fragment, keep, parent, data) {
                if (this._node.noAttach === undefined) {
                    var placeholder = fragment.querySelector('#' + this._node.id) || fragment;
                    if (placeholder) {
                        return setElement.call(self, placeholder, keep, parent, data || obj);
                    }
                }
            }
        };
        if (children) {
            params.children = children;
        }
        self._node = self._node || {};
        utils.merge(self._node, params);
        self.data = self._node.data;

        self.run = function () {
            return this._node.run.apply(this, arguments)
        }.bind(this);

        self.applyAttach = function () {
            return this._node.applyAttach.apply(this, arguments)
        }.bind(this);

    }

    function parseElements(root, obj) {
        if (!obj) {
            obj = {};
        }
        var context = false,
            children = false;
        root.children.forEach(function (node) {
            var name = node.data.name;
            if (node.children &&
                node.children.length > 0) {
                var contextData = (obj[name]) ? obj[name] : obj;
                children = parseElements.call(this, node, contextData);
            }
            var tagName = node.tagName;

            if (tagName) {
                var name = name;
                if (name !== undefined) {
                    context = context || {};
                    context[name] = {}
                    node.getInstance = function () {
                        return context[name];
                    };
                }
                var data = _decoders[tagName].decode(node, children);
                if (data) {
                    context[name]._node = data;
                    setParams.call(context[name], node, children, obj[name] || obj);
                }

            } else if (name) {
                context = context || {};
                context[name] = {}
                context[name]._node = node;
            }
            children = false;
        }.bind(this));
        return context;
    };
    function runEls(children, fragment) {
        Object.keys(children).forEach(function (key) {
            if (children[key]._node.run !== undefined) {
                children[key]._node.run.call(children[key], fragment);
            }
            if (children[key]._node.el === undefined && children[key]._node.template === undefined) {
                children[key]._node.el = fragment.querySelector('#' + children[key]._node.id);
                children[key]._node.el.removeAttribute('id');
            }
        });
    }

    /**
     *
     * @constructor
     * @param root
     */
    function Decoder(root) {
        this._root = (typeof root === 'string') ? JSON.parse(root) : root;
    }

    utils.merge(Decoder, {
        addDecoder: function (decoder) {
            if (_decoders[decoder.tagName] === undefined) {
                _decoders[decoder.tagName] = decoder;
            }
        }
    });

    utils.merge(Decoder.prototype, {
        addDecoder: Decoder.addDecoder,
        _renderFragment: function (root, data) {
            var children = {},
                fragment = applyFragment(root.template);

            if (root.children && root.children.length > 0) {
                children = parseElements.call(this, root, data || {});

            }
            runEls(children, fragment);

            return {
                fragment: fragment,
                children: children,
                templateId: root.templateId
            };
        },

        render: function (data) {
            var fragment = this._renderFragment(this._root, data);

            return fragment;
        }
    });

    return Decoder;

}));