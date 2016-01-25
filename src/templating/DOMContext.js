/**
 * Created by guntars on 22/01/2016.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.Coder = factory(root.Templating.utils);
    }
}(this, function () {
    'use strict';

    function setDataFromAttributes(attributes) {
        //TODO: rename dataset tu camel case
        var dataset = {},
            tplSet = {},
            attribs = {};

        Object.keys(attributes).forEach((key) => {
            let subKeys = key.split('-'),
                attrib = attributes[key];
            if (['data', 'tp'].indexOf(subKeys[0]) !== -1 && subKeys.length > 1) {
                let data = (subKeys.length > 2) ? {[subKeys[2]]: attrib} : attrib;
                if (subKeys[0] === 'data') {
                    dataset[subKeys[1]] = data;
                } else {
                    tplSet[subKeys[1]] = data;
                }
            } else {
                attribs[key] = attrib;
            }
        });
        return {
            dataset, tplSet, attribs
        }

    }

    return function DOMContext(compiler, element) {
        var data = setDataFromAttributes(element.attribs);
        data.name = element.name.split('-')[1] || data.tplSet.name;

        return {
            compile: function (node) {
                if (!node) throw "Node is null";
                var el;
                if (compiler._parser.isText(node)) {
                    el = compiler._parser.createElement('span');
                    compiler._parser.appendChild(el, node);
                } else {
                    el = node;
                }
                return compiler._compile(el);
            },
            isText(){
                return compiler._parser.isText(element);
            },
            getInnerHTML(){
                return compiler._parser.getInnerHTML(element)
            },
            getChildrenByPrefix (prefix) {
                var children = compiler._parser.getChildrenElements(element);
                return children.filter(function (el) {
                    return el.name.indexOf(prefix) == 0;
                });
            },
            getChildrenByTagName (name) {
                var children = compiler._parser.getChildrenElements(element);
                return children.filter(function (el) {
                    return el.name == name;
                });
            },
            getChildren () {
                return compiler._parser.getChildrenElements(element);
            },
            findChild (el) {
                var children = compiler._parser.getChildren(el);
                if (children.length == 1) {
                    return children[0];
                } else {
                    return compiler._parser.findOneChild(children);
                }
            },
            removeElement(){
                compiler._parser.removeElement(element);
            },
            removeChildren () {
                var children = element.children;
                if (children.length > 0) {
                    children.forEach(function (child) {
                        compiler._parser.removeElement(child);
                    }.bind(this));
                }
            },
                     get type() {
                         return element.type;
                     },
                     get parser() {
                         return compiler._parser;
                     },
                     get templateId() {
                         return compiler.templateId;
                     },
                     get url() {
                         return compiler.url;
                     },
                     get attribs() {
                         return element.attribs;
                     },
                     get name() {
                         return element.name;
                     },
                     get children() {
                         return element.children;
                     },
                     get data() {
                         return data;
                     },
            getAttributeValue(name) {
                return compiler._parser.getAttributeValue(element, name);
            },
            setAttributeValue(name, value) {
                return compiler._parser.setAttributeValue(element, name, value);
            }
        };
    }
}));