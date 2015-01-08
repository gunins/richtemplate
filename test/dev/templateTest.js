/*globals describe, it*/
(function (root, factory) {
        // AMD. Register as an anonymous module.
        define([
            'chai',
            'templating/Decoder',
            'examples/basic/App'
        ], factory);
    }(this, function (chai, Decoder, template) {
    var expect = chai.expect;
    /*  var decoder = new Decoder(template);
     var context = decoder.render();
     var el = document.createElement('div');
     el.appendChild(context.fragment);*/

    describe('Templating Tests', function () {
        describe('Checking if Template parsed correctly', function () {
            it('first children should be a Style', function () {
                var children = template.children[0],
                templateId = template.templateId;
                expect(children.data.style).to.equal('div.' + templateId +
                                                     ' {\n  margin: 5px;\n  padding: 15px;\n  border: solid #008000 2px;\n}\n');
            });
        });

    });
}));
