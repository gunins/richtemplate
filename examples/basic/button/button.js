define([
    'templating/parser!./_button.html',
    'templating/Decoder'
], function (template, Decoder) {
    function append(parent, child){
        //child.data.attribs={};
        let key = [...parent.els.keys()][0];
        child.run(key);
    }
    return function(data, children){
        var decoder = new Decoder(template);
        var context = decoder.render();
        var els = context.children;
        append(els.header, children.header);
        append(els.footer, children.footer);
        //console.log(context);
        return{
            el: context.fragment
        }
    };

});