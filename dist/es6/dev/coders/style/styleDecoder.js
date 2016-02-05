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
    }
}(this, function (Decoder) {
    'use strict';
    var styleDecoder = {
        tagName: 'style',
        decode:  function (node) {
            if (node.data.styleAttached === undefined) {
                node.data.styleAttached = true;
                var style = document.createElement('style');
                style.innerHTML = node.data.style;
                document.head.appendChild(style);
            }

        }
    };

    if (Decoder) {
        Decoder.addDecoder(styleDecoder);
    }

    return styleDecoder;

}));