/**
 * Created by guntars on 22/01/2016.
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    }
}(this, function() {
    'use strict';
    function createPlaceholder(tag) {
        var placeholder = document.createElement(tag || 'div');
        placeholder.setAttribute('style', 'display:none;');
        return placeholder;
    }

    class DomFragment {
        constructor(_node, placeholder, childNodes, elGroup, index, obj) {
            Object.assign(this, {
                _node,
                placeholder,
                childNodes,
                elGroup,
                index,
                obj
            });
            return this.render();
        };

        applyAttributes(el) {
            let attributes = this._node.data.attribs;
            Object.keys(attributes).forEach(function(key) {
                el.setAttribute(key, attributes[key]);
            });
        };

        applyFragment(el) {
            let node = this._node;
            let plFragment = node.template();
            if (plFragment) {
                while (plFragment.childNodes.length > 0) {
                    el.appendChild(plFragment.childNodes[0]);
                }
            }
        };

        appendToBody(el) {
            let elGroup = this.elGroup,
                placeholder = this.placeholder,
                size = elGroup.size;

            if (size > 0) {
                let index = (this.index === undefined || this.index > size - 1) ? size - 1 : this.index - 1,
                    target = elGroup.keys()[index !== -1 ? index : 0],
                    parentNode = target.parentNode;

                if (index === -1) {
                    parentNode.insertBefore(el, target);
                }
                else if (target.nextSibling !== null) {
                    parentNode.insertBefore(el, target.nextSibling);
                } else {
                    parentNode.appendChild(el);
                }

            } else {
                let parentNode = placeholder.parentNode;
                if (parentNode) {
                    parentNode.replaceChild(el, placeholder);
                }
            }
        };


        render() {
            let placeholder = this.placeholder,
                node = this._node,
                keep = (!placeholder.id && this.elGroup.size === 0),
                instance = node.tmpEl((keep) ? placeholder : false, this.obj, this.childNodes, node),
                el = instance.el || createPlaceholder(node.data.tag);

            if (!keep && !node.replace) {
                this.applyAttributes(el);
            } else if (!node.replace) {
                el.innerHTML = '';
            }

            if (!node.replace) {
                this.applyFragment(el);
            }

            this.appendToBody(el);

            if (instance.ready) {
                instance.ready(el);
            }

            return instance;

        }
    }
    return DomFragment;
}));