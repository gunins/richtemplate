/**
 * Created by guntars on 02/02/2016.
 */
define('templating/utils/List',[],function () {
    'use strict';
    class List {
        constructor(items) {
            this._map = new Map(items);
            this._indexes = [...this._map.keys()];
            this._onDelete = [];
        };

        keys() {
            return this._indexes;
        };

        values() {
            return this.entries().map((entry)=> {
                return entry[1];
            })
        };

        entries() {
            return this._indexes.map((key)=> {
                return [key, this._map.get(key)]
            })
        };

        get(key) {
            return this._map.get(key);
        };

        forEach(fn) {
            return this.values().forEach((value, index, ...args)=> {
                return fn.apply(null, [value, index, ...args]);
            })
        };

        getIndex(key) {
            return this._indexes.indexOf(key);
        };

        changeIndex(key, index) {
            if (key) {
                let indexes = this._indexes,
                    indexOf = indexes.indexOf(key);

                if (indexOf !== -1 && index !== indexOf) {
                    this._indexes.splice(index, 0, this._indexes.splice(indexOf, 1)[0]);
                }
            }
        };

        getValueByIndex(index) {
            return this._map.get(this._indexes[index]);
        };

        get first() {
            return this.getValueByIndex(0);
        };

        get last() {
            return this.getValueByIndex(this._indexes.length - 1);
        };

        getKeyByIndex(index) {
            return this._indexes[index];
        };

        set(key, value, index) {
            this._map.set(key, value);
            if (index !== undefined) {
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
        };

        onDelete(cb) {
            let chunk = (...args)=>cb(...args);
            this._onDelete.push(chunk);
            return {
                remove(){
                    this._onDelete.splice(this._onDelete.indexOf(chunk, 1));
                }
            }
        };

        delete(key) {
            if (this.has(key)) {
                let item = this._map.get(key);
                this._map.delete(key);
                this._indexes.splice(this._indexes.indexOf(key), 1);
                this._onDelete.forEach(chunk=>chunk(key, this.size, item));
            }
        };

        deleteByIndex(index) {
            this.delete(this._indexes[index]);
        };

        get size() {
            return this._map.size
        };

    }
    return List;
});
/**
 * Created by guntars on 10/10/2014.
 */
//## templating/dom Class for dom manipulation
define('templating/dom',[],function() {
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

    function destroy(instance) {
        let keys = Object.keys(instance);
        if (keys.length > 0) {
            keys.forEach((key)=> {
                if (key !== 'root') {
                    let children = instance[key];
                    if (children.elGroup !== undefined && children.elGroup.size > 0) {
                        children.elGroup.forEach(child=> {
                            if (child !== undefined && child.remove !== undefined) {
                                child.remove(true);
                            }
                        })
                    }
                }
            });
        }
    }

    // ## widget/dom.Element
    //     @method Element
    //     @param {Object} node
    class Element {
        constructor(el, node) {
            this.el = el;
            this._events = [];
            //this._node = node;
            this.name = node.name || node.data.name;
            let data = this.data = node.data;
            if (data) {
                if (data.bind) {
                    this.bind = data.bind;
                }
                /* if (data.dataset) {
                 this.dataset = data.dataset;
                 }*/
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

        // Shortcut to - `dom.changePosition`
        changePosition(index) {
            dom.changePosition(this, index);
        }

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
        remove(force) {
            dom.remove(this, force);
        };
    }

    var dom = {
        //Removing element from DOM
        //
        //      @method detach
        //      @param {dom.Element}

        detach (node) {
            if (node.placeholder instanceof HTMLElement === false) {
                node.placeholder = createPlaceholder(node.data.tag || node.el.tagName);
            }
            if (node && node.el && node.el.parentNode) {
                node.el.parentNode.replaceChild(node.placeholder, node.el)
            }
        },
        //Adding element back to DOM
        //
        //      @method attach
        //      @param {dom.Element}
        attach (node) {
            if (node && node.el && node.placeholder && node.placeholder.parentNode) {
                node.placeholder.parentNode.replaceChild(node.el, node.placeholder)
            }
        },
        // Insert element to the end of parent childs
        //
        //      @method append
        //      @param {dom.Element} parent
        //      @param {dom.Element} child
        append(parent, child) {
            if (parent.el !== undefined && child.el !== undefined) {
                parent.el.appendChild(child.el);
            }

        },
        // Insert element to the beginning of parent childs
        //
        //      @method prepend
        //      @param {dom.Element} parent
        //      @param {dom.Element} child
        prepend(parent, child) {
            dom.insertBefore(parent, child, 0);
        },
        // Insert element to the before of specific, child by index
        //
        //      @method insertBefore
        //      @param {dom.Element} parent
        //      @param {dom.Element} child
        insertBefore(parent, child, index) {
            let parentEl = parent.el,
                childEl = child.el;
            if (parentEl !== undefined && childEl !== undefined) {
                if (parentEl.childNodes[index] !== undefined) {
                    parentEl.insertBefore(childEl, parentEl.childNodes[index]);
                } else {
                    parentEl.appendChild(childEl);
                }
            }
        },

        // Changing position in nodeList
        //
        //      @method changePosition
        //      @param {dom.Element}
        //      @param {Int} index
        changePosition(el, index){

            let HTMLElement = el.el;
            if (HTMLElement && HTMLElement.parentNode) {

                let parentNode = HTMLElement.parentNode,
                    elGroup = el.elGroup,
                    size = elGroup.size,
                    target = elGroup.getKeyByIndex(index) || elGroup.getLast();


                if (target !== HTMLElement) {
                    if (size - 1 >= index) {
                        parentNode.insertBefore(HTMLElement, target);
                    } else if (target.nextSibling !== null) {
                        parentNode.insertBefore(HTMLElement, target.nextSibling);
                    } else {
                        parentNode.appendChild(HTMLElement);
                    }

                    el.elGroup.changeIndex(HTMLElement, index);
                }
            }
        },
        // Adding text in to node
        //
        //      @method text
        //      @param {dom.Element}
        //      @param {String} text
        text (node, text) {
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
        setAttribute (node, prop, value) {
            if (node && node.el) {
                if (isObject(prop)) {
                    Object.keys(prop).forEach((key)=> {
                        node.el.setAttribute(key, prop[key]);
                    });
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
        getAttribute (node, prop) {
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
        removeAttribute (node, prop) {
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
        setStyle(node, prop, value) {
            if (node && node.el) {
                if (isObject(prop)) {
                    Object.keys(prop).forEach((key)=> {
                        node.el.style[key] = prop[key];
                    });
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
        getStyle(node, prop) {
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
        removeStyle(node, prop) {
            if (node && node.el) {
                node.el.style[prop] = '';
            }
        },
        // Adding class in to node
        //
        //      @method addClass
        //      @param {dom.Element} node
        //      @param {String} className
        addClass(node, className) {
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
        hasClass(node, className) {
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
        removeClass(node, className) {
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
        val(node, val) {
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
        on(element, ev, cb, context, ...args) {
            var el = element.el,
                events = ev.split(' '),
                fn = (e) => {
                    cb.apply(context || this, [e, element].concat(args));
                };

            events.forEach((event)=> {
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
        remove (el) {
            while (el._events.length > 0) {
                el._events.shift().remove();
            }

            if (el.children) {
                destroy(el.children);
            }
            if (el.elGroup !== undefined) {
                el.elGroup.delete(el.el);
            }

            if (el.el !== undefined) {
                if (el.el.remove) {
                    el.el.remove();
                } else if (el.el.parentNode) {
                    el.el.parentNode.removeChild(el.el);
                }
                delete el.el;
            }
        },
        // executes when element attached to Dom
        //
        //      @method onDOMAttached
        //      @param {dom.Element}
        //      @param {function} cb
        //      @param {function} context
        onDOMAttached(el) {
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
        Element: Element
    };


    return dom;
});
/**
 * Created by guntars on 22/01/2016.
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('templating/DomFragment',factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    }
}(this, function() {
    'use strict';
    function createPlaceholder(tag) {
        var placeholder = document.createElement(tag || 'div');
        placeholder.setAttribute('style', 'display:none;');
        return placeholder;
    }

    class DomFragment {
        constructor(_node, placeholder, childNodes, elGroup, index, obj) {
            Object.assign(this, {
                _node,
                placeholder,
                childNodes,
                elGroup,
                index,
                obj
            });
            return this.render();
        };

        applyAttributes(el) {
            let attributes = this._node.data.attribs;
            Object.keys(attributes).forEach(function(key) {
                el.setAttribute(key, attributes[key]);
            });
        };

        applyFragment(el) {
            let node = this._node;
            let plFragment = node.template();
            if (plFragment) {
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
                el = instance.el || createPlaceholder(node.data.tag);

            if (!keep && !node.replace) {
                this.applyAttributes(el);
            } else if (!node.replace) {
                el.innerHTML = '';
            }

            if (!node.replace) {
                this.applyFragment(el);
            }

            this.appendToBody(el);

            if (instance.ready) {
                instance.ready(el);
            }

            return instance;

        }
    }
    return DomFragment;
}));
(function(root, factory) {
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
                            template: () => {
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
                elGroup.onDelete((key, size) => {
                    if (size === 0 && key.parentNode) {
                        key.parentNode.replaceChild(placeholder, key);
                        childFragment = () => placeholder;
                    }
                });
                if (child.template) {
                    let run = (force, index) => {
                        let template = childFragment();
                        if (force instanceof HTMLElement === true) {
                            template = force;
                        }

                        let childNodes,
                            data = (template !== force) && (isObject(force) || isArray(force)) ? force : obj;
                        if (!child.noAttach || force) {
                            let placeholder = template.querySelector('#' + child.id) || template;

                            if (children) {
                                childNodes = this.renderTemplate(children, data, () => {
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

            let runAll = (el) => {
                _runAll.forEach(run => run(el));
                return resp;
            };

            setProp(resp, 'runAll', runAll);

            return resp;
        };

        render(obj) {
            var fragment = this.renderFragment(this._root.template);
            return {
                fragment:   fragment,
                children:   this.renderTemplate(this.children, obj, () => fragment).runAll(),
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
                    var instance = new data.src(data.dataset, children, obj, node);
                    return instance;
                },
                data:    data || {}
            };
            if (data.dataset.bind !== undefined) {
                response.bind = data.dataset.bind;
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
(function(root, factory) {
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
}(this, function(Decoder) {
    'use strict';
    var styleDecoder = {
        tagName: 'style',
        decode:  function(node) {
            if (node.data.styleAttached === undefined) {
                node.data.styleAttached = true;
                let style = node.data.style,
                    addStyle = (style)=> {
                        let tag = document.createElement('style');
                        tag.innerHTML = style;
                        document.head.appendChild(tag);
                    }
                if (typeof style === 'string') {
                    addStyle(style);
                } else {
                    style.then(addStyle)
                }
            }

        }
    };

    if (Decoder) {
        Decoder.addDecoder(styleDecoder);
    }

    return styleDecoder;

}));
