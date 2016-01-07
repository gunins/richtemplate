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

}));