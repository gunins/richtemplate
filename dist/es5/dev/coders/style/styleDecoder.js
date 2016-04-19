'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define(['templating/Decoder'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'));
    }
})(undefined, function (Decoder) {
    'use strict';

    var styleDecoder = {
        tagName: 'style',
        decode: function decode(node) {
            if (node.data.styleAttached === undefined) {
                node.data.styleAttached = true;
                var style = node.data.style,
                    addStyle = function addStyle(style) {
                    var tag = document.createElement('style');
                    tag.innerHTML = style;
                    document.head.appendChild(tag);
                };
                if (typeof style === 'string') {
                    addStyle(style);
                } else {
                    style.then(addStyle);
                }
            }
        }
    };

    if (Decoder) {
        Decoder.addDecoder(styleDecoder);
    }

    return styleDecoder;
});
//# sourceMappingURL=styleDecoder.js.map
