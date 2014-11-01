(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.PlaceholderCoder = factory(root.Templating.Coder);
    }
}(this, function (Coder) {
    var PlaceholderCoder = {
        tagName: 'bd',
        code: function (nodeContext, data) {
            var tagName = nodeContext.element.name;
            data.name = (tagName.split('-')[0] === this.tagName) ? tagName.substr(3) : nodeContext.get('tp-name');
            data.type = nodeContext.get('tp-type') || tagName.slice(0, 2);
            return data;
        }
    };

    if (Coder) {
        Coder.addCoder(PlaceholderCoder);
    }

    return PlaceholderCoder;

}));