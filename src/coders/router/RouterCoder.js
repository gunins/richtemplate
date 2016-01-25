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
        tagName: 'rt',
        code: function (nodeContext, data) {
            //nodeContext.removeChildren();
            data.route = data.attribs.route || data.name;
            data.name = data.name || data.attribs.route.replace(/^\//, '').replace(/\//g, '_');
            delete data.attribs.route;
            return data;
        }
    };
    if (Coder) {
        Coder.addCoder(ComponentCoder);
    }

    return ComponentCoder;

}));