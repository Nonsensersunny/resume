const gulp        = require('gulp');
const sass        = require('gulp-sass');
const cleanCSS   = require('gulp-clean-css');
const rename      = require('gulp-rename');
const browserSync = require('browser-sync').create();
const concat      = require('gulp-concat');
const order       = require('gulp-order');
var uglify        = require('gulp-uglify-es').default;

function css() {
    return gulp.src('src/css/*.sass')
    .pipe(sass())
    .pipe(cleanCSS())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest('dist/css'), {
        sourcemaps: true
    })
}

function js() {
    return gulp.src(['src/js/*.js', 'src/js/lang/*.js'])
    .pipe(order([
        'src/js/lang/*.js',
        'src/js/i18n.js',
        'src/js/info.*',
        'src/js/main.js'
    ], {
        base: './'
    }))
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'), {
        sourcemaps: true
    })
}

function server() {
    return browserSync.init({
        server: {
            baseDir: './'
        }
    })
}

exports.css = css;
exports.js = js;
exports.run = gulp.parallel(css, js, server);
exports.default = gulp.parallel(css, js);