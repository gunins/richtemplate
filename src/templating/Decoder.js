(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define(['./utils/List'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./utils/List'));
    }
}(this, function (List) {
    var _decoders = {};

    function renderFragment(template) {
        var el = document.createElement('template');
        el.innerHTML = template;
        return el.content.firstChild;
    }


    class Element {
        constructor(node, placeholder, childNodes, els, index, obj) {
            Object.assign(this, {
                _node: node,
                       childNodes,
                       placeholder,
                       els,
                       index,
                _obj:  obj
            });
            return this.render();
        };

        getInstance() {
            return this;
        };

        applyAttach() {
            delete this.noAttach;
        };

        set placeholder(placeholder) {
            this._placeholder = placeholder;
        };

        get placeholder() {
            return this._placeholder;
        };

        get obj() {
            return this._obj;
        }


        render() {
            var data = this.obj,
                els = this.els,
                placeholder = this.placeholder,
                params = this._node,
                keep = (!placeholder.id && els.size === 0),
                instance = params.tmpEl((keep) ? placeholder : false, data, this.childNodes),
                el = instance.el,
                attributes = params.data.attribs;

            if (!keep && !params.replace) {
                Object.keys(attributes).forEach(function (key) {
                    el.setAttribute(key, attributes[key]);
                });

            } else if (!params.replace) {
                el.innerHTML = '';
            }

            if (!params.replace) {
                let plFragment = renderFragment(params.template, params.data.tag);
                if (plFragment !== undefined) {
                    while (plFragment.childNodes.length > 0) {
                        el.appendChild(plFragment.childNodes[0]);
                    }
                }
            }

            var size = els.size;
            if (size > 0) {
                let index = (this.index === undefined || this.index > size - 1) ? size - 1 : this.index - 1;

                let target = els.keys()[index !== -1 ? index : 0];
                let parentNode = target.parentNode;
                if (index === -1) {
                    parentNode.insertBefore(el, target);
                }
                else if (target.nextSibling !== null) {
                    parentNode.insertBefore(el, target.nextSibling);
                } else {
                    parentNode.appendChild(el);
                }

            } else {
                let parentNode = placeholder.parentNode;
                if (parentNode) {
                    parentNode.replaceChild(el, placeholder);
                }
            }

            //this.el = el;
            if (this.childNodes && params.parse) {
                this.childNodes.runAll(el);
            }
            return instance;

        }
    }
    ;


    function parseElements(nodeList) {
        var context = {};
        nodeList.forEach((node) => {
            let name = node.data.name;
            var tagName = node.tagName;
            if (tagName) {
                let decodedData = _decoders[tagName].decode(node);
                if (decodedData) {
                    let nodeParams = {
                        name:     decodedData.name,
                        data:     decodedData.data,
                        tmpEl:    decodedData.tmpEl,
                        parse:    decodedData.parse,
                        replace:  decodedData.replace,
                        id:       node.id,
                        template: node.template,
                        noAttach: _decoders[tagName].noAttach || node.data.tplSet.noattach
                    };
                    if (node.children &&
                        node.children.length > 0) {
                        nodeParams.children = parseElements(node.children);
                    }
                    context[name] = nodeParams;
                }
            } else if (name) {
                context[name] = {
                    id:   node.id,
                    data: node.data
                };
            }
        });
        return context;
    };


    function renderTemplate(children, fragment, obj) {
        let resp = {},
            _runAll = [];
        Object.keys(children).forEach((name) => {
            let child = children[name],
                els = new List();
            if (child.template) {
                let run = (force, index)=> {
                    let childNodes;
                    if (!child.noAttach || force) {
                        if (child.children) {
                            childNodes = renderTemplate(child.children, fragment, obj);
                        }

                        if (force instanceof HTMLElement === true) {
                            fragment = force;
                        }
                        let placeholder = fragment.querySelector('#' + child.id) || fragment;

                        let element = new Element(child, placeholder, childNodes, els, index, obj);

                        if (childNodes) {
                            element.children = childNodes;
                        }
                        els.set(element.el, element);
                        return element;
                    }

                }
                _runAll.push(run);
                resp[name] = {
                    run,
                    els
                };

            } else {
                let element = fragment.querySelector('#' + child.id);
                element.removeAttribute('id');
                els.set(element, {el: element})
                resp[name] = {
                    els: els
                }
            }
        });

        Object.defineProperty(resp, 'runAll', {
            enumerable: false,
            value:      (el)=> {
                _runAll.forEach(run=>run(el));
                return resp;
            }
        });

        return resp;
    }

    /**
     *
     * @constructor
     * @param root
     */
    class Decoder {
        static   addDecoder(decoder) {
            if (_decoders[decoder.tagName] === undefined) {
                _decoders[decoder.tagName] = decoder;
            }
        }

        constructor(root) {
            this._root = (typeof root === 'string') ? JSON.parse(root) : root;
            if (root.children && root.children.length > 0) {
                this.children = parseElements(root.children);
            }
        }

        _renderFragment(root, obj) {
            obj = obj || {};
            var fragment = renderFragment(root.template);

            return {
                fragment:   fragment,
                children:   renderTemplate(this.children, fragment, obj).runAll(),
                templateId: root.templateId
            };
        }

        render(data) {
            var fragment = this._renderFragment(this._root, data);
            return fragment;
        }
    }


    return Decoder;

}));