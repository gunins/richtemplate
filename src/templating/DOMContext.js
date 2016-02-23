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
                let attr = (subKeys.length > 2) ? {[subKeys[2]]: attrib} : attrib;
                if (subKeys[0] === 'data') {
                    dataset[subKeys[1]] = attr;
                } else {
                    tplSet[subKeys[1]] = attr;
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
        var domParser = compiler._domParser,
            data = setDataFromAttributes(element.attribs);
        data.name = element.name.split('-')[1] || data.tplSet.name;
        data.tag = data.tplSet.tag || 'div';
        data.type = data.tplSet.type || element.name.split('-')[0];


        return {
            setTag(coderName){
                if (!data.tplSet.tag) {
                    data.tag = (data.type !== coderName) ? element.name : data.tag;
                }
            },
            outerTemplate(){
                var children = domParser.getChildren(element),
                    holder = domParser.createElement(data.tag);

                if (children && children.length > 0) {
                    children.forEach((child)=> {
                        domParser.appendChild(holder, child);
                    });
                }
                return domParser.getOuterHTML(holder);
            },
            setPlaceholder(id, noTag){
                if (noTag) {
                    domParser.removeElement(element);
                } else {
                    var placeholder = domParser.createElement(data.tag);
                    domParser.setAttributeValue(placeholder, 'id', id);
                    //domParser.setAttributeValue(placeholder, 'style', 'display:none');
                    domParser.replaceElement(element, placeholder);
                }
            },
            getInnerHTML(){
                return domParser.getInnerHTML(element)
            },
            getChildrenElements () {
                return domParser.getChildrenElements(element);
            },
            removeChildren () {
                var children = element.children;
                if (children.length > 0) {
                    children.forEach(function (child) {
                        domParser.removeElement(child);
                    }.bind(this));
                }
            },
                     get type() {
                         return data.type;
                     },
                     get tag() {
                         return data.tag;
                     },
                     get templateId() {
                         return compiler.templateId;
                     },
                     get url() {
                         return compiler.url;
                     },
                     get data() {
                         return data;
                     },
            getAttributeValue(name) {
                return domParser.getAttributeValue(element, name);
            },
            setAttributeValue(name, value) {
                return domParser.setAttributeValue(element, name, value);
            }
        };
    }
}));