'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder', 'd3'], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        module.exports = factory(require('../templating/Coder'), require('d3'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.ComponentCoder = factory(root.Templating.Coder);
    }
})(undefined, function (Coder, d3) {
    var ComponentCoder = {
        tagName: 'd3',
        code: function code(nodeContext, data) {
            nodeContext.removeChildren();
            var tagName = nodeContext.element.name,
                name = tagName.substr(3);
            data.src = data.attribs.src;
            data.name = name || nodeContext.get('tp-name');
            data.type = nodeContext.get('tp-type') || tagName.slice(0, 2);

            delete data.attribs.src;
        }
    };

    if (Coder) {
        Coder.addCoder(ComponentCoder);
    }

    return ComponentCoder;
});
//# sourceMappingURL=D3Coder.js.map
