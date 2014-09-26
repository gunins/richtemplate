module.exports = function (grunt) {

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
            examples: {
                options: {
                    baseUrl: 'examples/basic',
                    removeCombined: true,
                    optimize: 'none',
                    templateCoders: [
                        'coders/component/ComponentCoder'
                    ],
                    templateDecoders: [
                        'coders/component/componentDecoder'
                    ],
                    stubModules: ['templating/parser'],
                    exclude:[
                        'coders/component/ComponentCoder',
                        'coders/component/componentDecoder'],
                    dir: "examples/basic/target",
                    paths: {
                        coders: '../../src/coders',
                        templating:'../../target/dev/templating',
                        htmlparser2:'../../target/dev/htmlparser2'
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