(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../../templating/Coder'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.ComponentCoder = factory(root.Templating.Coder);
    }
}(this, function (Coder) {
    var ComponentCoder = {
        tagName: 'cp',
        code: function (nodeContext, data) {
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

}));