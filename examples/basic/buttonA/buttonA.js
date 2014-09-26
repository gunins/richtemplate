define(function () {
    return function(){
        var el = document.createElement('button');
        el.innerText = 'Other test';
        return{
            el: el
        }
    };

});