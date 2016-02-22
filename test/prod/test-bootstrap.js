// PhantomJS doesn't support bind yet
if (Function.prototype.bind === undefined) {
    (function () {
        var Ap = Array.prototype;
        var slice = Ap.slice;
        var Fp = Function.prototype;

        if (!Fp.bind) {
            // PhantomJS doesn't support Function.prototype.bind natively, so
            // polyfill it whenever this module is required.
            Fp.bind = function (context) {
                var func = this;
                var args = slice.call(arguments, 1);

                function bound() {
                    var invokedAsConstructor = func.prototype && (this instanceof func);
                    return func.apply(
                        // Ignore the context parameter when invoking the bound function
                        // as a constructor. Note that this includes not only constructor
                        // invocations using the new keyword but also calls to base class
                        // constructors such as BaseClass.call(this, ...) or super(...).
                        !invokedAsConstructor && context || this,
                        args.concat(slice.call(arguments))
                    );
                }

                // The bound function must share the .prototype of the unbound
                // function so that any object created by one constructor will count
                // as an instance of both constructors.
                bound.prototype = func.prototype;

                return bound;
            };
        }
    })();
}

function testGlobal(method) {
    return this[method] === undefined;
}
function testEs6(done, methods) {
    var global = this;
    if (methods.filter(testGlobal.bind(global)).length > 0) {
        require(['babel/polyfill'], function () {
            done();
        });
    } else {
        done();
    }
};

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
require.config({
    baseUrl:          '../../dist/' + target + '/prod/',
    templateDecoders: [
        'coders/component/CpDecoder',
        'coders/placeholders/plDecoder',
        'coders/databind/bdDecoder',
        'coders/router/RouterDecoder',
        'coders/style/styleDecoder'
    ],
    paths:            {
        test:             '../../../test/prod',
        template:         '../../../target/' + target + '/basic/template',
        'babel/polyfill': '../../../target/' + target + '/basic/babel/polyfill',
        chai:             "../../../node_modules/chai/chai"
    },
    shim:             {
        'template': {
            deps: ['templating/Decoder']
        }
    }
});
mocha.ui('bdd');
testEs6(function run() {
        require([
            'test/templateTest'
        ], function () {

            if (window.mochaPhantomJS) {
                window.mochaPhantomJS.run();
            }
            else {
                mocha.run();
            }

        });
    },
    //Add there list of es6 feature you yse, for checking if need polyfill.
    ['Map', 'Set', 'Symbol'])
