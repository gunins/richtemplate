(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['templating/htmlparser2'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('htmlparser2'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.DOMParser = factory(root.htmlparser, root.Templating.utils);
    }
}(this, function (htmlparser) {
    'use strict';
    let DomUtils = htmlparser.DomUtils;


    /**
     *
     * @param html
     * @constructor
     */
    class DOMParser {
        constructor(html) {
            let handler = new htmlparser.DomHandler();
            let parser = new htmlparser.Parser(handler);
            parser.write(html);
            this.dom = handler.dom;
        }

        setAttributeValue(el, name, value) {
            el.attribs = el.attribs || {};
            if (value === undefined) {
                delete el.attribs[name];
            } else {
                el.attribs[name] = value;
            }
        }

        createElement(tagName) {
            return {
                type:     'tag',
                name:     tagName,
                attribs:  {},
                children: []
            };
        }

        getElementByTagName(tagName, elements) {
            return DomUtils.findOne(function (el) {
                return el.name == tagName;
            }, elements);
        }

        getElementByPrefix(prefix, elements) {
            return DomUtils.findOne(function (el) {
                return el.name.split('-')[0] == prefix;
            }, elements);
        }

        getChildrenElements(element) {
            return DomUtils.filter(function (el) {
                return el.type === 'tag';
            }, DomUtils.getChildren(element), false);
        }

        removeComments(element) {
            element = element || this.dom[0];
            if (element.type === 'comment') {
                DomUtils.removeElement(element);
            }
            var children = DomUtils.getChildren(element);
            if (children && children.length > 0) {
                children.forEach((el)=> {
                    this.removeComments(el);
                });
            }
        }

        applyClass(templateId, element) {
            element = element || this.dom[0];
            if (element.type === 'tag') {
                this.setAttributeValue(element, 'class', (templateId + ' ' + (this.getAttributeValue(element, 'class') || '')).trim());
            }
            var children = DomUtils.getChildren(element);
            if (children && children.length > 0) {
                children.forEach((el)=> {
                    this.applyClass(templateId, el);
                });
            }
        }

        findOneChild(element) {
            return DomUtils.findOneChild(function (el) {
                return el.type === 'tag';
            }, element ? element : this.dom);
        }

        isText(el) {
            return el.type === 'text';
        }
    }

    Object.assign(DOMParser.prototype, {
        DomUtils:          DomUtils,
        getOuterHTML:      DomUtils.getOuterHTML,
        getInnerHTML:      DomUtils.getInnerHTML,
        getChildren:       DomUtils.getChildren,
        replaceElement:    DomUtils.replaceElement,
        appendChild:       DomUtils.appendChild,
        getAttributeValue: DomUtils.getAttributeValue,
        removeElement:     DomUtils.removeElement
    });

    return DOMParser;
}));