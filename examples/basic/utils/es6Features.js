/**
 * Created by guntars on 15/01/2016.
 */
define(['require'], function (require) {
    function testGlobal(method) {
        return this[method] === undefined;
    }
    return function (done, methods) {
        var global = this;
        if (methods.filter(testGlobal.bind(global)).length > 0) {
            require(['babel/polyfill'], function () {
                done();
            });
        } else {
            done();
        }
    }.bind(this);
});
