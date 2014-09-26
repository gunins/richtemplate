module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['target'],
        exec: {
            browserify: 'browserify -o lib/htmlparser2.js -r htmlparser2 -s htmlparser'
        },
        requirejs: {
            main: {
                options: {
                    baseUrl: 'src',
                    optimize: 'none',
                    out: "target/templating.js",
                    paths: {
                        'templating': 'main',
                        'templating/Coder': './Coder',
                        'templating/DOMParser': './DOMParser',
                        'templating/Decoder': './Decoder',
                        'templating/utils': './utils',
                        'htmlparser2': '../lib/htmlparser2'
                    },
                    name: 'templating',
                    include: [
                        'templating/utils',
                        'templating/DOMParser',
                        'templating/Coder',
                        'templating/Decoder'
                    ],
                    shim: {
                        templating: {
                            deps: [
                                'templating/utils',
                                'templating/DOMParser',
                                'templating/Coder',
                                'templating/Decoder'
                            ]
                        }}
                }
            },
            examples: {
                options: {
                    baseUrl: 'examples',
                    removeCombined: true,
                    optimize: 'none',
                    templateCoders: [
                        'coders/component/ComponentCoder'
                    ],
                    templateDecoders: [
                        'coders/component/componentDecoder'
                    ],
                    stubModules: ['templating/main', 'text'],
                    exclude:['templating','coders/component/ComponentCoder', 'templating/Decoder', 'coders/component/componentDecoder'],
                    out: "target/test.js",
                    paths: {
                        coders: '../src/coders',
                        templating:'../target/templating'
                    },
                    name: 'test'

                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-exec');


    grunt.registerTask('default', ['clean', 'exec', 'requirejs']);

};