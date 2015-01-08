module.exports = function (grunt) {
    var coders = {
        templateCoders: [
            'coders/component/CpCoder',
            'coders/placeholders/plCoder',
            'coders/databind/bdCoder',
            'coders/router/RouterCoder',
            'coders/style/styleCoder'

        ],
        templateDecoders: [
            'coders/component/CpDecoder',
            'coders/placeholders/plDecoder',
            'coders/databind/bdDecoder',
            'coders/router/RouterDecoder',
            'coders/style/styleDecoder'

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
            npmpack: 'npm pack dist',
            publish: 'npm publish dist'
        },
        requirejs: {
            dev: {
                options: {
                    baseUrl: 'src',
                    optimize: 'none',
                    dir: 'target/dev',
                    paths: {
                        htmlparser2: '../lib/htmlparser2'
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
            style: {
                options: {
                    baseUrl: 'src',
                    optimize: 'none',
                    dir: 'target/dev',
                    paths: {
                        htmlparser2: '../lib/htmlparser2',
                        'less': '../node_modules/less/dist/less'
                    },
                    name: 'coders/style/styleCoder',
                    exclude: [
                        'templating/Coder',
                        'less'
                    ]
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
                            exclude: [
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
                        },
                        {
                            name: 'coders/style/styleDecoder',
                            exclude: [
                                'templating/utils',
                                'templating/Decoder'
                            ]
                        }
                    ]
                }
            },
            example: {
                options: {
                    baseUrl: 'examples/basic',
                    removeCombined: true,
                    optimize: 'none',
                    templateCoders: [
                        'coders/component/CpCoder',
                        'coders/placeholders/plCoder',
                        'coders/router/RouterCoder',
                        'coders/style/styleCoder'

                    ],
                    templateDecoders: [
                        'coders/component/CpDecoder',
                        'coders/placeholders/plDecoder',
                        'coders/router/RouterDecoder',
                        'coders/style/styleDecoder'
                    ],
                    stubModules: [
                        'templating/parser'
                    ],
                    paths: {
                        'coders': '../../dist/dev/coders',
                        'templating': '../../dist/dev/templating',
                        'htmlparser2': '../../dist/dev/htmlparser2',
                        'less': '../../node_modules/less/dist/less'
                    },
                    exclude: [
                        'coders/component/CpCoder',
                        'coders/component/CpDecoder',
                        'coders/placeholders/plCoder',
                        'coders/placeholders/plDecoder',
                        'coders/databind/bdDecoder',
                        'coders/databind/bdCoder',
                        'coders/style/styleCoder',
                        'coders/style/styleDecoder',
                        'coders/router/RouterCoder',
                        'coders/router/RouterDecoder',
                        'templating/Coder',
                        'templating/Decoder',
                        'templating/utils'

                    ],
                    dir: 'target/basic',
                    name: 'App'
                }
            }
        },
        copy: {
            dev: {
                files: [

                    // includes files within path and its sub-directories
                    {expand: true, cwd: 'target/dev', src: ['coders/**'], dest: 'dist/dev'},
                    {expand: true, cwd: 'target/dev', src: ['templating/**'], dest: 'dist/dev'},
                    {expand: true, cwd: 'target/dev', src: ['htmlparser2.js'], dest: 'dist/dev'},
                    {expand: true, cwd: 'node_modules/less/dist/', src: ['less.js'], dest: 'dist/dev'},
                    {expand: true, cwd: './', src: ['package.json', 'bower.json', 'README.md'], dest: 'dist'}

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
                    'target/prod/coders/style/styleDecoder.js',
                    'target/prod/templating/Decoder.js'
                ],
                dest: 'dist/prod/templating/Decoder.js'
            }
        },
        mocha_phantomjs: {
            dev: {
                options: {
                    urls: [
                        'http://localhost:8000/test/dev/index.html'
                    ]
                }
            },
            prod: {
                options: {
                    urls: [
                        'http://localhost:8000/test/prod/index.html'
                    ]
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 8000,
                    base: '.'
                }
            }
        },
        bump: {
            options: {
                files: ['package.json', 'bower.json', 'dist/package.json', 'dist/bower.json'],
                commit: true,
                commitFiles: ['package.json', 'bower.json', 'dist/*'],
                createTag: true,
                tagName: '%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin'
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-phantomjs');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-bump');

    grunt.registerTask('test', ['requirejs:example', 'connect', 'mocha_phantomjs']);
    grunt.registerTask('reqTemplate', ['requirejs:dev', 'requirejs:style', 'requirejs:prod'])
    grunt.registerTask('default', ['clean', 'exec:browserify', 'reqTemplate', 'copy', 'concat', 'test']);
    grunt.registerTask('publish', ['default', 'bump', 'exec:publish']);

};