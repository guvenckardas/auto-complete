/**
 * Created by gkardas on 12/02/15.
 */


module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cssmin: {
            options: {
                compatibility: 'ie7'

            },
            target: {
                files:{
                    'test/assets/css/g-auto-complete.min.<%= pkg.version %>.css':['workspace/assets/css/style.css']
                }
            }
        },
        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: false,
                pushTo: 'upstream',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
                globalReplace: false
            }
        },
        uglify: {
            options: {
                mangle: {
                    except: ['jQuery']
                }
            },
            my_target: {
                files: {
                    'test/js/g-auto-complete.min.<%= pkg.version %>.js': ['workspace/js/auto-complete.js']
                }
            }
        },
        copy: {
            js:{
                expand: true,
                cwd: 'workspace/js/lib/',
                src: ['**'],
                dest: 'test/js/lib/',
                flatten: true
            },
            img:{
                expand: true,
                cwd: 'workspace/assets/img/',
                src: ['**'],
                dest: 'test/assets/img/',
                flatten: true
            }
        },
        injector: {
            options: {
                template: 'workspace/index.html',
                relative: false,
                ignorePath:'test/',
                addRootSlash: false
            },
            defaults: {
                files: {
                    'test/index.html': ['test/js/*.js', 'test/assets/css/*.css']
                }
            }
        }

    });

    grunt.registerTask('preProd','Prepare dest for production',function(){

        // TODO remove files inside
        var fs = require('fs');


        var deleteFolderRecursive = function(path) {
            if( fs.existsSync(path) ) {
                fs.readdirSync(path).forEach(function(file,index){
                    var curPath = path + "/" + file;
                    if(fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };

        deleteFolderRecursive('test')

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-injector');



    grunt.registerTask('buildRelease', ['preProd','cssmin','uglify','injector','copy:js','copy:img']);

};
