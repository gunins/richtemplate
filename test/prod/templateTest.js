/*globals describe, it*/
// AMD. Register as an anonymous module.
define([
    'chai',
    'templating/Decoder',
    'App'
], function (chai, Decoder, template) {
    var decoder, context, el, expect;

    expect = chai.expect;

    decoder = new Decoder(template);
    context = decoder.render();
    el = document.createElement('div');
    el.appendChild(context.fragment);

    describe('Templating Tests for compiled source', function () {

        describe('Checking if Coder', function () {
            it('first children should be a Style', function () {
                var children = template.children[0],
                    templateId = template.templateId;
                expect(children.data.style).to.equal('div.'+templateId+'{margin:5px;padding:15px;border:2px solid green}.header.'+templateId+'{color:green}.header.'+templateId+':hover{color:#8b0000}');

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

        describe('Checking Decoder', function () {
            it('If Decoder is parsed correctly', function () {
                var root = decoder._root,
                    templateId = root.templateId,
                    template = '<div class="' + templateId + '">\n    ' +
                               '\n    <h2 class="'+templateId+' header">RootElement Header</h2>' +
                                  '\n    <div id="e2" style="display:none"></div>\n    \n' +
                               '    <div id="e3" style="display:none"></div>\n</div>';

                expect(root.template).to.equal(template);
                expect(root.children.length).to.equal(4);
            });
            it('Decoder Rendering items correctly', function () {
                var children = context.children,
                    footer = children.footer,
                    testthing = children.testthing;
                expect(footer.data.dataset).to.deep.equal({item: 'test item', size: '34'});
                expect(footer.data.type).to.equal('pl');
                expect(footer._node.el).to.be.instanceof(HTMLElement);
            });
        });

        describe('Checking parsed DOM', function () {
            it('if templateId is generated, and generated elements are attached to Node', function () {
                var templateId = decoder._root.templateId,
                    els = Array.prototype.slice.call(el.querySelectorAll('.' + templateId));
                expect(els.length).to.equal(3);
                expect(els.indexOf(context.children.footer._node.el)).to.equal(2);
            });
        });
    });
});
