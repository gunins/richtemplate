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

    var componentDecoder = {
        tagName: 'cp',
        decode: function decode(node) {
            var data = node.data;
            var response = {
                name: data.name,
                replace: true,
                tmpEl: function tmpEl(placeholder, obj, children, node) {
                    var instance = new data.src(data.data, children, obj, node);
                    return instance;
                },
                data: data || {}
            };
            if (data.data.bind !== undefined) {
                response.bind = data.data.bind;
            }
            return response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;
});
//# sourceMappingURL=cpDecoder.js.map
