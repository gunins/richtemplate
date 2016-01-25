(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./DOMParser', './DOMContext'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./DomParser'), require('./DOMContext'));
    }
}(this, function (DOMParser, DOMContext) {
    'use strict';
    var templId = 0,
        _coders = [],
        tagId = 0;

    function applyCoder(el, nodeContext) {
        var parsed = false,
            tmpType = this._parser.getAttributeValue(el, 'tp-type') || el.name.split('-')[0],
            data = nodeContext.data;

        _coders.forEach((coder) => {
            if (tmpType === coder.tagName && !parsed) {
                data.type = coder.tagName;

                var tag = data.tag = (el.name.split('-')[0] !== coder.tagName) ? el.name : data.tplSet.tag ? data.tplSet.tag : 'div',
                    children = this._parser.getChildren(el),
                    placeholder = this._parser.createElement(tag),
                    holder = this._parser.createElement(tag);

                if (children && children.length > 0) {
                    children.forEach((child)=> {
                        this._parser.appendChild(holder, child);
                    });
                }
                if (!coder.noTag) {
                    var id = 'e' + tagId++;
                    this._parser.setAttributeValue(placeholder, 'id', id);
                    this._parser.setAttributeValue(placeholder, 'style', 'display:none');
                    this._parser.replaceElement(el, placeholder);
                } else {
                    this._parser.removeElement(el);
                }

                parsed = {
                    id:       id,
                    tagName:  coder.tagName,
                    data:     coder.code(nodeContext, data),
                    template: this._parser.getOuterHTML(holder)
                };
            }
        });

        if (!parsed) {
            var name = data.name;
            if (name !== undefined) {
                let id = 'e' + tagId++;
                nodeContext.setAttributeValue('id', id);
                nodeContext.setAttributeValue('tp-name', undefined);
                parsed = {
                    id:   id,
                    data: data
                }
            }
        }
        return parsed;
    }


    function parseChildren(el) {
        var nodeContext = this.prepareChild(el),
            context = [],
            childEl = nodeContext.getChildren();

        if (childEl && childEl.length > 0) {
            childEl.forEach((child) => {
                let children = parseChildren.call(this, child);
                if (children.parsed) {
                    context.push(children.parsed);
                    if (!children.parsed.tagName) {
                        context = context.concat(children.context);
                    }
                }
            });
        }
        let parsed = applyCoder.call(this, el, nodeContext);
        if (parsed && parsed.tagName) {
            parsed.children = context;
        }

        return {context, parsed};
    }


    /**
     *
     * @constructor
     * @param dOMParser
     */
    class Coder {
        static    addCoder(coder) {
            if (_coders.indexOf(coder) === -1) {
                _coders.push(coder);
            }
        }

        constructor(content) {
            this.templateId = 'tid_' + new Date().valueOf() + templId;
            var parser = new DOMParser(content);
            this._parser = parser;
            parser.removeComments();
            parser.applyClass(this.templateId);
            this._rootEl = parser.findOneChild();

        }

        _getOuterHTML() {
            return this._parser.getOuterHTML(this._rootEl);
        }

        _compile() {
            return {
                children:   parseChildren.call(this, this._rootEl).context,
                template:   this._getOuterHTML(),
                templateId: this.templateId
            };
        }

        prepareChild(element) {
            var parentNode = DOMContext(this, element);
            return parentNode;
        }

        run(url) {
            this.url = url;
            templId++;
            return this._compile();
        }

        getText() {
            return JSON.stringify(this.run());
        }
    }
    return Coder;
}));