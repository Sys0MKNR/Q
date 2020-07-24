const path = require('path')
const util = require('util')

const { src, dest, parallel, series } = require('gulp')
const pug = require('gulp-pug')
const sass = require('gulp-sass')
const minifyCSS = require('gulp-csso')
const uglify = require('gulp-terser')
const gulpCopy = require('gulp-copy')
const del = require('del')
const fs = require('fs-extra')
const { exec: pkgExec } = require('pkg')
const { compile } = require('nexe')

const { exec } = require('child_process')

const runPackage = require('./build/package.js')

// const { version } = require('os')
const execP = util.promisify(exec)

const pkginfo = require('pkginfo')(module, 'version', 'name', 'description', 'author')

const {
  version: VERSION,
  name: NAME,
  description: DESCRIPTION,
  author: AUTHOR
} = module.exports

const BUILD_DIR = 'build'
const DIST_DIR = 'dist'
const PUBLIC_DIR = path.join(BUILD_DIR, 'public')
// const metaPath = path.join(BUILD_DIR, 'meta')

async function clean () {
  await del([
    BUILD_DIR,
    DIST_DIR
  ])
}

async function package () {
  await runPackage()

// function metaData () {
//   return src('meta/**/*')
//     .pipe(gulpCopy(BUILD_DIR, { prefix: 0 }))
// }

function server () {
  return src('src/server/**/*')
    .pipe(gulpCopy(BUILD_DIR, { prefix: 2 }))
}

function html () {
  return src('src/client/pug/*.pug')
    .pipe(pug())
    .pipe(dest(path.join(PUBLIC_DIR, 'html')))
}

function css () {
  return src('src/client/sass/style.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(minifyCSS())
    .pipe(dest(path.join(PUBLIC_DIR, 'css')))
}

function js () {
  return src('src/client/js/*.js', { sourcemaps: true })
    .pipe(uglify())
    .pipe(dest(path.join(PUBLIC_DIR, 'js'), { sourcemaps: true }))
}

function font () {
  return src('src/client/font/*')
    .pipe(gulpCopy(path.join(PUBLIC_DIR, 'font'), { prefix: 3 }))
}

exports.clean = clean
exports.client = parallel(html, css, js, font)
exports.build = series(clean, metaData, server, exports.client)
exports.default = series(exports.build, pkg, editExeMetaData)
