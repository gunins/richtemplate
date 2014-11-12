(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([
            'templating/Decoder'
        ], factory)
        ;
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.componentDecoder = factory(root.Templating.Decoder);
    }
}(this, function (Decoder) {

    var componentDecoder = {
        tagName: 'rt',
        noAttach: true,
        decode: function (node, children) {
            var data = node.data;
            var response = {
                name: data.name,
                tmpEl: function (el) {
                    return el || document.createElement(data.tag);
                },
                parse: function (fragment) {
                    if (children) {
                        Object.keys(children).forEach(function (key) {
                            children[key].run(fragment);
                        });
                    }
                },
                data: data || {},
                route:data.route
            };
            return response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;

}));