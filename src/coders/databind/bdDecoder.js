(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([
            'templating/Decoder'
        ], factory);
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
        tagName: 'bd',
        noAttach: true,
        decode: function (node) {
            var data = this.data = node.data;
            var response = {
                name: data.name,
                tmpEl: function(){
                    return document.createElement(data.tag);
                },
                data: data,
                bind: data.dataset.bind || data.name
            };

            return  response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;

}));