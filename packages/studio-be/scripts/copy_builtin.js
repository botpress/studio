const fse = require('fs-extra')
const path = require('path')

const rootDir = path.join(__dirname, '..')

const source = path.join(rootDir, './src/builtin')
const target = path.join(rootDir, './out/builtin')

console.log(`copying "${source}" to "${target}"`)

fse.copySync(source, target)
