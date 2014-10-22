define([
    'templating/parser!./sidebar/_sideBar.html',
    'widget/Constructor'
], function (template, Constructor) {
    return Constructor.extend({
        template: template,
        init: function (data) {
            console.log(this)
        },
        nodes: {
            link: function (el, parent, data) {
                el.add(parent);
                el.text(data.text);
                el.setAttribute('href', data.href);
            }
        },
        bind: {
            links:function (el, data) {
            el.addClass(data.class);
        }
}
    });

});