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

    var routerCoder = {
        tagName: 'rt',
        code: function code(nodeContext, data) {
            data.route = data.attribs.route || data.name;
            data.name = data.name || data.attribs.route.replace(/^\//, '').replace(/\//g, '_');
            delete data.attribs.route;
            return data;
        }
    };
    if (Coder) {
        Coder.addCoder(routerCoder);
    }

    return routerCoder;
});
//# sourceMappingURL=routerCoder.js.map
