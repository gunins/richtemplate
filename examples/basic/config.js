require.config({
    baseUrl: './',
    templateCoders: [
        'coders/component/ComponentCoder'
    ],
    templateDecoders: [
        'coders/component/componentDecoder'
    ],
    paths: {
        'coders': '../../src/coders',
        'templating': '../../src/templating',
        'htmlparser2':'../../lib/htmlparser2',
        'test':'./test'
    }
});