define([
    'templating/parser!./button/_button.html',
    'templating/Decoder'], function (template, Decoder) {
    return function(){
        var decoder = new Decoder(template);
        var context = decoder.render();
        var el = document.createElement('div');
        el.innerText = 'Test Button';
        el.appendChild(context.fragment.firstChild);
        return{
            el: el
        }
    };

});