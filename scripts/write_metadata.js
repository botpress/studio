require('bluebird-global')
const path = require('path')
const { exec } = require('child_process')
const fse = require('fs-extra')

const writeMetadata = async () => {
  const metadata = {
    version: require(path.join(__dirname, '../package.json')).version,
    date: Date.now(),
    branch: 'master'
  }

  try {
    const currentBranch = await Promise.fromCallback(cb => exec('git rev-parse --abbrev-ref HEAD', cb))
    metadata.branch = currentBranch.replace('\n', '')
  } catch (err) {
    console.error(`Couldn't get active branch`, err)
  }

  await fse.writeJSONSync(path.join(__dirname, '../packages/studio-be/src/metadata.json'), metadata, { spaces: 2 })
}

writeMetadata()
