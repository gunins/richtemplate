'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by guntars on 22/01/2016.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
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

                /* if (this.childNodes && this.childNodes.runAll && node.parse) {
                 this.childNodes.runAll();
                 }*/

                return instance;
            }
        }]);

        return DomFragment;
    }();

    return DomFragment;
});
//# sourceMappingURL=DomFragment.js.map
