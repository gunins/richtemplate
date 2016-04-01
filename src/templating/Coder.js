(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./DOMParser', './DOMContext'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./DOMParser'), require('./DOMContext'));
    }
}(this, function (DOMParser, DOMContext) {
    'use strict';
    var templId = 0,
        _coders = [],
        tagId = 0;


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
            var domParser = new DOMParser(content);
            domParser.removeComments();
            domParser.applyClass(this.templateId);
            this._domParser = domParser;
            this._rootEl = domParser.findOneChild();

        }

        getOuterHTML() {
            return this._domParser.getOuterHTML(this._rootEl);
        }

        _compile() {
            return {
                children:   this._parseChildren(this._rootEl).context,
                template:   this.getOuterHTML(),
                templateId: this.templateId
            };
        }

        _parseChildren(el) {
            var nodeContext = this._prepareChild(el),
                context = [],
                childEl = nodeContext.getChildrenElements();
            if (childEl && childEl.length > 0) {
                childEl.forEach((child) => {
                    let children = this._parseChildren(child);
                    if (children.parsed) {
                        context.push(children.parsed);
                    }
                    if (!children.parsed || !children.parsed.tagName) {
                        context = [...context, ...children.context];
                    }
                });
            }

            let parsed = this._applyCoder(nodeContext);
            if (parsed && parsed.tagName) {
                parsed.children = context;
            }
            return {context, parsed};
        }

        _applyCoder(nodeContext) {
            var parsed = false,
                data = nodeContext.data;
            _coders.forEach((coder) => {
                if (nodeContext.type === coder.tagName && !parsed) {
                    var id = 'e' + tagId++;

                    nodeContext.setTag(coder.tagName);
                    nodeContext.setPlaceholder(id, coder.noTag);

                    parsed = {
                        id:       id,
                        tagName:  coder.tagName,
                        data:     coder.code(nodeContext, data),
                        template: nodeContext.outerTemplate()
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

        _prepareChild(element) {
            return DOMContext(this, element);
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