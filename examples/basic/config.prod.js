require.config({
    baseUrl: '../../target/es6/basic',
    templateCoders: [
        'coders/component/cpCoder',
        'coders/placeholders/plCoder',
        'coders/databind/bdCoder',
        'coders/router/RouterCoder',
        'coders/style/styleCoder'

    ],
    templateDecoders: [
        'coders/component/cpDecoder',
        'coders/placeholders/plDecoder',
        'coders/databind/bdDecoder',
        'coders/router/routerDecoder',
        'coders/style/styleDecoder'
    ],
    paths: {
        'templating/less': '../../../node_modules/less/dist/less',
        'coders': '../prod/coders',
        'templating/Decoder': '../prod/templating/Decoder',
        'templating/dom': '../prod/templating/Decoder'
    }
});