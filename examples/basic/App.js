define([
    'templating/parser!./template.html',
    'templating/Decoder'
], function (template, Decoder) {
    'use strict';
    var decoder = new Decoder(template);
    var context = decoder.render({
        test: {
            testButton: 'item Button'
        }
    });

    var el = document.getElementById('el');
    el.appendChild(context.fragment);

    console.log(context);
    var a = context.children.test.run(true);
    var cmp = a.children.testthing.run();//.el.innerHTML = 'Test 1';
    var aChild = a.children.extra.run(true);
    aChild.text('item 1');
    aChild.clone(true, 0).text('item 2');
    aChild.clone(true, 1).text('item 3');
    aChild.clone(true, 0).text('item 4');

    console.log(aChild);

//        console.log(cmp)
    var b = context.children.test.run(true);
    let testthing = b.children.testthing;
    testthing.run();//.el.innerHTML = 'Test 1';
    var c = context.children.test.run(true, 1);
    c.children.testthing.run();//.el.innerHTML = 'Test 1';
//        console.log(c);


    var contextA = decoder.render({
        test: {
            testButton: 'item Another'
        }
    });

    var el = document.getElementById('el1');
    el.appendChild(contextA.fragment);
    var a = contextA.children.test.run(true);
    var cmp = a.children.testthing.run();//.el.innerHTML = 'Test 1';
    var aChild = a.children.extra.run(true).text('Completely different');


});