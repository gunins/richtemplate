require.config({
    baseUrl: './',
    templateCoders: [
        'coders/component/CpCoder',
        'coders/placeholders/plCoder',
        'coders/databind/bdCoder',
        'coders/router/RouterCoder',
        'coders/style/styleCoder'

    ],
    templateDecoders: [
        'coders/component/CpDecoder',
        'coders/placeholders/plDecoder',
        'coders/databind/bdDecoder',
        'coders/router/routerDecoder',
        'coders/style/styleDecoder'
    ],
    paths: {
        'templating/less': '../../node_modules/less/dist/less',
        'coders': '../../src/coders',
        'templating': '../../src/templating',
        'templating/htmlparser2': '../../lib/htmlparser2'
    }
});