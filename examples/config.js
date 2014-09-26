require.config({
    baseUrl: './',
    templateCoders: [
        'coders/component/ComponentCoder'
    ],
    templateDecoders: [
        'coders/component/componentDecoder'
    ],
    paths: {
        coders: '../src/coders',
//        htmlparser2: '../lib/htmlparser2'
        templating: '../target/templating',
        'templating/Decoder': '../target/templating',
        'test':'../target/test'
    },
    /*packages: [
        {
            name: 'templating',
            location: '../src'
        }
    ]*/
});