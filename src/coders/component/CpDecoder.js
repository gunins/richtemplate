(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([
            'templating/Decoder',
            '../bindings/DataBinding',
            'templating/utils'
        ], factory)
        ;
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./DataBinding'), require('./utils'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.componentDecoder = factory(root.Templating.Decoder, root.Templating.DataBinding, root.Templating.utils);
    }
}(this, function (Decoder, DataBinding, utils) {

    var componentDecoder = {
        tagName: 'cp',
        decode: function (node, context, render) {
            context.bind = context.bind || function (model) {
                var binding = new DataBinding(model);
                for (var name in this.bindings) {
                    //noinspection JSUnfilteredForInLoop
                    binding.bind(name, this.bindings[name]);
                }
            };

            var data = node.data;
            data.instance = new data.src(data.dataset);

            if (data.name) {
                context.components = context.components || {};
                context.components[data.name] = data.instance;
                context.components[data.name].children = data.children;
            }
            return data.instance['el'];
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;

}));