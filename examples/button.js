define(function () {
    return function(){

        var el = document.createElement('button');
        el.innerText = 'Test Button';
        return{
            el: el
        }
    };

});