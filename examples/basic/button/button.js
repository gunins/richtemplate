define([
    'templating/parser!./_button.html',
    'templating/Decoder'
], function (template, Decoder) {
    function append(parent, child){
        child.data.attribs={};
        child.run(parent._node.el, true);


    }
    return function(data, children){
        var decoder = new Decoder(template);
        var context = decoder.render();
        var els = context.children;

        append(els.header, children.header);
        append(els.footer, children.footer);
        return{
            el: context.fragment
        }
    };

});