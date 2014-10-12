/**
 * Created by guntars on 09/10/2014.
 */
define([
    'widget/App',
    'container',
    'data'
], function (App, Container, data) {

    return App.extend({
        init:function(){
        },
        AppContainer: Container,
        setContext: function () {
            return {data: data}
        }
    });
});