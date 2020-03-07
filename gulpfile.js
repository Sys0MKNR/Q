const path = require('path')

const { src, dest, parallel, series } = require('gulp')
const pug = require('gulp-pug')
const sass = require('gulp-sass')
const minifyCSS = require('gulp-csso')
// const concat = require('gulp-concat')
const uglify = require('gulp-terser')
const gulpCopy = require('gulp-copy')
const del = require('del')
const { exec } = require('pkg')

const basePath = 'build'
const publicPath = path.join(basePath, 'public')

async function clean () {
  await del([
    basePath
  ])
}

async function pkg () {
  await exec(['package.json', '--target', 'win', '--output', 'dist/q.exe'])
}

function server () {
  return src('src/server/**/*')
    .pipe(gulpCopy(basePath, { prefix: 2 }))
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
exports.client = parallel(html, css, js, font)
exports.build = series(clean, server, exports.client)
exports.default = series(exports.build, pkg)
