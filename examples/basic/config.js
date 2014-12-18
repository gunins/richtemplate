require.config({
    baseUrl: './',
    templateCoders: [
        'coders/component/CpCoder',
        'coders/placeholders/plCoder',
        'coders/style/styleCoder'

    ],
    templateDecoders: [
        'coders/component/CpDecoder',
        'coders/placeholders/plDecoder',
        'coders/style/styleDecoder'
    ],
    paths: {
        'less': '../../node_modules/less/dist/less',
        'coders': '../../src/coders',
        'buttona': 'buttonA/buttonA',
        'templating': '../../src/templating',
        'htmlparser2': '../../lib/htmlparser2',
        'test': './test'
    }
});