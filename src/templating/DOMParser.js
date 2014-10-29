(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['htmlparser2', 'templating/utils'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('../htmlparser2'), require('./utils'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.DOMParser = factory(root.htmlparser, root.Templating.utils);
    }
}(this, function (htmlparser, utils) {
    var DomUtils = htmlparser.DomUtils;

    /**
     *
     * @param html
     * @constructor
     */
    function DOMParser(html) {
        var handler = new htmlparser.DomHandler();
        var parser = new htmlparser.Parser(handler);

        parser.write(html);
        parser.done();

        this.dom = handler.dom;
    }

    utils.merge(DOMParser.prototype, {
        DomUtils: DomUtils,
        getOuterHTML: DomUtils.getOuterHTML,
        getInnerHTML: DomUtils.getInnerHTML,
        getChildren: DomUtils.getChildren,
        replaceElement: DomUtils.replaceElement,
        appendChild: DomUtils.appendChild,
        getAttributeValue: DomUtils.getAttributeValue,
        removeElement: DomUtils.removeElement,

        setAttributeValue: function (el, name, value) {
            el.attribs = el.attribs || {};
            if (value === undefined) {
                el.attribs[name];
            } else {
                el.attribs[name] = value;
            }
        },

        createElement: function (tagName) {
            return {
                type: 'tag',
                name: tagName,
                attribs: {},
                children: []
            };
        },

        getElementByTagName: function (tagName, elements) {
            return DomUtils.findOne(function (el) {
                return el.name == tagName;
            }, elements);
        },
        getElementByPrefix: function (prefix, elements) {
            return DomUtils.findOne(function (el) {
                return el.name.split('-')[0] == prefix;
            }, elements);
        },

        getChildrenElements: function (element) {
            return DomUtils.filter(function (el) {
                return el.type === 'tag';
            }, DomUtils.getChildren(element), false);
        },

        findOneChild: function (element) {
            return DomUtils.findOneChild(function (el) {
                return el.type === 'tag';
            }, element ? element : this.dom);
        },

        isText: function (el) {
            return el.type === 'text';
        }
    });

    return DOMParser;
}));