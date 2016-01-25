(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./DOMParser'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./DomParser'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.Coder = factory(root.Templating.utils);
    }
}(this, function (DOMParser) {
    'use strict';
    var templId = 0,
        _coders = [],
        tagId = 0;

    function applyCoder(el) {
        var parsed = false,
            tmpType = this._parser.getAttributeValue(el, 'tp-type') || el.name.split('-')[0];

        _coders.forEach((coder) => {
            if (tmpType === coder.tagName && !parsed) {
                var node = this._prepare(el);
                var data = node.data;
                var nodeContext = node.nodeContext;
                var tag = data.tag = (el.name.split('-')[0] !== coder.tagName) ? el.name : data.tplSet.tag ? data.tplSet.tag : 'div',
                    children = this._parser.getChildren(el),
                    placeholder = this._parser.createElement(tag),
                    holder = this._parser.createElement(tag);

                if (children && children.length > 0) {
                    children.forEach((child)=> {
                        this._parser.appendChild(holder, child);
                    });
                }
                if (!coder.noTag) {
                    var id = 'e' + tagId++;
                    this._parser.setAttributeValue(placeholder, 'id', id);
                    this._parser.setAttributeValue(placeholder, 'style', 'display:none');
                    this._parser.replaceElement(el, placeholder);
                } else {
                    this._parser.removeElement(el);
                }


                coder.code(nodeContext, data);

                parsed = {
                    id:       id,
                    tagName:  coder.tagName,
                    data:     data,
                    template: this._parser.getOuterHTML(holder)
                };
            }
        });

        return parsed;
    }


    function parseChildren(el) {

        if (!this._parser.isText(el)) {
            var classList = this._parser.getAttributeValue(el, 'class') || '';
            this._parser.setAttributeValue(el, 'class', (this.templateId + ' ' + classList).trim());
        }
        var context,
            parsed = false,
            children,
            childEl = this._parser.getChildren(el);
        if (childEl && childEl.length > 0) {
            childEl.forEach(function (child) {
                if (!this._parser.isText(child)) {

                    children = parseChildren.call(this, child);
                    if (child.type !== 'comment') {
                        parsed = applyCoder.call(this, child);
                    } else {
                        this._parser.removeElement(child);
                    }

                    if (parsed || children) {
                        context = context || [];
                    }
                    if (parsed) {
                        context.push(parsed);
                        if (children !== undefined) {
                            parsed.children = children;
                        }
                    }
                    else if (children && children.length > 0) {
                        context = context.concat(children)
                    }
                    if (!parsed) {
                        var name = this._parser.getAttributeValue(child, 'tp-name');
                        if (name !== undefined) {
                            context = context || [];
                            this._parser.setAttributeValue(child, 'tp-name', undefined);
                            var id = 'e' + tagId++;
                            this._parser.setAttributeValue(child, 'id', id);
                            context.push({
                                id:   id,
                                data: {
                                    name: name
                                }
                            });
                        }
                    }

                }
            }.bind(this))
        }

        return context;
    }

    function setDataFromAttributes(attributes) {
        var dataset = {},
            tplSet = {},
            attribs = {};

        Object.keys(attributes).forEach((key) => {
            let subKeys = key.split('-'),
                attrib = attributes[key];
            if (['data', 'tp'].indexOf(subKeys[0]) !== -1 && subKeys.length > 1) {
                let data = (subKeys.length > 2) ? {[subKeys[2]]: attrib} : attrib;
                if (subKeys[0] === 'data') {
                    dataset[subKeys[1]] = data;
                } else {
                    tplSet[subKeys[1]] = data;
                }
            } else {
                attribs[key] = attrib;
            }
        });

        return {
            dataset, tplSet, attribs
        }

    }

    function setContext(compiler, element) {
        return {
            //element:  element,
            //compiler: compiler,
            compile: function (node) {
                if (!node) throw "Node is null";
                var el;
                if (compiler._parser.isText(node)) {
                    el = compiler._parser.createElement('span');
                    compiler._parser.appendChild(el, node);
                } else {
                    el = node;
                }
                return compiler._compile(el);
            },
            getInnerHTML(){
                return compiler._parser.getInnerHTML(element)
            },
            getChildrenByPrefix (prefix) {
                var children = compiler._parser.getChildrenElements(element);
                return children.filter(function (el) {
                    return el.name.indexOf(prefix) == 0;
                });
            },
            getChildrenByTagName (name) {
                var children = compiler._parser.getChildrenElements(element);
                return children.filter(function (el) {
                    return el.name == name;
                });
            },
            getChildren () {
                return compiler._parser.getChildrenElements(element);
            },
            findChild (el) {
                var children = compiler._parser.getChildren(el);
                if (children.length == 1) {
                    return children[0];
                } else {
                    return compiler._parser.findOneChild(children);
                }
            },
            removeChildren () {
                var children = element.children;
                if (children.length > 0) {
                    children.forEach(function (child) {
                        compiler._parser.removeElement(child);
                    }.bind(this));
                }
            },
                     get parser() {
                         return compiler._parser;
                     },
                     get templateId() {
                         return compiler.templateId;
                     },
                     get url() {
                         return compiler.url;
                     },
                     get attribs() {
                         return element.attribs;
                     },
                     get name() {
                         return element.name;
                     },
                     get children() {
                         return element.children;
                     },
            get (name) {
                return compiler._parser.getAttributeValue(element, name);
            },
            set (name, value) {
                return compiler._parser.setAttributeValue(element, name, value);
            }

        };
    }

    /**
     *
     * @constructor
     * @param dOMParser
     */
    class Coder {
        static    addCoder(coder) {
            if (_coders.indexOf(coder) === -1) {
                _coders.push(coder);
            }
        }

        constructor(content) {
            this._parser = new DOMParser(content);

        }

        _compile() {
            let el = this._parser.findOneChild();
            return {
                children:   parseChildren.call(this, el),
                template:   this._parser.getOuterHTML(el),
                templateId: this.templateId
            };
        }

        _setData(nodeContext) {
            let resp = setDataFromAttributes(nodeContext.attribs);
            return resp;
        }

        _prepare(element) {
            let nodeContext = setContext(this, element),
                data = this._setData(nodeContext);
            return {nodeContext, data};
        }

        run(url) {
            this.url = url;
            this.templateId = 'tid_' + new Date().valueOf() + templId;
            templId++;
            return this._compile();
        }

        getText() {
            return JSON.stringify(this.run());
            ;
        }
    }
    /*    Object.assign(Coder.prototype, {
     //addCoder: Coder.addCoder,

     });*/

    return Coder;
}));