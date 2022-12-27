const gulp        = require('gulp');
const sass        = require('gulp-sass')(require('sass'));
const cleanCSS    = require('gulp-clean-css');
const rename      = require('gulp-rename');
const concat      = require('gulp-concat');
const order       = require('gulp-order');
const livereload  = require('gulp-livereload');
const connect     = require('gulp-connect');
const open        = require('open');
const del         = require('del');
const uglify      = require('gulp-uglify-es').default;

var paths = {
    styles: {
        src: 'src/css/*.scss',
        dest: 'dist/css'
    },
    scripts: {
        src: 'src/js/**/*.js',
        dest: 'dist/js'
    }
};

var serverPort = 3000;

var runAddr = 'http://localhost:' + serverPort.toString();

function clean() {
    return del(['dist']);
}

function styles() {
    return gulp.src(paths.styles.src)
        .pipe(sass())
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(paths.styles.dest), { sourcemaps: true })
        .pipe(livereload())
        .pipe(connect.reload());
}

function scripts() {
    return gulp.src(paths.scripts.src)
        .pipe(order([
            'src/js/lang/*.js',
            'src/js/i18n.js',
            'src/js/**/*.js'
        ], { 
            base: './',
        }))
        .pipe(concat('app.js'))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(livereload())
        .pipe(connect.reload());
}

function run() {
    build();

    connect.server({
        root: "./",
        livereload: true,
        port: serverPort,
    })

    open(runAddr);

    watch();
}

function watch() {
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.scripts.src, scripts);
}

var build = gulp.series(clean, gulp.parallel(styles, scripts));

exports.styles = styles;
exports.scripts = scripts;
exports.run = run;
exports.watch = watch;
exports.build = build;

exports.default = build;
