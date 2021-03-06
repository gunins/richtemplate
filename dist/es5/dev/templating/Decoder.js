'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define(['./utils/List', './dom', './DomFragment'], factory);
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
            value: function renderFragment(template, tag) {
                var el = document.createElement('template');
                if (el.content === undefined) {
                    if (tag === 'td') {
                        el = document.createElement('tr');
                    } else if (tag === 'tr') {
                        el = document.createElement('tbody');
                    }
                }
                el.innerHTML = template;
                return el.content !== undefined ? el.content.firstChild : el.firstChild;
            }
        }, {
            key: '_parseElements',
            value: function _parseElements(nodeList) {
                var _this = this;

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
                                    return _this.renderFragment(node.template, node.data.tag);
                                },
                                noAttach: _decoders[tagName].noAttach || node.data.tplSet.noattach
                            };
                            if (node.children && node.children.length > 0) {
                                nodeParams.children = _this._parseElements(node.children);
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
            value: function renderTemplate() {
                var childNodes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                var _this2 = this;

                var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                var fragment = arguments[2];

                var resp = {},
                    _runAll = [];
                Object.keys(childNodes).forEach(function (name) {
                    var childFragment = fragment,
                        child = childNodes[name],
                        children = child.children,
                        elGroup = new List(),
                        placeholder = document.createElement(child.data.tplSet.tag || 'div');
                    placeholder.setAttribute('style', 'display:none;');
                    placeholder.id = child.id;
                    elGroup.onDelete(function (key, size) {
                        if (size === 0 && key.parentNode) {
                            key.parentNode.replaceChild(placeholder, key);
                            childFragment = function childFragment() {
                                return placeholder;
                            };
                        }
                    });
                    if (child.template) {
                        var run = function run(force, index) {
                            var template = childFragment();
                            if (force instanceof HTMLElement === true) {
                                template = force;
                            }

                            var childNodes = undefined,
                                data = template !== force && (isObject(force) || isArray(force)) ? force : obj;
                            if (!child.noAttach || force) {
                                var _placeholder = template.querySelector('#' + child.id) || template;

                                if (children) {
                                    childNodes = _this2.renderTemplate(children, data, function () {
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
                    } else {
                        var element = new dom.Element(childFragment().querySelector('#' + child.id), child);
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
                    children: this.renderTemplate(this.children, obj, function () {
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
//# sourceMappingURL=Decoder.js.map
