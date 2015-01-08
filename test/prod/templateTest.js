/*globals describe, it*/
// AMD. Register as an anonymous module.
define([
    'chai',
    'templating/Decoder',
    'App'
], function (chai, Decoder, template) {
    var expect = chai.expect;
    /*  var decoder = new Decoder(template);
     var context = decoder.render();
     var el = document.createElement('div');
     el.appendChild(context.fragment);*/

    describe('Templating Tests for compiled source', function () {
        describe('Checking if Template parsed correctly', function () {
            it('first children should be a Style', function () {
                var children = template.children[0],
                    templateId = template.templateId;
                expect(children.data.style).to.equal('div.' + templateId +
                                                     ' {\n  margin: 5px;\n  padding: 15px;\n  border: solid #008000 2px;\n}\n');
            });
            it('Second children should be a Component', function () {
                var children = template.children[1];
                expect(children.data.type).to.equal('cp');
                expect(children.data.src).to.be.a('function');
                expect(children.children.length).to.equal(2);
                expect(children.data.dataset.test).to.equal('test');
            });
            it('Fourth children should be a placeHolder', function () {
                var children = template.children[3];
                var data = children.data;
                expect(data.name).to.equal('footer');
                expect(data.type).to.equal('pl');
                expect(data.dataset.size).to.equal('34');
                expect(data.dataset.item).to.equal('test item');

            });
        });

    });
});
