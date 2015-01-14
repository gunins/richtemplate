(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('coders/style/styleCoder',['templating/Coder', 'templating/less'], factory);
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
            if (item.trim().length > 0) {
                var names = item.split(',');
                names.forEach(function (name, index) {
                    var bracket = false;
                    if(name.indexOf('{')!==-1){
                        name = name.replace('{','');
                        bracket = true;
                    }

                    names[index] = name.trim()+'.'+id+((bracket)?' {':'');
                });
                content = content.replace(item, names.join(','));
            }
        }

        var classNames = content.match(/[^}]*(?=)*(\{|$)/g);

        classNames.forEach(replacer.bind(this));
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
