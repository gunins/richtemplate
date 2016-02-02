(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    }
}(this, function (Coder) {
    var bindingsCoder = {
        tagName: 'bd',
        code:    function (nodeContext, data) {
            data.bind = data.dataset.bind || data.name;
            return data;
        }
    };

    if (Coder) {
        Coder.addCoder(bindingsCoder);
    }

    return bindingsCoder;

}));