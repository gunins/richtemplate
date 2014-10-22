define([
    'templating/parser!./sidebar/_sideBar.html',
    'widget/Constructor'
], function (template, Constructor) {
    return Constructor.extend({
        template: template,
        nodes: {
            link: function (el, parent, data) {
                el.add(parent);
                el.text(data.text);
                el.setAttribute('href', data.href);
            }
        },
        bind: {
            links: function (el, data) {
                if (data.class) {
                    el.addClass(data.class);
                }
                this.eventBus.subscribe('removeActive', function (srcEl) {
                    if (srcEl !== el) {
                        el.removeClass('active');
                    }
                }.bind(this))
            }
        },
        events: {
            links: [
                {
                    name: 'click',
                    action: function (e, el) {
                        this.eventBus.publish('removeActive', el);
                        el.addClass('active');
                    }
                }
            ]
        }
    });

});