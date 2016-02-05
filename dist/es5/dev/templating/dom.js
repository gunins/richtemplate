'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by guntars on 10/10/2014.
 */
//## widget/dom Class for dom manipulation
define(function () {
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

    // ## widget/dom.Element
    //     @method Element
    //     @param {Object} node

    var Element = function () {
        function Element(el, node) {
            _classCallCheck(this, Element);

            var data = node.data;
            this._events = [];
            this._node = node;
            this.el = el;
            this.name = node.name;
            if (data) {
                if (data.bind) {
                    this.bind = data.bind;
                }
                if (data.dataset) {
                    this.dataset = data.dataset;
                }
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
            key: 'setAttribute',

            // Shortcut to - `dom.setAttribute`
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
            value: function remove() {
                dom.remove(this);
            }
        }]);

        return Element;
    }();

    ;

    var dom = {
        //Removing element from DOM
        //
        //      @method detach
        //      @param {dom.Element}

        detach: function detach(node) {
            if (node.placeholder instanceof HTMLElement === false) {
                node.placeholder = createPlaceholder(node._node.data.tag || node.el.tagName);
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
            for (var _len = arguments.length, args = Array(_len > 4 ? _len - 4 : 0), _key = 4; _key < _len; _key++) {
                args[_key - 4] = arguments[_key];
            }

            var _this = this;

            var el = element.el,
                events = ev.split(' '),
                fn = function fn(e) {
                cb.apply(context || _this, [e, element].concat(args));
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
        remove: function remove(el) {
            while (el._events.length > 0) {
                el._events[0].remove();
                el._events.shift();
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
        onDOMAttached: function onDOMAttached(el) {
            var _this2 = this;

            var handlers = [],
                attached = false;

            if (el.el !== undefined) {
                var step = function step() {
                    if (attached) {
                        while (handlers.length > 0) {
                            var handler = handlers[0];
                            handler();
                            handlers.shift();
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
                then: function then(cb, context) {
                    handlers.push(cb.bind(context || _this2));
                    window.requestAnimationFrame(step);
                }
            };
        },
        // Element
        Element: Element
    };

    return dom;
});
//# sourceMappingURL=dom.js.map
