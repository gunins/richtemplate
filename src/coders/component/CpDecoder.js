(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([
            'templating/Decoder'
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
        root.Templating.componentDecoder = factory(root.Templating.Decoder);
    }
}(this, function (Decoder) {

    var componentDecoder = {
        tagName: 'cp',
        decode: function (node, children) {
            var data = node.data;
//            console.log(node,children)
            var response =  {
                name:data.name,
                tmpEl: function(){
                    response.data.instance = new data.src(data.dataset, children);
                    return data.instance['el'];
                },
                data: data || {},
                parse:function(fragment){
                    if (children) {
                        Object.keys(children).forEach(function (key) {
                            fragment.querySelector('#'+children[key].id).remove();
                        });
                    }
                }
            };
            return response;
        }
    };

    if (Decoder) {
        Decoder.addDecoder(componentDecoder);
    }

    return componentDecoder;

}));