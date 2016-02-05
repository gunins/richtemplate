define(function () {
    return function(data, children, obj, node){
        'use strict';
        var el = document.createElement('div');
        var button = document.createElement('button');
        button.innerHTML = 'Test Button';
        el.appendChild(button);
        return{
            el: el,
            name:node.name
        }
    };

});