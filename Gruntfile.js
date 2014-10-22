module.exports = function (grunt) {
    var coders = {
        templateCoders: [
            'coders/component/CpCoder',
            'coders/placeholders/plCoder',
            'coders/databind/bdCoder'
        ],
        templateDecoders: [
            'coders/component/CpDecoder',
            'coders/placeholders/plDecoder',
            'coders/databind/bdDecoder'
        ],
        exclude: [
            'coders/component/CpCoder',
            'coders/component/CpDecoder',
            'coders/placeholders/plCoder',
            'coders/placeholders/plDecoder',
            'coders/databind/bdCoder',
            'coders/databind/bdDecoder',
            'widget/Constructor',
            'widget/App'

        ]
    }
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['target'],
        exec: {
            browserify: 'browserify -o lib/htmlparser2.js -r htmlparser2 -s htmlparser'
        },
        requirejs: {
            dev: {
                options: {
                    baseUrl: 'src',
                    optimize: 'none',
                    dir: "target/dev",
                    paths: {
                        'htmlparser2': '../lib/htmlparser2'
                    },
                    name: 'templating/parser',
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
            prod: {
                options: {
                    baseUrl: 'src',
                    optimize: 'uglify2',
                    removeCombined: true,
                    out: "target/prod/templating/Decoder.js",
                    paths: {
                        'htmlparser2': '../lib/htmlparser2'
                    },
                    name: 'templating/Decoder'
                }
            },
            basic: {
                options: {
                    baseUrl: 'examples/basic',
                    removeCombined: true,
                    optimize: 'none',
                    templateCoders: coders.templateCoders,
                    templateDecoders: coders.templateDecoders,
                    stubModules: ['templating/parser'],
                    exclude: coders.exclude,
                    dir: "examples/basic/target",
                    paths: {
                        coders: '../../src/coders',
                        buttona: 'buttonA/buttonA',
                        templating: '../../target/dev/templating',
                        htmlparser2: '../../target/dev/htmlparser2',
                        'widget': '../../src/widget'

                    },
                    name: 'test'

                }
            },
            application: {
                options: {
                    baseUrl: 'examples/application/src',
                    removeCombined: true,
                    optimize: 'none',
                    templateCoders: coders.templateCoders,
                    templateDecoders: coders.templateDecoders,
                    stubModules: ['templating/parser'],
                    exclude: coders.exclude,
                    dir: "examples/application/target",
                    paths: {
                        coders: '../../../src/coders',
                        templating: '../../../target/dev/templating',
                        htmlparser2: '../../../target/dev/htmlparser2',
                        'widget': '../../../src/widget'
                    },
                    name: 'app'

                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-exec');

    grunt.registerTask('default', ['clean', 'exec', 'requirejs']);

};