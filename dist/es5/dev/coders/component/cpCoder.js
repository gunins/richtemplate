'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        module.exports = factory(require('../../templating/Coder'));
    }
})(undefined, function (Coder) {
    'use strict';

    var ComponentCoder = {
        tagName: 'cp',
        code: function code(nodeContext, data) {
            nodeContext.removeChildren();
            data.src = data.attribs.src;
            delete data.attribs.src;
            return data;
        }
    };

    if (Coder) {
        Coder.addCoder(ComponentCoder);
    }

    return ComponentCoder;
});
//# sourceMappingURL=cpCoder.js.map
