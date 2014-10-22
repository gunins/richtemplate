define([
    'templating/parser!./table/_table.html',
    'widget/Constructor'
], function (template, Constructor) {

    return Constructor.extend({
        template: template,
        init: function () {
            var evt = this.children.testevent.on('click', function (e) {
                alert('click');
                evt.remove();
            });
        },
        events: {
            tbody: [
                {
                    name: 'click',
                    action: function (e, node) {
                        node.warning = node.warning || false;
                        if (!node.warning) {
                            node.warning = true;
                            node.addClass('warning');
                        } else {
                            node.warning = false;
                            node.removeClass('warning');

                        }
                    }
                }
            ]

        },
        nodes: {
            header: function (el, parent) {
                el.replace(parent);
                this.applyBinders(this.data, parent);
            },
            link:function(el, parent, data){
                el.add(parent);
                el.text(data.text);
                el.setAttribute('href', data.href);

            },
            value: function (el, parent, data) {
                el.add(parent);
                el.text(data.text);
                el.setStyle('color', data.color);
            }
        },
        bind:{
            tbody:function(el, data){
                el.addClass(data.class);
            }
        }

    });

});