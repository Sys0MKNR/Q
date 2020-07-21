const path = require('path')
const util = require('util')

const { src, dest, parallel, series } = require('gulp')
const pug = require('gulp-pug')
const sass = require('gulp-sass')
const minifyCSS = require('gulp-csso')
// const concat = require('gulp-concat')
const uglify = require('gulp-terser')
const gulpCopy = require('gulp-copy')
const del = require('del')
const fs = require('fs-extra')
const { exec: pkgExec } = require('pkg')
const { compile } = require('nexe')

const { exec } = require('child_process')
const { version } = require('os')
const execP = util.promisify(exec)

const pkginfo = require('pkginfo')(module, 'version', 'name', 'description', 'author')

const {
  version: VERSION,
  name: NAME,
  description: DESCRIPTION,
  author: AUTHOR
} = module.exports

const buildDir = 'build'
const distDir = 'dist'
const publicDir = path.join(buildDir, 'public')
const metaPath = path.join(buildDir, 'meta')

async function clean () {
  await del([
    buildDir,
    distDir
  ])
}

async function pkg () {
  await pkgExec(['package.json', '--target', 'win', '--output', path.join(buildDir, 'q.exe')])
}

async function editExeMetaData () {
  await generateRC()
}

async function generateRC (str) {
  const resourceHacker = '"' + path.join('C:', 'Program Files (x86)', 'Resource Hacker', 'ResourceHacker.exe') + '" '
  const rcToResCMD = `-open ${path.join(buildDir, 'q.rc')} -action compile -save ${path.join(buildDir, 'q.res')}`
  const editMetaDataCMD = `-open ${path.join(buildDir, 'q.exe')} -resource ${path.join(buildDir, 'q.res')} -action addoverwrite  -save ${path.join(distDir, 'q.exe')}`
  const commaVersion = VERSION.replace(/\./gi, ',') + ',0'
  const year = new Date().getFullYear()
  const exeName = NAME + '.exe'

  const values = [
    'FILEVERSION ' + commaVersion,
    'PRODUCTVERSION ' + commaVersion,
    '"FileDescription", ' + `"${DESCRIPTION}"`,
    '"FileVersion", ' + `"${VERSION}"`,
    '"InternalName", ' + `"${exeName}"`,
    '"LegalCopyright", ' + `"Copyright (C) ${year} ${AUTHOR}"`,
    '"OriginalFilename", ' + `"${exeName}"`,
    '"ProductName", ' + `"${NAME}"`,
    '"ProductVersion", ' + `"${VERSION}"`
  ]

  let rcSample = await fs.readFile(path.join(metaPath, 'q_sample.rc'))
  rcSample = rcSample.toString()

  const rcFinal = rcSample.replace(/#[0-9]+/gi, matched => {
    return values[matched.slice(1)]
  })

  await fs.writeFile(path.join(buildDir, 'q.rc'), rcFinal)

  await execP(resourceHacker + rcToResCMD)
  await execP(resourceHacker + editMetaDataCMD)

  return true
}

async function nexe () {
  await compile({
    name: NAME,
    input: path.join(buildDir, 'run.js'),
    output: path.join(distDir, 'q.exe'),
    build: true, // required to use patches
    // loglevel: 'verbose',
    rc: {
      CompanyName: 'Naisu',
      ProductName: NAME,
      FileDescription: DESCRIPTION,
      FileVersion: VERSION,
      ProductVersion: VERSION,
      OriginalFilename: NAME + '.exe',
      InternalName: NAME,
      LegalCopyright: 'Copyright ' + AUTHOR + '. MIT license.'
    },
    patches: [
      async (compiler, next) => {
        return next()
      }
    ]
  })
}

function metaData () {
  return src('meta/**/*')
    .pipe(gulpCopy(buildDir, { prefix: 0 }))
}

function server () {
  return src('src/server/**/*')
    .pipe(gulpCopy(buildDir, { prefix: 2 }))
}

function html () {
  return src('src/client/pug/*.pug')
    .pipe(pug())
    .pipe(dest(path.join(publicDir, 'html')))
}

function css () {
  return src('src/client/sass/style.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(minifyCSS())
    .pipe(dest(path.join(publicDir, 'css')))
}

function js () {
  return src('src/client/js/*.js', { sourcemaps: true })
    .pipe(uglify())
    .pipe(dest(path.join(publicDir, 'js'), { sourcemaps: true }))
}

function font () {
  return src('src/client/font/*')
    .pipe(gulpCopy(path.join(publicDir, 'font'), { prefix: 3 }))
}

exports.clean = clean
exports.client = parallel(html, css, js, font)
exports.build = series(clean, metaData, server, exports.client)
exports.default = series(exports.build, pkg, editExeMetaData)
