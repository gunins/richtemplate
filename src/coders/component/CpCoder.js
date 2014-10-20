(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
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
            var src = nodeContext.element.name.substr(3);
            data.src = src || nodeContext.get('src');
            data.name = nodeContext.get('tp-name');
        }
    };

    if (Coder) {
        Coder.addCoder(ComponentCoder);
    }

    return ComponentCoder;

}));