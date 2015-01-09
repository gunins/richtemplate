require.config({
    baseUrl: './',
    templateCoders: [
        'coders/component/CpCoder',
        'coders/placeholders/plCoder',
        'coders/router/RouterCoder',
        'coders/style/styleCoder'

    ],
    templateDecoders: [
        'coders/component/CpDecoder',
        'coders/placeholders/plDecoder',
        'coders/router/routerDecoder',
        'coders/style/styleDecoder'
    ],
    paths: {
        'less': '../../node_modules/less/dist/less',
        'coders': '../../src/coders',
        'templating': '../../src/templating',
        'templating/htmlparser2': '../../lib/htmlparser2'
    }
});