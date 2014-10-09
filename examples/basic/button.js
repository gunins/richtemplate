define([
    'templating/parser!./button/_button.html',
    'templating/Decoder'
], function (template, Decoder) {
    return function(data, children){
        console.log(children)
        var decoder = new Decoder(template);
        var context = decoder.render();
        var els = context.children;
        els.header.el.appendChild(children.header.el);
        els.footer.el.appendChild(children.footer.el);

        return{
            el: context.fragment.firstChild
        }
    };

});