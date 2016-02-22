'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./DOMParser', './DOMContext'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./DomParser'), require('./DOMContext'));
    }
})(undefined, function (DOMParser, DOMContext) {
    'use strict';

    var templId = 0,
        _coders = [],
        tagId = 0;

    /**
     *
     * @constructor
     * @param dOMParser
     */

    var Coder = function () {
        _createClass(Coder, null, [{
            key: 'addCoder',
            value: function addCoder(coder) {
                if (_coders.indexOf(coder) === -1) {
                    _coders.push(coder);
                }
            }
        }]);

        function Coder(content) {
            _classCallCheck(this, Coder);

            this.templateId = 'tid_' + new Date().valueOf() + templId;
            var domParser = new DOMParser(content);
            domParser.removeComments();
            domParser.applyClass(this.templateId);
            this._domParser = domParser;
            this._rootEl = domParser.findOneChild();
        }

        _createClass(Coder, [{
            key: 'getOuterHTML',
            value: function getOuterHTML() {
                return this._domParser.getOuterHTML(this._rootEl);
            }
        }, {
            key: '_compile',
            value: function _compile() {
                return {
                    children: this._parseChildren(this._rootEl).context,
                    template: this.getOuterHTML(),
                    templateId: this.templateId
                };
            }
        }, {
            key: '_parseChildren',
            value: function _parseChildren(el) {
                var _this = this;

                var nodeContext = this._prepareChild(el),
                    context = [],
                    childEl = nodeContext.getChildrenElements();
                if (childEl && childEl.length > 0) {
                    childEl.forEach(function (child) {
                        var children = _this._parseChildren(child);
                        if (children.parsed) {
                            context.push(children.parsed);
                        }
                        if (!children.parsed || !children.parsed.tagName) {
                            context = [].concat(_toConsumableArray(context), _toConsumableArray(children.context));
                        }
                    });
                }

                var parsed = this._applyCoder(nodeContext);
                if (parsed && parsed.tagName) {
                    parsed.children = context;
                }
                return { context: context, parsed: parsed };
            }
        }, {
            key: '_applyCoder',
            value: function _applyCoder(nodeContext) {
                var parsed = false,
                    data = nodeContext.data;
                _coders.forEach(function (coder) {
                    if (nodeContext.type === coder.tagName && !parsed) {
                        var id = 'e' + tagId++;

                        nodeContext.setTag(coder.tagName);
                        nodeContext.setPlaceholder(id, coder.noTag);

                        parsed = {
                            id: id,
                            tagName: coder.tagName,
                            data: coder.code(nodeContext, data),
                            template: nodeContext.outerTemplate()
                        };
                    }
                });

                if (!parsed) {
                    var name = data.name;
                    if (name !== undefined) {
                        var id = 'e' + tagId++;
                        nodeContext.setAttributeValue('id', id);
                        nodeContext.setAttributeValue('tp-name', undefined);
                        parsed = {
                            id: id,
                            data: data
                        };
                    }
                }

                return parsed;
            }
        }, {
            key: '_prepareChild',
            value: function _prepareChild(element) {
                return DOMContext(this, element);
            }
        }, {
            key: 'run',
            value: function run(url) {
                this.url = url;
                templId++;
                return this._compile();
            }
        }, {
            key: 'getText',
            value: function getText() {
                return JSON.stringify(this.run());
            }
        }]);

        return Coder;
    }();

    return Coder;
});
//# sourceMappingURL=Coder.js.map
