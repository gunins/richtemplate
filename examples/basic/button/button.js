define([
    'templating/parser!./_button.html',
    'templating/Decoder'
], function (template, Decoder) {
    function append(parent, child){
        child.data.attribs={};
        child.run(parent.el, true);

    }
    return function(data, children, obj){
        var decoder = new Decoder(template);
<<<<<<< HEAD:examples/basic/button.js
        var context = decoder.render(obj);
        console.log(context, children)
=======
        var context = decoder.render();
>>>>>>> develop:examples/basic/button/button.js
        var els = context.children;

        append(els.header, children.header);
        append(els.footer, children.footer);
        return{
            el: context.fragment
        }
    };

});