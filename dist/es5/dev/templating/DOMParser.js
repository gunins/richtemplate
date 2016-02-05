'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['templating/htmlparser2'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('htmlparser2'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.DOMParser = factory(root.htmlparser, root.Templating.utils);
    }
})(undefined, function (htmlparser) {
    'use strict';

    var DomUtils = htmlparser.DomUtils;

    /**
     *
     * @param html
     * @constructor
     */

    var DOMParser = function () {
        function DOMParser(html) {
            _classCallCheck(this, DOMParser);

            var handler = new htmlparser.DomHandler();
            var parser = new htmlparser.Parser(handler);
            parser.write(html);
            this.dom = handler.dom;
        }

        _createClass(DOMParser, [{
            key: 'setAttributeValue',
            value: function setAttributeValue(el, name, value) {
                el.attribs = el.attribs || {};
                if (value === undefined) {
                    delete el.attribs[name];
                } else {
                    el.attribs[name] = value;
                }
            }
        }, {
            key: 'createElement',
            value: function createElement(tagName) {
                return {
                    type: 'tag',
                    name: tagName,
                    attribs: {},
                    children: []
                };
            }
        }, {
            key: 'getElementByTagName',
            value: function getElementByTagName(tagName, elements) {
                return DomUtils.findOne(function (el) {
                    return el.name == tagName;
                }, elements);
            }
        }, {
            key: 'getElementByPrefix',
            value: function getElementByPrefix(prefix, elements) {
                return DomUtils.findOne(function (el) {
                    return el.name.split('-')[0] == prefix;
                }, elements);
            }
        }, {
            key: 'getChildrenElements',
            value: function getChildrenElements(element) {
                return DomUtils.filter(function (el) {
                    return el.type === 'tag';
                }, DomUtils.getChildren(element), false);
            }
        }, {
            key: 'removeComments',
            value: function removeComments(element) {
                var _this = this;

                element = element || this.dom[0];
                if (element.type === 'comment') {
                    DomUtils.removeElement(element);
                }
                var children = DomUtils.getChildren(element);
                if (children && children.length > 0) {
                    children.forEach(function (el) {
                        _this.removeComments(el);
                    });
                }
            }
        }, {
            key: 'applyClass',
            value: function applyClass(templateId, element) {
                var _this2 = this;

                element = element || this.dom[0];
                if (element.type === 'tag') {
                    this.setAttributeValue(element, 'class', (templateId + ' ' + (this.getAttributeValue(element, 'class') || '')).trim());
                }
                var children = DomUtils.getChildren(element);
                if (children && children.length > 0) {
                    children.forEach(function (el) {
                        _this2.applyClass(templateId, el);
                    });
                }
            }
        }, {
            key: 'findOneChild',
            value: function findOneChild(element) {
                return DomUtils.findOneChild(function (el) {
                    return el.type === 'tag';
                }, element ? element : this.dom);
            }
        }, {
            key: 'isText',
            value: function isText(el) {
                return el.type === 'text';
            }
        }]);

        return DOMParser;
    }();

    Object.assign(DOMParser.prototype, {
        DomUtils: DomUtils,
        getOuterHTML: DomUtils.getOuterHTML,
        getInnerHTML: DomUtils.getInnerHTML,
        getChildren: DomUtils.getChildren,
        replaceElement: DomUtils.replaceElement,
        appendChild: DomUtils.appendChild,
        getAttributeValue: DomUtils.getAttributeValue,
        removeElement: DomUtils.removeElement
    });

    return DOMParser;
});
//# sourceMappingURL=DOMParser.js.map
