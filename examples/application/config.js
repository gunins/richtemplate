require.config({
    baseUrl: './src',
    templateCoders: [
        'coders/component/CpCoder',
        'coders/placeholders/plCoder',
        'coders/template/tplCoder'

    ],
    templateDecoders: [
        'coders/component/CpDecoder',
        'coders/placeholders/plDecoder',
        'coders/template/tplDecoder'
    ],
    paths: {
        'coders': '../../../src/coders',
        'templating': '../../../src/templating',
        'htmlparser2': '../../../lib/htmlparser2',
        'widget': '../../../src/widget'
    }
});
