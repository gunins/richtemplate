(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
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
        root.Templating.Coder = factory(root.Templating.utils);
    }
}(this, function (utils) {


    function applyCoder(element, root, coder) {
        if (element.name.split('-')[0] == coder.tagName) {
         console.log(element.name, coder.tagName)
            var children = this._parser.getChildren(element),
                placeholder = this._parser.createElement('div');

            if (children && children.length > 0) {
                children.forEach(function (child) {
                    this._parser.appendChild(placeholder, child);
                }.bind(this));
            }

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

    }

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
    function parseChildren(el, root) {
        var children = this._parser.getChildren(el);
        if (children && children.length > 0) {
            children.forEach(function (child) {
                parseChildren.call(this, child, root)
                if (!this._parser.isText(child)) {
                    _coders.forEach(applyCoder.bind(this, child, root));
                }
            }.bind(this))
        }
    }

    utils.merge(Coder.prototype, {
        addCoder: Coder.addCoder,
        _compile: function (el) {
            var root = {};
            parseChildren.call(this, el, root);

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
                getChildren: function () {
                    return this.compiler._parser.getChildrenElements(this.element);
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