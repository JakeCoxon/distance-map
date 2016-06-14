var gulp = require('gulp');
var webpack = require('gulp-webpack');
var ghPages = require('gulp-gh-pages');

var webpackConfig = require('./webpack.prod.js');

gulp.task('static', function() {

    return gulp.src([
            'src/index.html',
            'src/*.css',
        ])
        .pipe(gulp.dest('./dist/'));

})
gulp.task('fonts', function() {

    return gulp.src([
            'src/fonts/*',
        ])
        .pipe(gulp.dest('./dist/fonts/'));

})
gulp.task('webpack', function() {

    return gulp.src('src/js/index.js')
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest('./dist/'));

});

gulp.task('deploy', ['dist'], function() {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});

gulp.task('dist', ['webpack', 'static', 'fonts'])