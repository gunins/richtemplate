/**
 * Created by guntars on 10/10/2014.
 */
//## templating/dom Class for dom manipulation
define(function () {
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
        remove (el, force) {
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