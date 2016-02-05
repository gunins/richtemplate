'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define(['templating/Decoder', 'templating/dom'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./dom'));
    }
})(undefined, function (Decoder, dom) {
    'use strict';

    var componentDecoder = {
        tagName: 'pl',
        decode: function decode(node) {

            var data = node.data;
            return {
                name: data.name,
                tmpEl: function tmpEl(el, obj, children, node) {
                    return new dom.Element(el || document.createElement(data.tag), node);
                },
                parse: true,
                data: data
            };
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;
});
//# sourceMappingURL=plDecoder.js.map
