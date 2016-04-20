(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define(['./utils/List', './dom', './DomFragment'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./utils/List'), require('./dom'), require('./DomFragment'));
    }
}(this, function(List, dom, DomFragment) {
    'use strict';
    var _decoders = {};

    function isObject(obj) {
        return obj === Object(obj);
    }

    function isArray(obj) {
        return (Array.isArray) ? Array.isArray(obj) : toString.call(obj) === '[object Array]';
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
                this.children = this._parseElements(root.children);
            }
        }

        renderFragment(template, tag) {
            let el = document.createElement('template');
            if (el.content === undefined) {
                if (tag === 'td') {
                    el = document.createElement('tr');
                } else if (tag === 'tr') {
                    el = document.createElement('tbody');
                }
            }
            el.innerHTML = template;
            return (el.content !== undefined) ? el.content.firstChild : el.firstChild;
        };

        _parseElements(nodeList) {
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
                            template: ()=> {
                                return this.renderFragment(node.template, node.data.tag)
                            },
                            noAttach: _decoders[tagName].noAttach || node.data.tplSet.noattach
                        };
                        if (node.children &&
                            node.children.length > 0) {
                            nodeParams.children = this._parseElements(node.children);
                        }
                        context[name] = nodeParams;
                    }
                } else if (name) {
                    context[name] = {
                        id:   node.id,
                        data: node.data,
                              name
                    };
                }
            });
            return context;
        };

        renderTemplate(childNodes = {}, obj = {}, fragment) {
            let resp = {},
                _runAll = [];
            Object.keys(childNodes).forEach((name) => {
                let childFragment = fragment,
                    child = childNodes[name],
                    children = child.children,
                    elGroup = new List(),
                    placeholder = document.createElement(child.data.tplSet.tag || 'div');
                placeholder.setAttribute('style', 'display:none;');
                placeholder.id = child.id;
                elGroup.onDelete((key, size)=> {
                    if (size === 0 && key.parentNode) {
                        key.parentNode.replaceChild(placeholder, key);
                        childFragment = ()=>placeholder;
                    }
                })
                if (child.template) {
                    let run = (force, index)=> {
                        let template = childFragment();
                        if (force instanceof HTMLElement === true) {
                            template = force;
                        }

                        let childNodes,
                            data = (template !== force) && (isObject(force) || isArray(force)) ? force : obj;
                        if (!child.noAttach || force) {
                            let placeholder = template.querySelector('#' + child.id) || template;

                            if (children) {
                                childNodes = this.renderTemplate(children, data, ()=> {
                                    return template;
                                });
                            }
                            let element = new DomFragment(child, placeholder, childNodes, elGroup, index, data);

                            template = element.el;


                            if (childNodes && childNodes.runAll && child.parse) {
                                childNodes.runAll();
                            }

                            if (childNodes && !element.children) {
                                element.children = childNodes;
                            }
                            element.elGroup = elGroup;
                            element.run = run;
                            elGroup.set(element.el, element, index);
                            return element;
                        }

                    }
                    _runAll.push(run);
                    resp[name] = {
                        data: child.data,
                              run,
                              elGroup
                    };

                } else {
                    let element = new dom.Element(childFragment().querySelector('#' + child.id), child);
                    element.removeAttribute('id');
                    element.elGroup = elGroup;
                    elGroup.set(element.el, element);
                    resp[name] = element;
                }
            });
            let setProp = (obj, name, fn) => {
                Object.defineProperty(obj, name, {
                    enumerable: false,
                    value:      fn
                });
            };

            let runAll = (el)=> {
                _runAll.forEach(run=> run(el));
                return resp;
            };

            setProp(resp, 'runAll', runAll);

            return resp;
        };

        render(obj) {
            var fragment = this.renderFragment(this._root.template);
            return {
                fragment:   fragment,
                children:   this.renderTemplate(this.children, obj, ()=> fragment).runAll(),
                templateId: this._root.templateId
            };
        };
    }


    return Decoder;

}));