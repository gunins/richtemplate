(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // AMD. Register as an anonymous module.
        define([],factory);
        ;
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Templating = root.Templating || {};
        root.Templating.DataBinding = factory();
    }
}(this, function () {

    var DataBinding = function (model) {
        this.model = model;
        this.components = [];
    };

    DataBinding.prototype.observer = function (component, id, oldValue, newValue) {
        component.setValue(newValue);
    };

    DataBinding.prototype.bind = function (prop, component) {
        this.model.watch(prop, this.observer.bind(this, component));
        this.components.push(component);
        component.setValue(this.model[prop]);
    };

    return DataBinding;

}));