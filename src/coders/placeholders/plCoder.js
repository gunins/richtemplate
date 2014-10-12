(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.PlaceholderCoder = factory(root.Templating.Coder);
    }
}(this, function (Coder) {
    var PlaceholderCoder = {
        tagName: 'pl',
        code: function (nodeContext, data) {
            var name = nodeContext.element.name.substr(3);

            data.name = name || nodeContext.get('tp-name');

            return data;
        }
    };

    if (Coder) {
        Coder.addCoder(PlaceholderCoder);
    }

    return PlaceholderCoder;

}));