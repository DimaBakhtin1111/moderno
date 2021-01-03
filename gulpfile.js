const {src, dest, task, series, watch, parallel} = require('gulp');
const rm = require( 'gulp-rm' );
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const gulpif = require('gulp-if');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

const env = process.env.NODE_ENV;

const {SRC_PATH, DIST_PATH, STYLES_LIBS, JS_LIBS} = require('./gulp.config');

sass.compiler = require('node-sass');


task( 'clean', () => {
    return src( `${DIST_PATH}/**/*`, { read: false })
        .pipe(rm())
});

task('copy:html', () => {
    return src(`${SRC_PATH}/*.html`)
    .pipe(dest(DIST_PATH))
    .pipe(reload({stream:true}))
});

task('fonts:ttf2woff', () => {
    return src(`${SRC_PATH}/fonts/*.ttf`)
    .pipe(ttf2woff())
    .pipe(dest('dist/fonts'))
});

task('fonts:ttf2woff2', () => {
    return src(`${SRC_PATH}/fonts/*.ttf`)
    .pipe(ttf2woff2())
    .pipe(dest('dist/fonts'))
});

task('styles', () => {
    return src([...STYLES_LIBS,`${SRC_PATH}/styles/main.scss`])
    .pipe(gulpif(env === 'dev', sourcemaps.init()))
    .pipe(concat('main.min.scss'))
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(env === 'prod', autoprefixer({
        overrideBrowserslist:['last 2 versions'],
        cascade: false
    })))
    .pipe(gulpif(env === 'prod', gcmq()))
    .pipe(gulpif(env === 'prod', cleanCSS()))
    .pipe(gulpif(env === 'dev', sourcemaps.write()))
    .pipe(dest('dist'))
    .pipe(reload({stream:true}))
});

task('scripts', () => {
    return src([...JS_LIBS, `${SRC_PATH}/scripts/*.js`])
    .pipe(gulpif(env === 'dev', sourcemaps.init()))
    .pipe(concat('main.min.js', {newLine: ";"}))
    .pipe(gulpif(env === 'build', babel({
        presets: ['@babel/env']
    })))
    .pipe(uglify())
    .pipe(gulpif(env === 'dev', sourcemaps.write()))
    .pipe(dest(DIST_PATH))
    .pipe(reload({stream:true}))
});


task('images', () => {
    return src([`${SRC_PATH}/images/**/*.jpg`,`${SRC_PATH}/images/**/*.png`,`${SRC_PATH}/images/**/*.webp`])
    .pipe(dest('dist/images'));
});

task('icons', () => {
    return src(`${SRC_PATH}/images/icons/*.svg`)
    .pipe(svgo({
        plugins: [
            {
                removeAttrs: { attrs: "(fill|stroke|style|width|height|data.*)" }
            }
        ]
    }))
    .pipe(svgSprite({
        mode: {
            symbol: {
                sprite: "../sprite.svg"
            }
        }
    }))
    .pipe(dest(`${DIST_PATH}/images/icons`))
});

task('server', () => {
    browserSync.init({
        server: {
            baseDir: `./${DIST_PATH}`
        },
        open: false
    });
});

task('watch', () => {
    watch(`./${SRC_PATH}/styles/**/*.scss`, series('styles'));
    watch(`./${SRC_PATH}/*.html`, series('copy:html'));
    watch(`./${SRC_PATH}/scripts/*js`, series('scripts'));
    watch(`./${SRC_PATH}/images/icons/*svg`, series('icons'));
    watch(`./${SRC_PATH}/images/**/*`, series('images'));
});

task('default', series('clean', parallel('copy:html', 'styles', 'scripts','fonts:ttf2woff','fonts:ttf2woff2', 'images', 'icons'), parallel('watch', 'server')));
task('build', series('clean', parallel('copy:html', 'styles', 'scripts', 'fonts:ttf2woff','fonts:ttf2woff2','images', 'icons')));