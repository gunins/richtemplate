module.exports = function (grunt) {
    var coders = {
        templateCoders: [
            'coders/component/CpCoder',
            'coders/placeholders/plCoder',
            'coders/databind/bdCoder',
            'coders/router/RouterDecoder'
        ],
        templateDecoders: [
            'coders/component/CpDecoder',
            'coders/placeholders/plDecoder',
            'coders/databind/bdDecoder',
            'coders/router/RouterDecoder'
        ],
        exclude: [
            'coders/component/CpCoder',
            'coders/component/CpDecoder',
            'coders/placeholders/plCoder',
            'coders/placeholders/plDecoder',
            'coders/databind/bdDecoder',
            'coders/databind/bdCoder',
            'coders/router/RouterCoder',
            'coders/router/RouterDecoder',
            'templating/Decoder'

        ]
    }
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['target', 'dist'],
        exec: {
            browserify: 'browserify -o lib/htmlparser2.js -r htmlparser2 -s htmlparser',
            npmpack:'npm pack dist',
            publish:'npm publish dist'
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
                            name: 'coders/component/CpDecoder',
                            exclude:[
                                'templating/Decoder'
                            ]
                        },
                        {
                            name: 'coders/placeholders/plDecoder',
                            exclude: [
                                'templating/utils',
                                'templating/Decoder'
                            ]
                        },
                        {
                            name: 'coders/databind/bdDecoder',
                            exclude: [
                                'templating/utils',
                                'templating/Decoder'
                            ]
                        },
                        {
                            name: 'coders/router/RouterDecoder',
                            exclude: [
                                'templating/utils',
                                'templating/Decoder'
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
                    {expand: true, cwd:'./', src: ['package.json','bower.json', 'README.md'], dest: 'dist'}

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
                    'target/prod/coders/router/RouterDecoder.js',
                    'target/prod/templating/Decoder.js'
                ],
                dest: 'dist/prod/templating/Decoder.js'
            }
        },
        bump: {
            options: {
                files: ['package.json', 'bower.json', 'dist/package.json', 'dist/bower.json'],
                commit: true,
                commitFiles: ['package.json', 'bower.json', 'dist/package.json', 'dist/bower.json'],
                createTag: true,
                tagName: '%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-bump');


    grunt.registerTask('default', ['clean', 'exec:browserify', 'requirejs', 'copy', 'concat']);
    grunt.registerTask('publish', ['default', 'bump', 'exec:publish']);

};