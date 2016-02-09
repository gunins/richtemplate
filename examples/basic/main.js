var check = function () {
    'use strict';

    if (typeof Symbol == 'undefined') return false;
    try {
        eval('class Foo {}');
        eval('var bar = (x) => x+1');
    } catch (e) {
        return false;
    }

    return true;
}();

var target = check ? 'es6' : 'es5'
require({
    baseUrl: '../../target/' + target + '/basic',
    paths:   {
        'templating/Decoder':            'templating/Decoder',
        'templating/dom':                'templating/Decoder',
        'coders/component/cpDecoder':    'templating/Decoder',
        'coders/placeholders/plDecoder': 'templating/Decoder',
        'coders/databind/bdDecoder':     'templating/Decoder',
        'coders/router/routerDecoder':   'templating/Decoder',
        'coders/style/styleDecoder':     'templating/Decoder'
    }
}, ['utils/es6Features'], function (cb) {
    cb(function run() {
        require(['App'], function (App) {
        })
    },
        //Add there list of es6 feature you yse, for checking if need polyfill.
        ['Map', 'Set', 'Symbol'])


});