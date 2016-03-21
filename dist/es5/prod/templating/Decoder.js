'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by guntars on 02/02/2016.
 */
define('templating/utils/List', [], function () {
    'use strict';

    var List = function () {
        function List(items) {
            _classCallCheck(this, List);

            this._map = new Map(items);
            this._indexes = [].concat(_toConsumableArray(this._map.keys()));
            this._onDelete = [];
        }

        _createClass(List, [{
            key: 'keys',
            value: function keys() {
                return this._indexes;
            }
        }, {
            key: 'values',
            value: function values() {
                return this.entries().map(function (entry) {
                    return entry[1];
                });
            }
        }, {
            key: 'entries',
            value: function entries() {
                var _this = this;

                return this._indexes.map(function (key) {
                    return [key, _this._map.get(key)];
                });
            }
        }, {
            key: 'get',
            value: function get(key) {
                return this._map.get(key);
            }
        }, {
            key: 'forEach',
            value: function forEach(fn) {
                return this.values().forEach(function (value, index) {
                    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                        args[_key - 2] = arguments[_key];
                    }

                    return fn.apply(null, [value, index].concat(args));
                });
            }
        }, {
            key: 'getIndex',
            value: function getIndex(key) {
                return this._indexes.indexOf(key);
            }
        }, {
            key: 'changeIndex',
            value: function changeIndex(key, index) {
                if (key) {
                    var indexes = this._indexes,
                        indexOf = indexes.indexOf(key);

                    if (indexOf !== -1 && index !== indexOf) {
                        this._indexes.splice(index, 0, this._indexes.splice(indexOf, 1)[0]);
                    }
                }
            }
        }, {
            key: 'getValueByIndex',
            value: function getValueByIndex(index) {
                return this._map.get(this._indexes[index]);
            }
        }, {
            key: 'getFirst',
            value: function getFirst() {
                return this.getValueByIndex(0);
            }
        }, {
            key: 'getLast',
            value: function getLast() {
                return this.getValueByIndex(this._indexes.length - 1);
            }
        }, {
            key: 'getKeyByIndex',
            value: function getKeyByIndex(index) {
                return this._indexes[index];
            }
        }, {
            key: 'set',
            value: function set(key, value, index) {
                this._map.set(key, value);
                if (index !== undefined) {
                    this._indexes.splice(index, 0, key);
                } else {
                    this._indexes.push(key);
                }
            }
        }, {
            key: 'has',
            value: function has(key) {
                return this._map.has(key);
            }
        }, {
            key: 'clear',
            value: function clear() {
                this._map.clear();
                this._indexes.splice(0, this._indexes.length);
            }
        }, {
            key: 'onDelete',
            value: function onDelete(cb) {
                var chunk = function chunk() {
                    return cb.apply(undefined, arguments);
                };
                this._onDelete.push(chunk);
                return {
                    remove: function remove() {
                        this._onDelete.splice(this._onDelete.indexOf(chunk, 1));
                    }
                };
            }
        }, {
            key: 'delete',
            value: function _delete(key) {
                var _this2 = this;

                var item = this._map.get(key);
                this._map.delete(key);
                this._indexes.splice(this._indexes.indexOf(key), 1);
                this._onDelete.forEach(function (chunk) {
                    return chunk(key, _this2.size, item);
                });
            }
        }, {
            key: 'deleteByIndex',
            value: function deleteByIndex(index) {
                this.delete(this._indexes[index]);
            }
        }, {
            key: 'size',
            get: function get() {
                return this._map.size;
            }
        }]);

        return List;
    }();

    return List;
});
/**
 * Created by guntars on 10/10/2014.
 */
//## templating/dom Class for dom manipulation
define('templating/dom', [], function () {
    'use strict';

    function isObject(obj) {
        var type = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
        return type === 'function' || type === 'object' && !!obj;
    }

    function createPlaceholder(tag) {
        var placeholder = document.createElement(tag || 'div');
        placeholder.setAttribute('style', 'display:none;');
        return placeholder;
    }

    function destroy(instance) {
        var keys = Object.keys(instance);
        if (keys.length > 0) {
            keys.forEach(function (key) {
                if (key !== 'root') {
                    var children = instance[key];
                    if (children.elGroup !== undefined && children.elGroup.size > 0) {
                        children.elGroup.forEach(function (child) {
                            if (child !== undefined && child.remove !== undefined) {
                                child.remove(true);
                            }
                        });
                    }
                }
            });
        }
    }

    // ## widget/dom.Element
    //     @method Element
    //     @param {Object} node

    var Element = function () {
        function Element(el, node) {
            _classCallCheck(this, Element);

            this.el = el;
            this._events = [];
            //this._node = node;
            this.name = node.name || node.data.name;
            var data = this.data = node.data;
            if (data) {
                if (data.bind) {
                    this.bind = data.bind;
                }
                /* if (data.dataset) {
                 this.dataset = data.dataset;
                 }*/
            }
        }

        _createClass(Element, [{
            key: 'clone',
            value: function clone() {
                return this.run.apply(this, arguments);
            }
        }, {
            key: 'text',

            // Shortcut to - `dom.text`
            value: function text(_text) {
                dom.text(this, _text);
            }
        }, {
            key: 'detach',
            value: function detach() {
                dom.detach(this);
            }
        }, {
            key: 'attach',
            value: function attach() {
                dom.attach(this);
            }
        }, {
            key: 'changePosition',

            // Shortcut to - `dom.changePosition`
            value: function changePosition(index) {
                dom.changePosition(this, index);
            }

            // Shortcut to - `dom.setAttribute`

        }, {
            key: 'setAttribute',
            value: function setAttribute(prop, value) {
                dom.setAttribute(this, prop, value);
            }
        }, {
            key: 'getAttribute',

            // Shortcut to - `dom.getAttribute`
            value: function getAttribute(prop) {
                return dom.getAttribute(this, prop);
            }
        }, {
            key: 'removeAttribute',

            // Shortcut to - `dom.removeAttribute`
            value: function removeAttribute(prop) {
                dom.removeAttribute(this, prop);
            }
        }, {
            key: 'setStyle',

            // Shortcut to - `dom.setStyle`
            value: function setStyle(prop, value) {
                dom.setStyle(this, prop, value);
            }
        }, {
            key: 'getStyle',

            // Shortcut to - `dom.getStyle`
            value: function getStyle(prop) {
                return dom.getStyle(this, prop);
            }

            // Shortcut to - `dom.removeStyle`

        }, {
            key: 'removeStyle',
            value: function removeStyle(prop) {
                dom.removeStyle(this, prop);
            }
        }, {
            key: 'addClass',

            // Shortcut to - `dom.addClass`
            value: function addClass(className) {
                dom.addClass(this, className);
            }
        }, {
            key: 'hasClass',

            // Shortcut to - `dom.hasClass`
            value: function hasClass(className) {
                return dom.hasClass(this, className);
            }
        }, {
            key: 'removeClass',

            // Shortcut to - `dom.removeClass`
            value: function removeClass(className) {
                dom.removeClass(this, className);
            }
        }, {
            key: 'val',

            // Shortcut to - `dom.val`
            value: function val(_val) {
                return dom.val(this, _val);
            }
        }, {
            key: 'on',

            // Shortcut to - `dom.on`
            value: function on(event, cb, context) {
                var args = Array.prototype.slice.call(arguments, 0);
                return dom.on.apply(false, [this].concat(args));
            }
        }, {
            key: 'onDOMAttached',

            // Shortcut to - `dom.onDOMAttached`
            value: function onDOMAttached() {
                return dom.onDOMAttached(this);
            }
        }, {
            key: 'remove',

            // Shortcut to - `dom.remove`
            value: function remove(force) {
                dom.remove(this, force);
            }
        }]);

        return Element;
    }();

    var dom = {
        //Removing element from DOM
        //
        //      @method detach
        //      @param {dom.Element}

        detach: function detach(node) {
            if (node.placeholder instanceof HTMLElement === false) {
                node.placeholder = createPlaceholder(node.data.tag || node.el.tagName);
            }
            if (node && node.el && node.el.parentNode) {
                node.el.parentNode.replaceChild(node.placeholder, node.el);
            }
        },

        //Adding element back to DOM
        //
        //      @method attach
        //      @param {dom.Element}
        attach: function attach(node) {
            if (node && node.el && node.placeholder && node.placeholder.parentNode) {
                node.placeholder.parentNode.replaceChild(node.el, node.placeholder);
            }
        },

        // Changing position in nodeList
        //
        //      @method changePosition
        //      @param {dom.Element}
        //      @param {Int} index
        changePosition: function changePosition(el, index) {

            var HTMLElement = el.el;
            if (HTMLElement && HTMLElement.parentNode) {

                var parentNode = HTMLElement.parentNode,
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
        text: function text(node, _text2) {
            if (node && node.el) {
                node.el.innerHTML = _text2;
            }
        },

        // Setting Attribute in to node
        //
        //      @method setAttribute
        //      @prop {dom.Element} node
        //      @prop {String||Object} prop
        //      @prop {String} value
        setAttribute: function setAttribute(node, prop, value) {
            if (node && node.el) {
                if (isObject(prop)) {
                    Object.keys(prop).forEach(function (key) {
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
        getAttribute: function getAttribute(node, prop) {
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
        removeAttribute: function removeAttribute(node, prop) {
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
        setStyle: function setStyle(node, prop, value) {
            if (node && node.el) {
                if (isObject(prop)) {
                    Object.keys(prop).forEach(function (key) {
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
        getStyle: function getStyle(node, prop) {
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
        removeStyle: function removeStyle(node, prop) {
            if (node && node.el) {
                node.el.style[prop] = '';
            }
        },

        // Adding class in to node
        //
        //      @method addClass
        //      @param {dom.Element} node
        //      @param {String} className
        addClass: function addClass(node, className) {
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
        hasClass: function hasClass(node, className) {
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
        removeClass: function removeClass(node, className) {
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
        val: function val(node, _val2) {
            if (node && node.el) {
                var el = node.el;
                if (_val2 !== undefined) {
                    el.value = _val2;
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
        on: function on(element, ev, cb, context) {
            for (var _len2 = arguments.length, args = Array(_len2 > 4 ? _len2 - 4 : 0), _key2 = 4; _key2 < _len2; _key2++) {
                args[_key2 - 4] = arguments[_key2];
            }

            var _this3 = this;

            var el = element.el,
                events = ev.split(' '),
                fn = function fn(e) {
                cb.apply(context || _this3, [e, element].concat(args));
            };

            events.forEach(function (event) {
                el.addEventListener(event, fn);
            });
            var evt = {
                remove: function remove() {
                    events.forEach(function (event) {
                        return el.removeEventListener(event, fn);
                    });
                    var evts = element._events;
                    evts.splice(evts.indexOf(evt), 1);
                }
            };
            element._events.push(evt);
            return evt;
        },

        // Remove Dom Element from Dom
        //
        //      @method remove
        //      @param {dom.Element}
        remove: function remove(el, force) {
            while (el._events.length > 0) {
                el._events.shift().remove();
            }
            if (el.children) {
                destroy(el.children, force);
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
        onDOMAttached: function onDOMAttached(el) {
            var _this4 = this;

            var handlers = [],
                attached = false,
                _step = undefined;

            if (el.el !== undefined) {
                _step = function step() {
                    if (attached) {
                        while (handlers.length > 0) {
                            handlers.shift()();
                        }
                    } else {
                        window.requestAnimationFrame(_step);
                        if (document.body.contains(el.el)) {
                            attached = true;
                        }
                    }
                };
            }
            return {
                then: function then(cb, context) {
                    handlers.push(cb.bind(context || _this4));
                    window.requestAnimationFrame(_step);
                }
            };
        },

        // Element
        Element: Element
    };

    return dom;
});
/**
 * Created by guntars on 22/01/2016.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('templating/DomFragment', factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    }
})(undefined, function () {
    'use strict';

    var DomFragment = function () {
        function DomFragment(_node, placeholder, childNodes, elGroup, index, obj) {
            _classCallCheck(this, DomFragment);

            Object.assign(this, {
                _node: _node,
                placeholder: placeholder,
                childNodes: childNodes,
                elGroup: elGroup,
                index: index,
                obj: obj
            });
            return this.render();
        }

        _createClass(DomFragment, [{
            key: 'applyAttributes',
            value: function applyAttributes(el) {
                var attributes = this._node.data.attribs;
                Object.keys(attributes).forEach(function (key) {
                    el.setAttribute(key, attributes[key]);
                });
            }
        }, {
            key: 'applyFragment',
            value: function applyFragment(el) {
                var node = this._node;
                var plFragment = node.template();
                if (plFragment !== undefined) {
                    while (plFragment.childNodes.length > 0) {
                        el.appendChild(plFragment.childNodes[0]);
                    }
                }
            }
        }, {
            key: 'appendToBody',
            value: function appendToBody(el) {
                var elGroup = this.elGroup,
                    placeholder = this.placeholder,
                    size = elGroup.size;

                if (size > 0) {
                    var index = this.index === undefined || this.index > size - 1 ? size - 1 : this.index - 1,
                        target = elGroup.keys()[index !== -1 ? index : 0],
                        parentNode = target.parentNode;

                    if (index === -1) {
                        parentNode.insertBefore(el, target);
                    } else if (target.nextSibling !== null) {
                        parentNode.insertBefore(el, target.nextSibling);
                    } else {
                        parentNode.appendChild(el);
                    }
                } else {
                    var parentNode = placeholder.parentNode;
                    if (parentNode) {
                        parentNode.replaceChild(el, placeholder);
                    }
                }
            }
        }, {
            key: 'render',
            value: function render() {
                var placeholder = this.placeholder,
                    node = this._node,
                    keep = !placeholder.id && this.elGroup.size === 0,
                    instance = node.tmpEl(keep ? placeholder : false, this.obj, this.childNodes, node),
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

                return instance;
            }
        }]);

        return DomFragment;
    }();

    return DomFragment;
});
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('templating/Decoder', ['./utils/List', './dom', './DomFragment'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./utils/List'), require('./dom'), require('./DomFragment'));
    }
})(undefined, function (List, dom, DomFragment) {
    'use strict';

    var _decoders = {};

    function isObject(obj) {
        return obj === Object(obj);
    }

    function isArray(obj) {
        return Array.isArray ? Array.isArray(obj) : toString.call(obj) === '[object Array]';
    }

    /**
     *
     * @constructor
     * @param root
     */

    var Decoder = function () {
        _createClass(Decoder, null, [{
            key: 'addDecoder',
            value: function addDecoder(decoder) {
                if (_decoders[decoder.tagName] === undefined) {
                    _decoders[decoder.tagName] = decoder;
                }
            }
        }]);

        function Decoder(root) {
            _classCallCheck(this, Decoder);

            this._root = typeof root === 'string' ? JSON.parse(root) : root;
            if (root.children && root.children.length > 0) {
                this.children = this._parseElements(root.children);
            }
        }

        _createClass(Decoder, [{
            key: 'renderFragment',
            value: function renderFragment(template) {
                var el = document.createElement('template');
                el.innerHTML = template;
                return el.content !== undefined ? el.content.firstChild : el.firstChild;
            }
        }, {
            key: '_parseElements',
            value: function _parseElements(nodeList) {
                var _this5 = this;

                var context = {};
                nodeList.forEach(function (node) {
                    var name = node.data.name;
                    var tagName = node.tagName;
                    if (tagName) {
                        var decodedData = _decoders[tagName].decode(node);
                        if (decodedData) {
                            var nodeParams = {
                                name: decodedData.name,
                                data: decodedData.data,
                                tmpEl: decodedData.tmpEl,
                                parse: decodedData.parse,
                                replace: decodedData.replace,
                                id: node.id,
                                template: function template() {
                                    return _this5.renderFragment(node.template, node.data.tag);
                                },
                                noAttach: _decoders[tagName].noAttach || node.data.tplSet.noattach
                            };
                            if (node.children && node.children.length > 0) {
                                nodeParams.children = _this5._parseElements(node.children);
                            }
                            context[name] = nodeParams;
                        }
                    } else if (name) {
                        context[name] = {
                            id: node.id,
                            data: node.data,
                            name: name
                        };
                    }
                });
                return context;
            }
        }, {
            key: 'renderTemplate',
            value: function renderTemplate(childNodes, obj, fragment) {
                var _this6 = this;

                var resp = {},
                    _runAll = [];
                Object.keys(childNodes).forEach(function (name) {
                    var child = childNodes[name],
                        children = child.children,
                        elGroup = new List(),
                        placeholder = document.createElement(child.data.tplSet.tag || 'div');
                    placeholder.setAttribute('style', 'display:none;');
                    placeholder.id = child.id;
                    elGroup.onDelete(function (key, size) {
                        if (size === 0 && key.parentNode) {
                            key.parentNode.replaceChild(placeholder, key);
                            fragment = function fragment() {
                                return placeholder;
                            };
                        }
                    });
                    if (child.template) {
                        (function () {
                            var run = function run(force, index) {
                                var template = fragment();
                                if (force instanceof HTMLElement === true) {
                                    template = force;
                                }

                                var childNodes = undefined,
                                    data = template !== force && (isObject(force) || isArray(force)) ? force : obj;
                                if (!child.noAttach || force) {
                                    var _placeholder = template.querySelector('#' + child.id) || template;

                                    if (children) {
                                        childNodes = _this6.renderTemplate(children, data, function () {
                                            return template;
                                        });
                                    }
                                    var element = new DomFragment(child, _placeholder, childNodes, elGroup, index, data);

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
                            };
                            _runAll.push(run);
                            resp[name] = {
                                data: child.data,
                                run: run,
                                elGroup: elGroup
                            };
                        })();
                    } else {
                        var element = new dom.Element(fragment().querySelector('#' + child.id), child);
                        element.removeAttribute('id');
                        element.elGroup = elGroup;
                        elGroup.set(element.el, element);
                        resp[name] = element;
                    }
                });
                var setProp = function setProp(obj, name, fn) {
                    Object.defineProperty(obj, name, {
                        enumerable: false,
                        value: fn
                    });
                };

                var runAll = function runAll(el) {
                    _runAll.forEach(function (run) {
                        return run(el);
                    });
                    return resp;
                };

                setProp(resp, 'runAll', runAll);

                return resp;
            }
        }, {
            key: 'render',
            value: function render(obj) {
                var fragment = this.renderFragment(this._root.template);
                return {
                    fragment: fragment,
                    children: this.renderTemplate(this.children, obj || {}, function () {
                        return fragment;
                    }).runAll(),
                    templateId: this._root.templateId
                };
            }
        }]);

        return Decoder;
    }();

    return Decoder;
});
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/component/cpDecoder', ['templating/Decoder'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'));
    }
})(undefined, function (Decoder) {
    'use strict';

    var componentDecoder = {
        tagName: 'cp',
        decode: function decode(node) {
            var data = node.data;
            var response = {
                name: data.name,
                replace: true,
                tmpEl: function tmpEl(placeholder, obj, children, node) {
                    var instance = new data.src(data.dataset, children, obj, node);
                    return instance;
                },
                data: data || {}
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
});
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/placeholders/plDecoder', ['templating/Decoder', 'templating/dom'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./dom'));
    }
})(undefined, function (Decoder, dom) {
    'use strict';

    var componentDecoder = {
        tagName: 'pl',
        decode: function decode(node) {

            var data = node.data;
            return {
                name: data.name,
                tmpEl: function tmpEl(el, obj, children, node) {
                    return new dom.Element(el || document.createElement(data.tag), node);
                },
                parse: true,
                data: data
            };
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;
});
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/databind/bdDecoder', ['templating/Decoder', 'templating/dom'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./dom'));
    }
})(undefined, function (Decoder, dom) {
    'use strict';

    var bindingsDecoder = {
        tagName: 'bd',
        noAttach: true,
        decode: function decode(node) {
            var data = this.data = node.data;
            var response = {
                name: data.name,
                tmpEl: function tmpEl(el, obj, children, node) {
                    return new dom.Element(el || document.createElement(data.tag), node);
                },
                data: data
            };

            return response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(bindingsDecoder);
    }

    return bindingsDecoder;
});
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/router/routerDecoder', ['templating/Decoder', 'templating/dom'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./dom'));
    }
})(undefined, function (Decoder, dom) {
    'use strict';

    var componentDecoder = {
        tagName: 'rt',
        noAttach: true,
        decode: function decode(node) {
            var data = node.data;
            var response = {
                name: data.name,
                tmpEl: function tmpEl(el, obj, children, node) {
                    return new dom.Element(el || document.createElement(data.tag), node);
                },
                parse: true,
                data: data || {}
            };
            return response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;
});
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define('coders/style/styleDecoder', ['templating/Decoder'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'));
    }
})(undefined, function (Decoder) {
    'use strict';

    var styleDecoder = {
        tagName: 'style',
        decode: function decode(node) {
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
});
