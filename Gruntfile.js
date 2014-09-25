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
                    baseUrl: 'node_modules/htmlparser2/lib',
                    out: "target/main.js",
                    "name": 'index',
                    removeCombined: true,
                    optimize: 'none'

                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-exec');


    grunt.registerTask('default', ['clean', 'exec', 'requirejs']);

};