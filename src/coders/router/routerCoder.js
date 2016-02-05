(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    }
}(this, function (Coder) {
    'use strict';
    var routerCoder = {
        tagName: 'rt',
        code:    function (nodeContext, data) {
            data.route = data.attribs.route || data.name;
            data.name = data.name || data.attribs.route.replace(/^\//, '').replace(/\//g, '_');
            delete data.attribs.route;
            return data;
        }
    };
    if (Coder) {
        Coder.addCoder(routerCoder);
    }

    return routerCoder;

}));