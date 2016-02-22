/**
 * Created by guntars on 02/02/2016.
 */
define('templating/utils/List',[],function () {
    'use strict';
    class List {
        constructor(items) {
            this._map = new Map(items);
            this._indexes = [...this._map.keys()]
        };

        keys() {
            return this._indexes;
        };

        values() {
            return [...this._map.values()];
        };

        entries() {
            return this._indexes.map((key)=> {
                return [key, this._map.get(key)]
            })
        };

        get(key) {
            return this._map.get(key);
        };

        getIndex(key) {
            return this._indexes.indexOf(key);
        };

        getValueByIndex(index) {
            return this._map.get(this._indexes[index]);
        };
        getKeyByIndex(index) {
            return this._indexes[index];
        };

        set(key, value, index) {
            this._map.set(key, value);
            if (index!==undefined) {
                this._indexes.splice(index, 0, key);
            } else {
                this._indexes.push(key);
            }
        };

        has(key) {
            return this._map.has(key);
        };

        clear() {
            this._map.clear();
            this._indexes.splice(0, this._indexes.length);
        }

        delete(key) {
            this._map.delete(key);
            this._indexes.splice(this._indexes.indexOf(key), 1);
        };

        deleteByIndex(index) {
            var key = this._indexes.splice(index, 1)[0];
            this._map.delete(key);
        }

        get size() {
            return this._map.size
        };
    }
    return List;
});
/**
 * Created by guntars on 10/10/2014.
 */
    //## widget/dom Class for dom manipulation
define('templating/dom',[],function () {
    'use strict';

    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

    function createPlaceholder(tag) {
        var placeholder = document.createElement(tag || 'div');
        placeholder.setAttribute('style', 'display:none;');
        return placeholder;
    }

    // ## widget/dom.Element
    //     @method Element
    //     @param {Object} node
    class Element {
        constructor(el, node) {
            let data = node.data;
            this._events = [];
            this._node = node;
            this.el = el;
            this.name = node.name;
            if (data) {
                if (data.bind) {
                    this.bind = data.bind;
                }
                if (data.data) {
                    this.data = data.data;
                }
            }
        };

        clone(...args) {
            return this.run(...args);
        };

        // Shortcut to - `dom.text`
        text(text) {
            dom.text(this, text);
        };

        detach() {
            dom.detach(this);
        };

        attach() {
            dom.attach(this);
        };

        // Shortcut to - `dom.setAttribute`
        setAttribute(prop, value) {
            dom.setAttribute(this, prop, value);
        };

        // Shortcut to - `dom.getAttribute`
        getAttribute(prop) {
            return dom.getAttribute(this, prop);
        };

        // Shortcut to - `dom.removeAttribute`
        removeAttribute(prop) {
            dom.removeAttribute(this, prop);
        };

        // Shortcut to - `dom.setStyle`
        setStyle(prop, value) {
            dom.setStyle(this, prop, value);
        };

        // Shortcut to - `dom.getStyle`
        getStyle(prop) {
            return dom.getStyle(this, prop);
        }

        // Shortcut to - `dom.removeStyle`
        removeStyle(prop) {
            dom.removeStyle(this, prop);
        };

        // Shortcut to - `dom.addClass`
        addClass(className) {
            dom.addClass(this, className);
        };

        // Shortcut to - `dom.hasClass`
        hasClass(className) {
            return dom.hasClass(this, className);
        };

        // Shortcut to - `dom.removeClass`
        removeClass(className) {
            dom.removeClass(this, className);
        };

        // Shortcut to - `dom.val`
        val(val) {
            return dom.val(this, val);
        };

        // Shortcut to - `dom.on`
        on(event, cb, context) {
            var args = Array.prototype.slice.call(arguments, 0);
            return dom.on.apply(false, [this].concat(args));
        };

        // Shortcut to - `dom.onDOMAttached`
        onDOMAttached() {
            return dom.onDOMAttached(this);
        };

        // Shortcut to - `dom.remove`
        remove() {
            dom.remove(this);
        };
    }
    ;

    var dom = {
        //Removing element from DOM
        //
        //      @method detach
        //      @param {dom.Element}

        detach:          function (node) {
            if (node.placeholder instanceof HTMLElement === false) {
                node.placeholder = createPlaceholder(node._node.data.tag || node.el.tagName);
            }
            if (node && node.el && node.el.parentNode) {
                node.el.parentNode.replaceChild(node.placeholder, node.el)
            }
        },
        //Adding element back to DOM
        //
        //      @method attach
        //      @param {dom.Element}
        attach:          function (node) {
            if (node && node.el && node.placeholder && node.placeholder.parentNode) {
                node.placeholder.parentNode.replaceChild(node.el, node.placeholder)
            }
        },
        // Adding text in to node
        //
        //      @method text
        //      @param {dom.Element}
        //      @param {String} text
        text:            function (node, text) {
            if (node && node.el) {
                node.el.innerHTML = text;
            }
        },
        // Setting Attribute in to node
        //
        //      @method setAttribute
        //      @prop {dom.Element} node
        //      @prop {String||Object} prop
        //      @prop {String} value
        setAttribute:    function (node, prop, value) {
            if (node && node.el) {
                if (isObject(prop)) {
                    Object.keys(prop).forEach(function (key) {
                        node.el.setAttribute(key, prop[key]);
                    }.bind(this));
                } else {
                    node.el.setAttribute(prop, value);
                }
            }
        },
        // Getting Attribute in to node
        //
        //      @method getAttribute
        //      @prop {dom.Element} node
        //      @prop {String||Object} prop
        //      @return {String} value
        getAttribute:    function (node, prop) {
            if (node && node.el) {
                return node.el.getAttribute(prop);
            } else {
                return undefined;
            }
        },
        // Removing Attribute from node
        //
        //      @method removeAttribute
        //      @prop {dom.Element} node
        //      @prop {String} prop
        removeAttribute: function (node, prop) {
            if (node && node.el) {
                node.el.removeAttribute(prop);
            }
        },
        // Setting css style in to node
        //
        //      @method setStyle
        //      @prop {dom.Element} node
        //      @prop {String||Object} prop
        //      @prop {String} value
        setStyle:        function (node, prop, value) {
            if (node && node.el) {
                if (isObject(prop)) {
                    Object.keys(prop).forEach(function (key) {
                        node.el.style[key] = prop[key];
                    }.bind(this));
                } else {
                    node.el.style[prop] = value;
                }
            }
        },
        // Getting css style from node
        //
        //      @method getStyle
        //      @prop {dom.Element} node
        //      @prop {String} prop
        //      @return {String} value
        getStyle:        function (node, prop) {
            if (node && node.el) {
                if (node.el !== undefined && node.el.style !== undefined) {
                    return node.el.style[prop];
                } else {
                    return undefined;
                }
            }
        },
        // Removing css style from node
        //
        //      @method removeAttribute
        //      @prop {dom.Element} node
        //      @prop {String} prop
        removeStyle:     function (node, prop) {
            if (node && node.el) {
                node.el.style[prop] = '';
            }
        },
        // Adding class in to node
        //
        //      @method addClass
        //      @param {dom.Element} node
        //      @param {String} className
        addClass:        function (node, className) {
            if (node && node.el) {
                node.el.classList.add(className);
            }
        },
        // checking if className exists in node
        //
        //      @method hasClass
        //      @param {dom.Element} node
        //      @param {String} className
        //      @return boolean
        hasClass:        function (node, className) {
            if (node && node.el) {
                return node.el.classList.contains(className);
            } else {
                return false;
            }
        },
        // Remove class from node
        //
        //      @method removeClass
        //      @param {dom.Element} node
        //      @param {string} className
        removeClass:     function (node, className) {
            if (node && node.el) {
                node.el.classList.remove(className);
            }
        },
        // Setting, Getting value to input element
        //
        //      @method val
        //      @param {dom.Element} node
        //      @param? {String} val
        //      @return {String}
        val:             function (node, val) {
            if (node && node.el) {
                var el = node.el;
                if (val !== undefined) {
                    el.value = val;
                } else {
                    return el.value;
                }
            }
        },
        // Adding DOM Event in to Element
        //
        //      @method on
        //      @param {dom.Element} element
        //      @param {String} ev
        //      @param {Function} cb
        //      @param {Object} context
        //      @return {Object} { remove() }
        on:              function (element, ev, cb, context, ...args) {
            var el = element.el,
                events = ev.split(' '),
                fn = (e) => {
                    cb.apply(context || this, [e, element].concat(args));
                };

            events.forEach(function (event) {
                el.addEventListener(event, fn);
            });
            var evt = {
                remove: () => {
                    events.forEach(event => el.removeEventListener(event, fn));
                    let evts = element._events;
                    evts.splice(evts.indexOf(evt), 1);
                }
            };
            element._events.push(evt);
            return evt
        },
        // Remove Dom Element from Dom
        //
        //      @method remove
        //      @param {dom.Element}
        remove:          function (el) {
            while (el._events.length > 0) {
                el._events.shift().remove();
            }
            if (el.el !== undefined) {
                if (el.el.remove) {
                    el.el.remove();
                } else if (el.el.parentNode) {
                    el.el.parentNode.removeChild(el.el);
                }
            }
        },
        // executes when element attached to Dom
        //
        //      @method onDOMAttached
        //      @param {dom.Element}
        //      @param {function} cb
        //      @param {function} context
        onDOMAttached:   function (el) {
            let handlers = [],
                attached = false,
                step;

            if (el.el !== undefined) {
                step = () => {
                    if (attached) {
                        while (handlers.length > 0) {
                            handlers.shift()();
                        }
                    } else {
                        window.requestAnimationFrame(step);
                        if (document.body.contains(el.el)) {
                            attached = true;
                        }
                    }
                };
            }
            return {
                then: (cb, context) => {
                    handlers.push(cb.bind(context || this));
                    window.requestAnimationFrame(step);
                }
            }
        },
        // Element
        Element:         Element
    }


    return dom;
});
/**
 * Created by guntars on 22/01/2016.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('templating/DomFragment',factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    }
}(this, function () {
    'use strict';
    class DomFragment {
        constructor(_node, placeholder, childNodes, elGroup, index, obj) {
            Object.assign(this, {
                _node,
                childNodes,
                placeholder,
                elGroup,
                index,
                obj
            });
            return this.render();
        };

        applyAttributes(el) {
            let attributes = this._node.data.attribs;
            Object.keys(attributes).forEach(function (key) {
                el.setAttribute(key, attributes[key]);
            });
        };

        applyFragment(el) {
            let node = this._node;
            let plFragment = node.template();
            if (plFragment !== undefined) {
                while (plFragment.childNodes.length > 0) {
                    el.appendChild(plFragment.childNodes[0]);
                }
            }
        };

        appendToBody(el) {
            let elGroup = this.elGroup,
                placeholder = this.placeholder,
                size = elGroup.size;

            if (size > 0) {
                let index = (this.index === undefined || this.index > size - 1) ? size - 1 : this.index - 1,
                    target = elGroup.keys()[index !== -1 ? index : 0],
                    parentNode = target.parentNode;

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
        };


        render() {
            let placeholder = this.placeholder,
                node = this._node,
                keep = (!placeholder.id && this.elGroup.size === 0),
                instance = node.tmpEl((keep) ? placeholder : false, this.obj, this.childNodes, node),
                el = instance.el;

            if (!keep && !node.replace) {
                this.applyAttributes(el);
            } else if (!node.replace) {
                el.innerHTML = '';
            }

            if (!node.replace) {
                this.applyFragment(el);
            }

            this.appendToBody(el);

            if (this.childNodes && this.childNodes.runAll && node.parse) {
                this.childNodes.runAll(el);
            }

            return instance;

        }
    }
    return DomFragment;
}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('templating/Decoder',['./utils/List', './dom', './DomFragment'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./utils/List'), require('./dom'), require('./DomFragment'));
    }
}(this, function (List, dom, DomFragment) {
    'use strict';
    var _decoders = {};


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

        renderFragment(template) {
            var el = document.createElement('template');
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

        renderTemplate(children, fragment, obj) {
            let resp = {},
                _runAll = [];
            Object.keys(children).forEach((name) => {
                let child = children[name],
                    elGroup = new List();
                if (child.template) {
                    let run = (force, index)=> {
                        let childNodes;
                        if (!child.noAttach || force) {
                            if (child.children) {
                                childNodes = this.renderTemplate(child.children, fragment, obj);
                            }

                            if (force instanceof HTMLElement === true) {
                                fragment = force;
                            }
                            let placeholder = fragment.querySelector('#' + child.id) || fragment;

                            let element = new DomFragment(child, placeholder, childNodes, elGroup, index, obj);

                            if (childNodes) {
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
                        run,
                        elGroup
                    };

                } else {
                    let element = new dom.Element(fragment.querySelector('#' + child.id), child);
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
                children:   this.renderTemplate(this.children, fragment, obj || {}).runAll(),
                templateId: this._root.templateId
            };
        };
    }


    return Decoder;

}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/component/cpDecoder',[
            'templating/Decoder'
        ], factory)
        ;
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'));
    }
}(this, function (Decoder) {
    'use strict';
    var componentDecoder = {
        tagName: 'cp',
        decode:  function (node) {
            var data = node.data;
            var response = {
                name:    data.name,
                replace: true,
                tmpEl:   function (placeholder, obj, children, node) {
                    var instance = new data.src(data.data, children, obj, node);
                    return instance;
                },
                data:    data || {}
            };
            if (data.data.bind !== undefined) {
                response.bind = data.data.bind;
            }
            return response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;

}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/placeholders/plDecoder',[
            'templating/Decoder',
            'templating/dom'
        ], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./dom'));
    }
}(this, function (Decoder, dom) {
    'use strict';
    var componentDecoder = {
        tagName: 'pl',
        decode:  function (node) {

            var data = node.data;
            return {
                name:  data.name,
                tmpEl: function (el, obj, children, node) {
                    return new dom.Element(el || document.createElement(data.tag), node);
                },
                parse: true,
                data:  data
            };
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;

}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/databind/bdDecoder',[
            'templating/Decoder',
            'templating/dom'
        ], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./dom'));
    }
}(this, function (Decoder, dom) {
    'use strict';

    var bindingsDecoder = {
        tagName:  'bd',
        noAttach: true,
        decode:   function (node) {
            var data = this.data = node.data;
            var response = {
                name:  data.name,
                tmpEl: function (el, obj, children, node) {
                    return new dom.Element(el || document.createElement(data.tag), node);
                },
                data:  data
            };

            return response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(bindingsDecoder);
    }

    return bindingsDecoder;

}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/router/routerDecoder',[
            'templating/Decoder',
            'templating/dom'
        ], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./dom'));
    }
}(this, function (Decoder, dom) {
    'use strict';
    var componentDecoder = {
        tagName:  'rt',
        noAttach: true,
        decode:   function (node) {
            var data = node.data;
            var response = {
                name:  data.name,
                tmpEl: function (el, obj, children, node) {
                    return new dom.Element(el || document.createElement(data.tag), node);
                },
                parse: true,
                data:  data || {},
            };
            return response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;

}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/style/styleDecoder',[
            'templating/Decoder'
        ], factory)
        ;
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'));
    }
}(this, function (Decoder) {
    'use strict';
    var styleDecoder = {
        tagName: 'style',
        decode:  function (node) {
            if (node.data.styleAttached === undefined) {
                node.data.styleAttached = true;
                var style = document.createElement('style');
                style.innerHTML = node.data.style;
                document.head.appendChild(style);
            }

        }
    };

    if (Decoder) {
        Decoder.addDecoder(styleDecoder);
    }

    return styleDecoder;

}));
