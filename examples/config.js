require.config({
    baseUrl:'./',
    templateCoders: [
        'coders/component/ComponentCoder'
    ],
    templateDecoders: [
        'coders/component/componentDecoder'
    ],
    paths:{
        coders:'../src/coders',
        Coder:'../src/Coder',
        Decoder:'../src/Decoder',
        DOMParser:'../src/DomParser',
        utils:'../src/utils'
    },
    packages:[
        {
            name:'templating',
            location:'../src'
        }
    ]
});