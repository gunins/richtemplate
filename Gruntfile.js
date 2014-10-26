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
            'coders/databind/bdDecoder',
            'coders/databind/bdCoder',
            'templating/Decoder',

        ]
    }
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['target', 'dist'],
        exec: {
            browserify: 'browserify -o lib/htmlparser2.js -r htmlparser2 -s htmlparser',
            npmpack:'npm pack dist'
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
                        }
                    }
                }
            },
            prod: {
                options: {
                    baseUrl: 'src',
                    optimize: 'uglify2',
                    removeCombined: true,
                    paths: {
                        'htmlparser2': '../lib/htmlparser2'
                    },
                    dir: 'target/prod',
                    modules: [
                        {
                            name: 'templating/Decoder',
                            exclude: [
                                'templating/utils'
                            ]
                        },
                        {
                            name: 'coders/component/CpDecoder'
                        },
                        {
                            name: 'coders/placeholders/plDecoder',
                            exclude: [
                                'templating/utils'
                            ]
                        },
                        {
                            name: 'coders/databind/bdDecoder',
                            exclude: [
                                'templating/utils'
                            ]
                        }
                    ]
                }
            }
        },
        copy: {
            dev: {
                files: [

                    // includes files within path and its sub-directories
                    {expand: true, cwd:'target/dev', src: ['coders/**'], dest: 'dist/dev'},
                    {expand: true, cwd:'target/dev', src: ['templating/**'], dest: 'dist/dev'},
                    {expand: true, cwd:'target/dev', src: ['htmlparser2.js'], dest: 'dist/dev'},
                    {expand: true, cwd:'./', src: ['package.json','bower.json'], dest: 'dist'}

                ]
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            Decoder: {

                src: [
                    'target/prod/coders/component/CpDecoder.js',
                    'target/prod/coders/placeholders/plDecoder.js',
                    'target/prod/coders/databind/bdDecoder.js',
                    'target/prod/templating/Decoder.js'
                ],
                dest: 'dist/prod/templating/Decoder.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-exec');

    grunt.registerTask('default', ['clean', 'exec:browserify', 'requirejs', 'copy', 'concat', 'exec:npmpack']);

};