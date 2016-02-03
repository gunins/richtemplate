define(function () {
    return function(data, children, data, node){
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