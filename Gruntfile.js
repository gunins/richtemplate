module.exports = function (grunt) {
    var coders = {
        templateCoders:   [
            'coders/component/cpCoder',
            'coders/placeholders/plCoder',
            'coders/databind/bdCoder',
            'coders/router/routerCoder',
            'coders/style/styleCoder'

        ],
        templateDecoders: [
            'coders/component/cpDecoder',
            'coders/placeholders/plDecoder',
            'coders/databind/bdDecoder',
            'coders/router/routerDecoder',
            'coders/style/styleDecoder'

        ],
        exclude:          [
            'coders/component/cpCoder',
            'coders/component/cpDecoder',
            'coders/placeholders/plCoder',
            'coders/placeholders/plDecoder',
            'coders/databind/bdDecoder',
            'coders/databind/bdCoder',
            'coders/router/routerCoder',
            'coders/router/routerDecoder',
            'templating/Decoder'

        ]
    }
    grunt.initConfig({
        pkg:             grunt.file.readJSON('package.json'),
        clean:           {
            all:   ['target', 'dist'],
            basic: ['target/es6//basic/templating', 'target/es6/basic/coders']
        },
        exec:            {
            browserify: 'browserify -o lib/htmlparser2.js -r htmlparser2 -s htmlparser',
            npmpack:    'npm pack dist',
            publish:    'npm publish dist'
        },
        requirejs:       {
            dev:     {
                options: {
                    baseUrl:  'src',
                    optimize: 'none',
                    paths:    {
                        'templating/htmlparser2': '../lib/htmlparser2',
                        'babel/polyfill':         '../node_modules/babel-polyfill/dist/polyfill',
                        'templating/less':        '../node_modules/less/dist/less'

                    },
                    dir:      'target/es6/dev',
                    modules:  [
                        {
                            name:    'templating/parser',
                            include: [
                                'templating/DOMParser',
                                'templating/Coder',
                                'templating/Decoder'
                            ],
                            shim:    {
                                templating: {
                                    deps: [
                                        'templating/DOMParser',
                                        'templating/Coder',
                                        'templating/Decoder'
                                    ]
                                }
                            }
                        },
                        {
                            name:    'coders/style/styleCoder',
                            exclude: [
                                'templating/Coder',
                                'templating/less'
                            ]
                        },
                        {
                            name: 'babel/polyfill'

                        }
                    ]
                }
            },
            prod:    {
                options: {
                    baseUrl:        'src',
                    optimize:       'none',
                    removeCombined: true,
                    paths:          {
                        'templating/htmlparser2': '../lib/htmlparser2',
                        'babel/polyfill':         '../node_modules/babel-polyfill/dist/polyfill'
                    },
                    dir:            'target/es6/prod',
                    modules:        [

                        {
                            name:    'coders/component/cpDecoder',
                            exclude: [
                                'templating/Decoder'
                            ]
                        },
                        {
                            name:    'coders/placeholders/plDecoder',
                            exclude: [
                                'templating/Decoder'
                            ]
                        },
                        {
                            name:    'coders/databind/bdDecoder',
                            exclude: [
                                'templating/Decoder'
                            ]
                        },
                        {
                            name:    'coders/router/routerDecoder',
                            exclude: [
                                'templating/Decoder'
                            ]
                        },
                        {
                            name:    'coders/style/styleDecoder',
                            exclude: [
                                'templating/Decoder'
                            ]
                        },
                        {
                            name:    'templating/Decoder',
                            include: [
                                'coders/component/cpDecoder',
                                'coders/placeholders/plDecoder',
                                'coders/databind/bdDecoder',
                                'coders/router/routerDecoder',
                                'coders/style/styleDecoder'
                            ]

                        },
                        {
                            name: 'babel/polyfill'

                        }
                    ]
                }
            },
            example: {
                options: {
                    baseUrl:          'examples/basic',
                    removeCombined:   true,
                    optimize:         'none',
                    templateCoders:   [
                        'coders/component/cpCoder',
                        'coders/databind/bdCoder',
                        'coders/placeholders/plCoder',
                        'coders/router/routerCoder',
                        'coders/style/styleCoder'

                    ],
                    templateDecoders: [
                        'coders/component/cpDecoder',
                        'coders/databind/bdDecoder',
                        'coders/placeholders/plDecoder',
                        'coders/router/routerDecoder',
                        'coders/style/styleDecoder'
                    ],
                    stubModules:      [
                        'templating/parser'
                    ],
                    paths:            {
                        'coders':          '../../dist/es5/dev/coders',
                        'templating':      '../../dist/es5/dev/templating',
                        'babel/polyfill':  '../../node_modules/babel-polyfill/dist/polyfill',
                        'templating/less': '../../node_modules/less/dist/less'

                    },
                    exclude:          [
                        'coders/component/cpCoder',
                        'coders/component/cpDecoder',
                        'coders/placeholders/plCoder',
                        'coders/placeholders/plDecoder',
                        'coders/databind/bdDecoder',
                        'coders/databind/bdCoder',
                        'coders/style/styleCoder',
                        'coders/style/styleDecoder',
                        'coders/router/routerCoder',
                        'coders/router/routerDecoder',
                        'templating/Coder',
                        'templating/Decoder'

                    ],
                    dir:              'target/es6/basic',
                    modules:          [
                        {
                            name: 'App'
                        },
                        {
                            name: 'main'
                        },
                        {
                            name: 'babel/polyfill'

                        }
                    ]
                }
            }
        },
        copy:            {
            es6:       {
                files: [

                    // includes files within path and its sub-directories
                    {expand: true, cwd: 'target/es6/dev', src: ['coders/**'], dest: 'dist/es6/dev'},
                    {expand: true, cwd: 'target/es6/dev', src: ['templating/**'], dest: 'dist/es6/dev'},
                    {expand: true, cwd: 'target/es6/dev', src: ['htmlparser2.js'], dest: 'dist/es6/dev'},
                    {expand: true, cwd: 'target/es6/prod', src: ['templating/Decoder.js'], dest: 'dist/es6/prod'},
                    {expand: true, cwd: 'node_modules/less/dist/', src: ['less.js'], dest: 'dist/es6/dev/templating'},
                    {expand: true, cwd: './', src: ['package.json', 'bower.json', 'README.md'], dest: 'dist'}

                ]
            },
            es5:       {
                files: [
                    {expand: true, cwd: 'target/es5', src: ['**/*.js'], dest: 'dist/es5'}
                ]
            },
            basicProd: {
                files: [
                    {
                        expand: true,
                        cwd:    'target/es6/prod/templating',
                        src:    ['Decoder.js'],
                        dest:   'target/es6/basic/templating'
                    }
                ]
            }
        },
        babel:           {
            options: {
                presets: ['es2015'],
                compact: false
            },
            dev:     {
                options: {
                    sourceMap: true
                },
                files:   [{
                    expand: true,
                    cwd:    'target/es6/dev',
                    src:    '**/*.js',
                    dest:   'target/es5/dev'
                }]
            },
            prod:    {
                options: {
                    sourceMap: false
                },
                files:   [{
                    expand: true,
                    cwd:    'target/es6/prod',
                    src:    'templating/Decoder.js',
                    dest:   'target/es5/prod'
                }]
            },
            basic:   {
                options: {
                    sourceMap: false
                },
                files:   [
                    {
                        expand: true,
                        cwd:    'target/es6/basic',
                        src:    '**/*.js',
                        dest:   'target/es5/basic'
                    }
                ]
            }
        },
        uglify:          {
            options:  {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            prod:     {
                files: [{
                    expand: true,
                    cwd:    'target/es5/prod',
                    src:    '**/*.js',
                    dest:   'target/es5/prod'
                }]
            },
            polyfill: {src: ['target/es6/dev/babel/polyfill.js'], dest: 'target/es6/dist/babel/polyfill.js'},
            //main:     {src: ['target/es6/main.js'], dest: 'target/es6/main.js'}

        },
        mocha_phantomjs: {
            dev:  {
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
        connect:         {
            server: {
                options: {
                    port: 8000,
                    base: '.'
                }
            }
        },
        bump:            {
            options: {
                files:       ['package.json', 'bower.json', 'dist/package.json', 'dist/bower.json'],
                commit:      true,
                commitFiles: ['package.json', 'bower.json', 'dist/*'],
                createTag:   true,
                tagName:     '%VERSION%',
                tagMessage:  'Version %VERSION%',
                push:        true,
                pushTo:      'origin'
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-phantomjs');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-bump');

    grunt.registerTask('basic', ['requirejs:example', 'clean:basic', 'copy:basicProd', 'babel:basic']);//, 'connect', 'mocha_phantomjs']);
    grunt.registerTask('reqTemplate', ['requirejs:dev', 'requirejs:prod']);
    grunt.registerTask('default', ['clean:all', 'exec:browserify', 'reqTemplate', 'copy:es6', 'babel:dev', 'babel:prod', 'copy:es5', 'basic', 'uglify']);
    grunt.registerTask('publish', ['default', 'bump', 'exec:publish']);

};