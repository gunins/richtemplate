(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    }
}(this, function (Coder) {
    'use strict';

    var PlaceholderCoder = {
        tagName: 'pl',
        code:    function (nodeContext, data) {
            return data;
        }
    };

    if (Coder) {
        Coder.addCoder(PlaceholderCoder);
    }

    return PlaceholderCoder;

}));