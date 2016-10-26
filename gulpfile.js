'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const path = require('path');
const config = require('./config/config');
const apidoc = require('gulp-apidoc');
const args = require('yargs').argv;
const exec = require('child_process').exec;

// will change soon
const frontDirName = 'sber-together';

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
    .pipe(gulp.dest('public/frontend/static/'));
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
	`--production`,
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

gulp.task('buildServicesProdConfig', () => {
    gulp.src('./config/prod/user-config/**/*.{json, js} ')
        .pipe(gulp.dest('./config/user-config'));
});
