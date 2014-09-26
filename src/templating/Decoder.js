(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([
            'templating/utils'
        ], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./utils'));
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.Decoder = factory(root.Templating.utils);
    }
}(this, function (utils) {

    /**
     *
     * @constructor
     * @param root
     */
    function Decoder(root) {
//        var root = JSON.parse(template);
//        console.log('Decoder: Template deserialization: ', root);
        this._root = (typeof root === 'string') ? JSON.parse(root) : root;
    }

    var _decoders = {};

    utils.merge(Decoder, {
        addDecoder: function (decoder) {
            _decoders[decoder.tagName] = decoder;
        }
    });
    utils.merge(Decoder.prototype, {
        addDecoder: Decoder.addDecoder,
        _renderFragment: function (context, root) {
            var el = document.createElement('div');
            el.innerHTML = root.template;
            var fragment = document.createDocumentFragment();
            fragment.appendChild(el.firstChild);


            if (root.elements) {
                root.elements.forEach(function (node) {
                    var htmlElement = _decoders[node.tagName].decode(node, context, this._renderFragment.bind(this, context));
                    var placeholder = fragment.querySelector('#' + node.id);
                    placeholder.parentNode.replaceChild(htmlElement, placeholder);
                }.bind(this));
            }

            return fragment;
        },

        render: function () {
            var context = {};

            context.fragment = this._renderFragment(context, this._root);

//        console.log('Rendering context: ', context);

            return context;
        }
    });


    return Decoder;

}));