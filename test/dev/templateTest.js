/* globals describe, it, expect, beforeEach */
define([
    'chai',
    'templating/Decoder',
    'template'
], function (chai, Decoder, template) {
    'use strict';
    var decoder, expect;
    expect = chai.expect;
    decoder = new Decoder(template);
    //context = decoder.render();
    //el = document.createElement('div');
    //el.appendChild(context.fragment);

    describe('Templating Tests for dev source', function () {

        describe('Checking if Coder', function () {
            it('first children should be a Style', function () {
                var children = template.children[0],
                    templateId = template.templateId,
                    testStyle = 'div.' + templateId + '{margin:5px;padding:15px;border:2px solid green}.header.' + templateId + '{color:green}.header.' + templateId + ':hover{color:#8b0000}table.' + templateId + '{width:100%}table td.' + templateId + '{padding:5px 10px;border:1px solid #ccc}.label.' + templateId + '{background:#ccc;border-radius:5px;font-size:.7em;color:#fff;padding:3px 10px;display:inline-block}';
                expect(children.data.style).to.equal(testStyle);
            });
            it('Second children should be a just selected element', function () {
                var children = template.children[1];
                expect(children.data.type).to.equal('h2');
                expect(children.children).to.be.undefined;
            });

            it('third children should be a Component', function () {
                var children = template.children[3];
                expect(children.data.type).to.equal('cp');
                expect(children.data.src).to.be.a('function');
                expect(children.children.length).to.equal(2);
                expect(children.data.dataset.test).to.equal('test');
            });
            it('Seventh children should be a placeHolder', function () {
                var children = template.children[6];
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
                    template = '<div class=\"'+templateId+'\">\n    \n    <h2 class=\"'+templateId+' header\" id=\"e21\">RootElement <span class=\"'+templateId+' label\" id=\"e20\">Label</span></h2>\n    \n\n    <div class=\"'+templateId+'\"><div id=\"e24\"></div></div>\n\n    \n    <div id=\"e30\"></div>\n    <div id=\"e31\"></div>\n</div>';
                expect(root.template).to.equal(template);
                expect(root.children.length).to.equal(7);
            });
            it('Decoder Rendering items correctly', function () {
                var context = decoder.render(template),
                    children = context.children,
                    footer = children.footer.elGroup.getValueByIndex(0),
                    testthing = children.testthing.elGroup.getValueByIndex(0);
                console.log(footer, testthing)

                expect(footer.dataset).to.deep.equal({item: 'test item', size: '34'});
                expect(footer._node.data.type).to.equal('pl');
                expect(footer.el).to.be.instanceof(HTMLElement);

                expect(testthing.el).to.be.instanceof(HTMLElement);
            });
        });

        describe('Checking parsed DOM', function () {
            it('if templateId is generated, and generated elements are attached to Node', function () {
                var context = decoder.render(template),
                    footer = context.children.footer.elGroup.getValueByIndex(0),
                    templateId = decoder._root.templateId,
                    els = Array.prototype.slice.call(context.fragment.querySelectorAll('.' + templateId));
                expect(els.length).to.equal(4);
                expect(els.indexOf(footer.el)).to.equal(3);
            });
            it('if multiple templates are rendered and they not use same elements', function () {
                var templateId = template.templateId,
                    context = decoder.render(template),
                    els = Array.prototype.slice.call(context.fragment.querySelectorAll('.' + templateId)),
                    contextA = decoder.render(template),
                    elsA = Array.prototype.slice.call(contextA.fragment.querySelectorAll('.' + templateId));

                expect(contextA).not.to.equal(context);
                expect(els.length).to.equal(elsA.length);
                expect(els.length).to.equal(4);
                expect(elsA.length).to.equal(4);
                els.forEach(function (el) {
                    expect(elsA.indexOf(el)).to.equal(-1);
                })
            });
        });
    });
});