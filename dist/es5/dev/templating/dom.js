'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by guntars on 10/10/2014.
 */
//## templating/dom Class for dom manipulation
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

        // Insert element to the end of parent childs
        //
        //      @method append
        //      @param {dom.Element} parent
        //      @param {dom.Element} child
        append: function append(parent, child) {
            if (parent.el !== undefined && child.el !== undefined) {
                parent.el.appendChild(child.el);
            }
        },

        // Insert element to the beginning of parent childs
        //
        //      @method prepend
        //      @param {dom.Element} parent
        //      @param {dom.Element} child
        prepend: function prepend(parent, child) {
            dom.insertBefore(parent, child, 0);
        },

        // Insert element to the before of specific, child by index
        //
        //      @method insertBefore
        //      @param {dom.Element} parent
        //      @param {dom.Element} child
        insertBefore: function insertBefore(parent, child, index) {
            var parentEl = parent.el,
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
        onDOMAttached: function onDOMAttached(el) {
            var _this2 = this;

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
                    handlers.push(cb.bind(context || _this2));
                    window.requestAnimationFrame(_step);
                }
            };
        },

        // Element
        Element: Element
    };

    return dom;
});
//# sourceMappingURL=dom.js.map
