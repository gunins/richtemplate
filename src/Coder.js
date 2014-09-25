(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([
            './utils'
        ], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./utils'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.Coder = factory(root.Templating.utils);
    }
}(this, function (utils) {

    function applyCoder(el, root, coder) {
        var element;

        if (el.name == coder.tagName) {
            element = el;
            el = this._parser.createElement('div');
            this._parser.replaceElement(element, el);
            this._parser.appendChild(el, element);
        }

        while (element = this._parser.getElementByTagName(coder.tagName, this._parser.getChildren(el))) {
            var placeholder = this._parser.createElement('div');
            var id = 'e' + c++;
            this._parser.setAttributeValue(placeholder, 'id', id);
            this._parser.replaceElement(element, placeholder);

            root.elements = root.elements || [];
            root.elements.push({
                id: id,
                tagName: coder.tagName,
                data: this._prepare(element, coder)
            });
        }
    };

    /**
     *
     * @constructor
     * @param dOMParser
     */
    function Coder(dOMParser) {
        this._parser = dOMParser;
    }

    var _coders = [];
    var c = 0;

    utils.merge(Coder, {
        addCoder: function (coder) {
            _coders.push(coder);
        }
    });

    utils.merge(Coder.prototype, {
        addCoder: Coder.addCoder,
        _compile: function (el) {
            var root = {};
            _coders.forEach(applyCoder.bind(this, el, root));

            root.template = this._parser.getOuterHTML(el);

            return root;
        },

        _prepare: function (element, coder) {
            var nodeContext = {
                compiler: this,
                element: element,
                compile: function (node) {
                    if (!node) throw "Node is null";
                    var el;
                    if (this.compiler._parser.isText(node)) {
                        el = this.compiler._parser.createElement('span');
                        this.compiler._parser.appendChild(el, node);
                    } else {
                        el = node;
                    }
                    return this.compiler._compile(el);
                },
                getChildrenByPrefix: function (prefix) {
                    var children = this.compiler._parser.getChildrenElements(this.element);
                    return children.filter(function (el) {
                        return el.name.indexOf(prefix) == 0;
                    });
                },
                getChildrenByTagName: function (name) {
                    var children = this.compiler._parser.getChildrenElements(this.element);
                    return children.filter(function (el) {
                        return el.name == name;
                    });
                },
                findChild: function (el) {
                    var children = this.compiler._parser.getChildren(el);
                    if (children.length == 1) {
                        return children[0];
                    } else {
                        return this.compiler._parser.findOneChild(children);
                    }
                },
                get: function (name) {
                    return this.compiler._parser.getAttributeValue(this.element, name);
                }
            };

            return coder.code(nodeContext);
        },

        run: function () {
            return this._compile(this._parser.findOneChild());
        },

        getText: function () {
            var result = JSON.stringify(this.run());
//        console.log('Compiler: Template serialization: ', result);
            return  result;
        }
    });

    return Coder;
}));