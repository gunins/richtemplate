(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.ComponentCoder = factory(root.Templating.Coder);
    }
}(this, function (Coder) {
    var ComponentCoder = {
        tagName: 'cp',
        code: function (nodeContext) {
            var src = nodeContext.element.name.split('-')[1];
            var dataset = {};
            var attribs = nodeContext.element.attribs;

            for (var name in attribs) {
                //noinspection JSUnfilteredForInLoop
                if (name.indexOf('data-') == 0 && name.length > 5) {
                    //noinspection JSUnfilteredForInLoop
                    dataset[name.substr(5)] = attribs[name];
                }
            }
            return {
                src: src || nodeContext.get('src'),
                name: nodeContext.get('name'),
                dataset: dataset
            };
        }
    };

    if (Coder) {
        Coder.addCoder(ComponentCoder);
    }

    return ComponentCoder;

}));