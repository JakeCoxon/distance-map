var gulp = require('gulp');
var webpack = require('gulp-webpack');
var ghPages = require('gulp-gh-pages');
var babel = require('gulp-babel');

var webpackConfig = require('./webpack.prod.js');

gulp.task('lib', function() {

    return gulp.src('src/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('lib'));

})

gulp.task('static', function() {

    return gulp.src([
        'demo/index.html',
    ])
    .pipe(gulp.dest('./dist/'));

})
gulp.task('webpack', function() {

    return gulp.src('demo/index.js')
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest('./dist/'));

});

gulp.task('dist', ['lib', 'webpack', 'static'])

gulp.task('deploy', ['dist'], function() {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});
