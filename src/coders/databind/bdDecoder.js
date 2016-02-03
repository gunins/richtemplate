(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([
            'templating/Decoder',
            'templating/dom'
        ], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./dom'));
    }
}(this, function (Decoder, dom) {

    var bindingsDecoder = {
        tagName:  'bd',
        noAttach: true,
        decode:   function (node) {
            var data = this.data = node.data;
            var response = {
                name:  data.name,
                tmpEl: function (el, obj, children, node) {
                    return new dom.Element(el || document.createElement(data.tag), node);
                },
                data:  data
            };

            return response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(bindingsDecoder);
    }

    return bindingsDecoder;

}));