'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const path = require('path');
const config = require('./config/config');
const apidoc = require('gulp-apidoc');
const args = require('yargs').argv;
const exec = require('child_process').exec;

// will change soon
const frontDirName = 'sber-vmeste';

var environment = args.env || 'dev';

gulp.task('lint', () =>
    gulp.src('app/**/*.js')
    .pipe(eslint({
        config: path.join(__dirname, 'node_modules/nodules/.eslintrc')
    }))
    .pipe(eslint.format()));

gulp.task('frontend', ['moveFrontend']);

gulp.task('moveFrontend', ['buildFrontend'], () => {
    gulp.src([`node_modules/${frontDirName}/public/**/*`])
    .pipe(gulp.dest('public/frontend/'));
});

gulp.task('apidoc', done => {
    apidoc({
        src: path.join(__dirname, '/app/modules'),
        dest: path.join(__dirname, '/public/doc')
    }, done);
});

gulp.task('buildFrontend', () => {
    var sberApiModules = path.join(__dirname, './node_modules');
    var sberModules = '../../node_modules';

    var gulpArgs = [
        `--environment="${environment}"`,
        `--modulesPath="${sberModules}"`,
        `--apiAddress="${config.hostname}"`,
        `--cwd ${sberModules}/${frontDirName} build`
    ];

    return new Promise((resolve, reject) => {
        exec(
      path.join(sberModules, '/.bin/gulp') + ' ' + gulpArgs.join(' '),
            {
                cwd: path.join(sberApiModules, `/${frontDirName}/`)
            },
      (err, stdout, stderr) => {
          if (err) {
              console.log(err);
              console.log(stderr);
              console.log(stdout);
              reject(err.message);
          } else {
              console.log(stdout);
              resolve();
          }
      }
    );
    });
});
