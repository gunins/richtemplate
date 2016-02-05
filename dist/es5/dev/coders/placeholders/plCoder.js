'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        module.exports = factory();
    }
})(undefined, function (Coder) {
    'use strict';

    var PlaceholderCoder = {
        tagName: 'pl',
        code: function code(nodeContext, data) {
            return data;
        }
    };

    if (Coder) {
        Coder.addCoder(PlaceholderCoder);
    }

    return PlaceholderCoder;
});
//# sourceMappingURL=plCoder.js.map
