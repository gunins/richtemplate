(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['templating/Coder', 'less'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../../templating/Coder'), require('less'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.styleCoder = factory(root.Templating.Coder);
    }
}(this, function (Coder, less) {
    function applyId(content, id) {
        var replacer = function (item) {
            var replacer = item.substring(item.length - 1, item.length);
            var out = item.replace(replacer, '').trim();
            content = content.replace(item, out + '.' + id + replacer);
        }
        var items = content.match(/\w((?!\)).)*(\{|,)/g) || [];
        items.forEach(replacer.bind(this));
        return content;
    }

    var styleCoder = {
        tagName: 'style',
        noTag: true,
        code: function (nodeContext, data) {
            var content = nodeContext.compiler._parser.getInnerHTML(nodeContext.element),
                templateId = nodeContext.compiler.templateId;
            data.style = data.style || '';
            nodeContext.removeChildren();

            /*    var currentUrl = '@current-url: "' + config['resources'] + '/' + name.substr(0, name.lastIndexOf('/')) +
             '";';
             var resourcesUrl = '@resources-url: "' + config['resources'] + '";';*/
            less.render(applyId(content, templateId), function (e, output) {
                data.style += output.css;
            });

        }
    };

    if (Coder) {
        Coder.addCoder(styleCoder);
    }

    return styleCoder;

}));