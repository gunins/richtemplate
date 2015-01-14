define(function () {
    return function(){
        var el = document.createElement('div');
        var button = document.createElement('button');
        button.innerHTML = 'Test Button';
        el.appendChild(button);
        return{
            el: el
        }
    };

});