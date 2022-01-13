const fse = require('fs-extra')
const path = require('path')

const rootDir = path.join(__dirname, '..')

const files = [
  { source: './src/builtin', dest: './out/builtin' },
  { source: './src/typings/node.d.txt', dest: './out/typings/node.d.txt' },
  { source: './src/typings/es6include.txt', dest: './out/typings/es6include.txt' },
  { source: './src/sdk/botpress.d.ts', dest: './out/sdk/botpress.d.txt' },
  { source: './src/sdk/botpress.runtime.d.ts', dest: './out/sdk/botpress.runtime.d.txt' }
]

for (const file of files) {
  const source = path.join(rootDir, file.source)
  const target = path.join(rootDir, file.dest)

  console.log(`copying "${source}" to "${target}"`)

  fse.copySync(source, target)
}
