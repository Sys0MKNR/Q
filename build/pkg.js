const path = require('path')
const os = require('os')
const util = require('util')
const { exec } = require('child_process')

const execP = util.promisify(exec)

const fetch = require('node-fetch')
const fs = require('fs-extra')
const unzipper = require('unzipper')
const pkgfetch = require('pkg-fetch')
const { exec: pkgExec } = require('pkg')

const pkginfo = require('pkginfo')(module, 'version', 'name', 'description', 'author')

const NODE_VERSION = process.version.slice(1)
const {
  version: VERSION,
  name: NAME,
  description: DESCRIPTION,
  author: AUTHOR
} = module.exports

const BUILD_RES_PATH = path.join(__dirname, 'res')
const BUILD_CACHE = path.join(__dirname, '.cache')
const BUILD_TMP = path.join(__dirname, '.tmp')

const DIST_PATH = path.join(__dirname, '../', 'dist')

const EXE_NAME = NAME + '.exe'
const EXE_PATH = path.join(DIST_PATH, NAME)

const PKG_CACHE_PATH = path.join(os.homedir(), '.pkg-cache')

const RH_URL = 'http://www.angusj.com/resourcehacker/resource_hacker.zip'
const RH_PATH = path.join(BUILD_CACHE, 'rh')
const RH_PATH_ZIP = RH_PATH + '.zip'
const RH_PATH_EXE = path.join(RH_PATH, 'ResourceHacker.exe')

const BIN_NAME = `fetched-v${NODE_VERSION}-win-x64`
const BIN_NAME_TEMP = BIN_NAME + '.tmp'
const BIN_NODE_PATH_ORIGINAL = path.join(PKG_CACHE_PATH, 'v2.6', BIN_NAME)
const BIN_NODE_PATH_TEMP = path.join(BUILD_TMP, BIN_NAME_TEMP)

const RC_NAME = 'q.rc'
const RES_NAME = 'q.res'
const RC_PATH = path.join(BUILD_TMP, RC_NAME)
const RES_PATH = path.join(BUILD_TMP, RES_NAME)

async function build () {
  await fs.ensureDir(BUILD_TMP)
  await fs.ensureDir(BUILD_CACHE)
  await fs.ensureDir(RH_PATH)

  await fetchResourceHacker()
  await fetchBinaries()
  await generateRES()
  await editMetaData()
  await pkgExec([path.join(__dirname, '../', 'package.json'), '--target', `node${NODE_VERSION}-win`, '--output', EXE_PATH])
  await cleanup()
}

async function fetchResourceHacker () {
  if (!fs.existsSync(RH_PATH_ZIP)) {
    // dl exe
    console.log('dl rh')
    const res = await fetch(RH_URL)
    const out = fs.createWriteStream(RH_PATH_ZIP)
    res.body.pipe(out)

    const p = new Promise(resolve => out.on('finish', resolve))
    await p
  }

  if (!fs.existsSync(RH_PATH_EXE)) {
    // unzip exe
    console.log('unzip rh')
    fs.createReadStream(RH_PATH_ZIP)
      // .pipe(unzipper.ParseOne('ResourceHacker.exe'))
      .pipe(unzipper.Extract({ path: RH_PATH }))
  }
}

async function fetchBinaries () {
  if (!fs.existsSync(BIN_NODE_PATH_ORIGINAL)) {
    console.log('dl node bin')
    await pkgfetch.need({ nodeRange: `node${NODE_VERSION}`, platform: 'win', arch: 'x64' })
  }
}

async function generateRES () {
  const commaVersion = VERSION.replace(/\./gi, ',') + ',0'
  const year = new Date().getFullYear()

  const values = [
    'FILEVERSION ' + commaVersion,
    'PRODUCTVERSION ' + commaVersion,
    '"FileDescription", ' + `"${DESCRIPTION}"`,
    '"FileVersion", ' + `"${VERSION}"`,
    '"InternalName", ' + `"${EXE_NAME}"`,
    '"LegalCopyright", ' + `"Copyright (C) ${year} ${AUTHOR}"`,
    '"OriginalFilename", ' + `"${EXE_NAME}"`,
    '"ProductName", ' + `"${NAME}"`,
    '"ProductVersion", ' + `"${VERSION}"`
  ]

  let rcSample = await fs.readFile(path.join(BUILD_RES_PATH, 'q_sample.rc'))
  rcSample = rcSample.toString()

  const rcFinal = rcSample.replace(/#[0-9]+/gi, matched => {
    return values[matched.slice(1)]
  })

  await fs.writeFile(RC_PATH, rcFinal)

  await execP(`${RH_PATH_EXE} -open ${RC_PATH} -action compile -save ${RES_PATH}`)
}

async function editMetaData () {
  // copy to temp
  if (!fs.existsSync(BIN_NODE_PATH_ORIGINAL)) { throw new Error() }
  await fs.copyFile(BIN_NODE_PATH_ORIGINAL, BIN_NODE_PATH_TEMP)

  // edit metadata
  await execP(`${RH_PATH_EXE} -open ${BIN_NODE_PATH_ORIGINAL} -resource ${RES_PATH} -action addoverwrite  -save ${BIN_NODE_PATH_ORIGINAL}`)

  const iconPath = path.join(BUILD_RES_PATH, 'logo.ico')

  await execP(`${RH_PATH_EXE} -open ${BIN_NODE_PATH_ORIGINAL} -resource ${iconPath} -action addoverwrite -mask ICONGROUP,MAINICON, -save ${BIN_NODE_PATH_ORIGINAL}`)
}

async function cleanup () {
  await fs.copyFile(BIN_NODE_PATH_TEMP, BIN_NODE_PATH_ORIGINAL)
}

module.exports = build
