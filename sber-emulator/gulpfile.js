var gulp = require('gulp');
var path = require('path');
var apidoc = require('gulp-apidoc');
var eslint = require('gulp-eslint');


gulp.task('doc', function () {
    apidoc({
        src: path.join(__dirname, './app/modules'),
        dest: path.join(__dirname, './public/doc'),
        debug: false
    }, function(error) {
        if (error) {
            console.log(error);
        }
    });
});


gulp.task('lint', function () {
    return gulp.src('app/**/*.js')
        .pipe(eslint({
            config: 'node_modules/nodules/.eslintrc'
        }))
        .pipe(eslint.format());
});


