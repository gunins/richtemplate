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

    function applyCoder(element) {
        var parsed = false;
        _coders.forEach(function (coder) {
            if (element.name.split('-')[0] == coder.tagName && !parsed) {
                var children = this._parser.getChildren(element),
                    placeholder = this._parser.createElement(this._parser.getAttributeValue(element,'tp-type') || 'div');

                if (children && children.length > 0) {
                    children.forEach(function (child) {
                        this._parser.appendChild(placeholder, child);
                    }.bind(this));
                }

                var id = 'e' + c++;

                this._parser.setAttributeValue(placeholder, 'id', id);
                this._parser.replaceElement(element, placeholder);

                parsed = {
                    id: id,
                    tagName: coder.tagName,
                    data: this._prepare(element, coder)
                };
            }
        }.bind(this));
        return parsed;
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
            if (_coders.indexOf(coder) === -1) {
                _coders.push(coder);
            }
        }
    });
    function parseChildren(el) {
        var context = {},
            parsed = false,
            children,
            childEl = this._parser.getChildren(el);
        if (childEl && childEl.length > 0) {
            childEl.forEach(function (child) {
                if (!this._parser.isText(child)) {
                    children = parseChildren.call(this, child);
                    parsed = applyCoder.call(this, child);
                    if (parsed || children) {
                        context.elements = context.elements || [];
                    }
                    if (parsed) {
                        context.elements.push(parsed);
                        if (children !== undefined) {
                            parsed.children = children;
                        }
                    }
                    else if (children && children.elements) {
                        context.elements = context.elements.concat(children.elements)
                    }

                }
            }.bind(this))
        }

        return context;
    }

    utils.merge(Coder.prototype, {
        addCoder: Coder.addCoder,
        _compile: function (el) {
            return{
                children: parseChildren.call(this, el),
                template: this._parser.getOuterHTML(el)
            };
        },
        _setData: function (nodeContext) {
            var dataset = {},
                tplSet = {},
                attributes = {},
                attribs = nodeContext.element.attribs;

            Object.keys(attribs).forEach(function (key) {
                if (key.indexOf('data-') == 0 && key.length > 5) {
                    dataset[key.substr(5)] = attribs[key];
                } else if (key.indexOf('tp-') == 0 && key.length > 3) {
                    tplSet[key.substr(3)] = attribs[key];
                }
                else {
                    attributes[key] = attribs[key];
                }
            });

            return {
                tplSet: tplSet,
                dataset: dataset,
                attribs: attributes
            };
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
            var data = this._setData(nodeContext);
            coder.code(nodeContext, data);

            return data;
        },

        run: function () {
            return this._compile(this._parser.findOneChild());
        },

        getText: function () {
            var result = JSON.stringify(this.run());
            return  result;
        }
    });

    return Coder;
}));