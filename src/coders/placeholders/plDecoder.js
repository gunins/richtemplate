(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([
            'templating/Decoder',
            'templating/utils'
        ], factory)
        ;
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./Decoder'), require('./DataBinding'), require('./utils'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.componentDecoder = factory(root.Templating.Decoder, root.Templating.DataBinding, root.Templating.utils);
    }
}(this, function (Decoder, utils) {

    var componentDecoder = {
        tagName: 'pl',
        decode: function (node, context, render) {
            /*     context.bind = context.bind || function (model) {
             var binding = new DataBinding(model);
             for (var name in this.bindings) {
             //noinspection JSUnfilteredForInLoop
             binding.bind(name, this.bindings[name]);
             }
             };*/

            var data = node.data;
//            data.instance = new data.src(data.dataset);
            var el = document.createElement('div'); //render(data);
            if (data.name) {
                context.placeholders = context.placeholders || {};
                context.placeholders[data.name] = {
                    el: el,
                    data: data
                }

            }

            /*       if (data.bind) {
             context.bindings = context.bindings || {};
             context.bindings[data.bind] = data.instance;
             }
             */
            /*     if (data.placeholders) {
             for (var i = 0; i < data.placeholders.length; i++) {
             var name = data.placeholders[i].placeholder;
             var el = render(data.placeholders[i].element);
             data.instance[name](el);
             }
             }*/
            return el;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;

}));