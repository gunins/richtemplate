require.config({
    baseUrl: './',
    templateCoders: [
        'coders/component/CpCoder'
    ],
    templateDecoders: [
        'coders/component/CpDecoder'
    ],
    paths: {
        'coders': '../../src/coders',
        'buttona':'buttonA/buttonA',
        'templating': '../../src/templating',
        'htmlparser2':'../../lib/htmlparser2',
        'test':'./test'
    }
});