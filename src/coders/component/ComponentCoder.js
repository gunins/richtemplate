(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['../../Coder'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
    // Browser globals (root is window)
    root.Templating = root.Templating || {};
    root.Templating.ComponentCoder = factory(root.Templating.Coder);
}
}(this, function (Coder) {

    var ComponentCoder = {
        tagName: 'component',
        code: function (nodeContext) {
            var children = nodeContext.getChildrenByTagName('component');
            var placeholders = [];
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                placeholders.push({
                    placeholder: child.name,
                    element: nodeContext.compile(nodeContext.findChild(child))
                });
            }
            var dataset = {};
            var attributes = nodeContext.element.attributes;

            for (var name in attributes) {
                //noinspection JSUnfilteredForInLoop
                if (name.indexOf('data-') == 0 && name.length > 5) {
                    //noinspection JSUnfilteredForInLoop
                    dataset[name.substr(5)] = attributes[name];
                }
            }

            return {
                src: nodeContext.get('src'),
                name: nodeContext.get('name'),
                bind: nodeContext.get('bind'),
                dataset: dataset,
                placeholders: placeholders
            };
        }
    };

    if (Coder) {
        Coder.addCoder(ComponentCoder);
    }

    return ComponentCoder;

}));