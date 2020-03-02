const path = require('path')

const { src, dest, parallel, series } = require('gulp')
const pug = require('gulp-pug')
const sass = require('gulp-sass')
const minifyCSS = require('gulp-csso')
// const concat = require('gulp-concat')
const uglify = require('gulp-terser')
const gulpCopy = require('gulp-copy')
const del = require('del')

const basePath = 'dist'
const publicPath = path.join(basePath, 'public')

function clean () {
  return del([
    basePath
  ])
}

function server () {
  return src('src/server/**/*')
    .pipe(gulpCopy(basePath, { prefix: 2 }))
}

async function client (cb) {
  parallel(html, css, js, font)()
  cb()
}

function html () {
  return src('src/client/pug/*.pug')
    .pipe(pug())
    .pipe(dest(path.join(publicPath, 'html')))
}

function css () {
  return src('src/client/sass/style.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(minifyCSS())
    .pipe(dest(path.join(publicPath, 'css')))
}

function js () {
  return src('src/client/js/*.js', { sourcemaps: true })
    .pipe(uglify())
    .pipe(dest(path.join(publicPath, 'js'), { sourcemaps: true }))
}

function font () {
  return src('src/client/font/*')
    .pipe(gulpCopy(path.join(publicPath, 'font'), { prefix: 3 }))
}

exports.clean = clean

exports.js = js
exports.css = css
exports.html = html
exports.client = client
exports.default = series(clean, server, client)
