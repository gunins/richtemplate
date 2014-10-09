(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([
            'templating/Decoder',
            'templating/utils'
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
        root.Templating.componentDecoder = factory(root.Templating.Decoder, root.Templating.DataBinding, root.Templating.utils);
    }
}(this, function (Decoder, utils) {

    var componentDecoder = {
        tagName: 'pl',
        decode: function (node) {
//            console.log(node)
            var data = node.data;
            var el = document.createElement('div');
            return {
                name:data.name,
                el:el,
                data:data
            };
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;

}));