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

    describe('Templating Tests for prod source', function () {

        describe('Checking if Coder', function () {
            it('first children should be a Style', function () {
                var children = template.children[0],
                    templateId = template.templateId,
                    testStyle = 'div.' + templateId + '{margin:5px;padding:15px;border:2px solid green}.header.' + templateId + '{color:green}.header.' + templateId + ':hover{color:#8b0000}table.' + templateId + '{width:100%}table.' + templateId + ' tr.' + templateId + ' td.' + templateId + '{padding:5px 10px;border:1px solid #ccc}.label.' + templateId + '{background:#ccc;border-radius:5px;font-size:.7em;color:#fff;padding:3px 10px;display:inline-block}.test.' + templateId + '>.' + templateId + '{padding:3px 5px;margin:5px;border:1px solid #ccc;border-radius:4px}';
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
                expect(children.data.dataset.test).to.deep.equal({a: 1, b: '2', c: [1, 2, 3]});
            });
            it('Seventh children should be a placeHolder', function () {
                var children = template.children[6];
                var data = children.data;
                expect(data.name).to.equal('footer');
                expect(data.type).to.equal('pl');
                expect(data.dataset.size).to.equal(34);
                expect(data.dataset.item).to.equal('test item');

            });
        });

        describe('Checking Decoder', function () {
            it('If Decoder is parsed correctly', function () {
                var root = decoder._root,
                    templateId = root.templateId,
                    template = '<div class=\"' + templateId + '\">\n    \n    <h2 class=\"' + templateId + ' header\" id=\"e21\">RootElement <span class=\"' + templateId + ' label\" id=\"e20\">Label<\/span><\/h2>\n    \n\n    <div class=\"' + templateId + '\">\n        <div id=\"e24\" style=\"display:none\"><\/div>\n    <\/div>\n    <div class=\"' + templateId + ' test\"><span class=\"' + templateId + '\">This text has to be bordered<\/span><\/div>\n    \n    <div id=\"e30\" style=\"display:none\"><\/div>\n    <div id=\"e31\" style=\"display:none\"><\/div>\n<\/div>';

                expect(root.template).to.equal(template);
                expect(root.children.length).to.equal(7);
            });
            it('Decoder Rendering items correctly', function () {
                var context = decoder.render(template),
                    children = context.children,
                    footer = children.footer.elGroup.first,
                    testthing = children.testthing.elGroup.first;

                expect(footer.data.dataset).to.deep.equal({item: 'test item', size: 34});
                expect(footer.data.type).to.equal('pl');
                expect(footer.el).to.be.instanceof(HTMLElement);

                expect(testthing.el).to.be.instanceof(HTMLElement);
            });
        });

        describe('Checking parsed DOM', function () {
            it('if templateId is generated, and generated elements are attached to Node', function () {
                var context = decoder.render(template),
                    footer = context.children.footer.elGroup.first,
                    templateId = decoder._root.templateId,
                    els = Array.prototype.slice.call(context.fragment.querySelectorAll('.' + templateId));
                expect(els.length).to.equal(6);
                expect(els.indexOf(footer.el)).to.equal(5);
            });
            it('if multiple templates are rendered and they not use same elements', function () {
                var templateId = template.templateId,
                    context = decoder.render(template),
                    els = Array.prototype.slice.call(context.fragment.querySelectorAll('.' + templateId)),
                    contextA = decoder.render(template),
                    elsA = Array.prototype.slice.call(contextA.fragment.querySelectorAll('.' + templateId));

                expect(contextA).not.to.equal(context);
                expect(els.length).to.equal(elsA.length);
                expect(els.length).to.equal(6);
                expect(elsA.length).to.equal(6);
                els.forEach(function (el) {
                    expect(elsA.indexOf(el)).to.equal(-1);
                })
            });
        });
    });
});