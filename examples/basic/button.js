define([
    'templating/parser!./button/_button.html',
    'templating/Decoder'
], function (template, Decoder) {
    function append(parent, child){
        child.run(parent.el, true);

    }
    return function(data, children, obj){
        var decoder = new Decoder(template);
        var context = decoder.render(obj);
        console.log(context, children)
        var els = context.children;

        append(els.header, children.header);
        append(els.footer, children.footer);

        return{
            el: context.fragment
        }
    };

});