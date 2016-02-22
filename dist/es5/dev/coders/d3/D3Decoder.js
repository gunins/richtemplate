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
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.componentDecoder = factory(root.Templating.Decoder);
    }
})(undefined, function (Decoder) {

    var componentDecoder = {
        tagName: 'cp',
        decode: function decode(node, children) {
            var data = node.data;
            data.attribs = {};
            var response = {
                name: data.name,
                tmpEl: function tmpEl(tag, obj, scope) {
                    response.data.instance = new data.src(data.data, children, obj, scope);
                    return data.instance['el'];
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
//# sourceMappingURL=D3Decoder.js.map
