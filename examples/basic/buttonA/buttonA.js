define(function () {
    return function(){
        var el = document.createElement('div');
        el.innerHTML = 'Other test';
        return{
            el: el
        }
    };

});