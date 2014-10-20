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

    function setElement(placeholder, keep, parent) {
        var el = this.tmpEl((keep) ? placeholder : false),
            name = this.name,
            attributes = this.data.attribs,
            plFragment = applyFragment(this.template, this.data.tag);
        Object.keys(attributes).forEach(function (key) {
            el.setAttribute(key, attributes[key]);
        });

        if (plFragment !== undefined) {
            while (plFragment.childNodes.length > 0) {
                el.appendChild(plFragment.childNodes[0]);
            }
        }

        if (name !== undefined) {
            el.classList.add(name);
        }

        if (!parent) {
            var parentNode = placeholder.parentNode;
            this.setParent(parentNode);
            if (this.parent !== null) {
                this.parent.replaceChild(el, placeholder);
            }
        }else{
            this.setParent(parent);
            if (this.parent !== null) {
                this.parent.appendChild(el);
            }
        }



        this.el = el;
        if (this.parse !== undefined) {
            this.parse(el);
        }
        return el;

    }

    function setParams(node, children) {
        var tagName = node.tagName;
        utils.merge(this, {
            id: node.id,
            template: node.template,
            noAttach: _decoders[tagName].noAttach,
            instance: setElement.bind(this),

            applyAttach: function () {
                delete this.noAttach;
            },

            setParent: function (parent) {
                this.parent = parent;
            }.bind(this),
            getParent:function(){
                return this.parent;
            }.bind(this),
            run: function (fragment, keep, parent) {
                if (this.noAttach === undefined) {
                    var placeholder = fragment.querySelector('#' + this.id) || fragment;
                    if (placeholder) {
                        return this.instance(placeholder, keep, parent);

                    }
                }
            }
        });

        if (children) {
            this.children = children;
        }
    }

    function parseElements(root) {
        var context = false,
            children = false;
        root.children.forEach(function (node) {
            if (node.children &&
                node.children.length > 0) {
                children = parseElements.call(this, node);
            }
            var tagName = node.tagName;
            if (tagName) {
                var data = _decoders[tagName].decode(node, children, runEls);
                if (data) {
                    var name = data.name;

                    if (name !== undefined) {
                        context = context || {};
                        context[name] = data;
                        setParams.call(context[name], node, children);
                    }
                }
            }
            children = false;
        }.bind(this));

        return context;
    };
    function runEls(children, fragment) {
        Object.keys(children).forEach(function (key) {
            children[key].run(fragment);
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
        _renderFragment: function (root) {
            var children = {},
                fragment = applyFragment(root.template);

            if (root.children && root.children.length > 0) {
                children = parseElements.call(this, root);

            }
            runEls(children, fragment);

            return {
                fragment: fragment,
                children: children
            };
        },

        render: function () {
            var fragment = this._renderFragment(this._root);

            return fragment;
        }
    });

    return Decoder;

}));