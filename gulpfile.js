const path = require('path')
const util = require('util')

const { src, dest, parallel, series } = require('gulp')
const pug = require('gulp-pug')
const sass = require('gulp-sass')(require('sass'))
const minifyCSS = require('gulp-csso')
const uglify = require('gulp-terser')
const gulpCopy = require('gulp-copy')
const del = require('del')

// const runPKG = require('./build/pkg.js')

const BUILD_DIR = '.build'
const BUILD_TMP = path.join(BUILD_DIR, '.tmp')
const DIST_DIR = 'dist'

const BUILD_APP_DIR = path.join(BUILD_DIR, 'app')
const BUILD_PUBLIC_DIR = path.join(BUILD_APP_DIR, 'public')

async function clean () {
  await del([
    BUILD_TMP,
    DIST_DIR
  ])
}

async function pkg () {
  // await runPKG()
}

function shared () {
  return src('src/shared/**/*')
    .pipe(gulpCopy(BUILD_APP_DIR, { prefix: 1 }))
}

function server () {
  return src('src/server/**/*')
    .pipe(gulpCopy(BUILD_APP_DIR, { prefix: 2 }))
}

function html () {
  return src('src/client/pug/*.pug')
    .pipe(pug())
    .pipe(dest(path.join(BUILD_PUBLIC_DIR, 'html')))
}

function css () {
  return src('src/client/sass/style.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(minifyCSS())
    .pipe(dest(path.join(BUILD_PUBLIC_DIR, 'css')))
}

function js () {
  return src('src/client/js/*.js', { sourcemaps: true })
    .pipe(uglify())
    .pipe(dest(path.join(BUILD_PUBLIC_DIR, 'js'), { sourcemaps: true }))
}

function font () {
  return src('src/client/font/*')
    .pipe(gulpCopy(path.join(BUILD_PUBLIC_DIR, 'font'), { prefix: 3 }))
}

exports.clean = clean
exports.client = parallel(html, css, js, font)
exports.build = series(clean, shared, server, exports.client)
exports.default = series(exports.build, pkg)
